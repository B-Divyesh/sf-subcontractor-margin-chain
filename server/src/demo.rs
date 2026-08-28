use crate::domain::{
    new_id, ClientMilestone, CostCommitment, CostState, JobChain, MilestoneStatus, ScopeRevision,
    ScopeStatus,
};
use fs2::FileExt;
use reqwest::{Client, StatusCode};
use serde::{Deserialize, Serialize};
use sha2::{Digest, Sha256};
use std::{
    collections::HashMap,
    fs::{self, OpenOptions},
    io::{Read, Seek, SeekFrom, Write},
    path::{Path, PathBuf},
    sync::{Arc, Mutex, RwLock},
    time::{Duration, SystemTime, UNIX_EPOCH},
};

pub const DEMO_TTL: Duration = Duration::from_secs(24 * 60 * 60);

#[derive(Clone)]
pub struct AppState {
    pub demo: DemoStore,
    pub rate_limits: RateLimits,
    pub metrics: Metrics,
}

impl AppState {
    pub fn production() -> Self {
        let demo = DemoStore::production();
        Self {
            rate_limits: RateLimits::for_store(&demo),
            demo,
            metrics: Metrics::default(),
        }
    }

    pub fn with_demo(demo: DemoStore) -> Self {
        Self {
            rate_limits: RateLimits::for_store(&demo),
            demo,
            metrics: Metrics::default(),
        }
    }
}

impl Default for AppState {
    fn default() -> Self {
        Self::with_demo(DemoStore::default())
    }
}

#[derive(Clone)]
pub struct DemoStore {
    backend: Arc<StoreBackend>,
}

#[derive(Default)]
enum StoreBackend {
    #[default]
    Memory,
    MemoryState(RwLock<HashMap<String, Workspace>>),
    Filesystem(PathBuf),
    Azure(AzureBlobStore),
}

#[derive(Clone, Debug, Deserialize, Serialize)]
pub struct Workspace {
    pub id: String,
    pub expires_at_epoch_seconds: u64,
    pub chains: Vec<JobChain>,
    pub idempotency: HashMap<String, IdempotentResult>,
}

#[derive(Clone, Debug, Deserialize, Serialize)]
pub enum IdempotentResult {
    Chain(JobChain),
}

pub enum Mutation<T> {
    Changed(T),
    Unchanged(T),
}

#[derive(Clone, Debug, Serialize)]
pub struct WorkspaceCreated {
    pub expires_at: u64,
}

impl DemoStore {
    pub fn memory() -> Self {
        Self {
            backend: Arc::new(StoreBackend::MemoryState(RwLock::new(HashMap::new()))),
        }
    }

    pub fn filesystem(path: impl Into<PathBuf>) -> std::io::Result<Self> {
        let path = path.into();
        fs::create_dir_all(&path)?;
        Ok(Self {
            backend: Arc::new(StoreBackend::Filesystem(path)),
        })
    }

    pub fn production() -> Self {
        if let Some(path) = std::env::var_os("DEMO_DATA_DIR").map(PathBuf::from) {
            return Self::filesystem(&path).unwrap_or_else(|error| {
                tracing::warn!(?path, %error, "configured demo directory unavailable; using process-local storage");
                Self::memory()
            });
        }
        if let (Ok(identity_endpoint), Ok(identity_header)) = (
            std::env::var("IDENTITY_ENDPOINT"),
            std::env::var("IDENTITY_HEADER"),
        ) {
            let endpoint = std::env::var("DEMO_BLOB_ENDPOINT")
                .unwrap_or_else(|_| "https://sociobotblob.blob.core.windows.net".into());
            return Self {
                backend: Arc::new(StoreBackend::Azure(AzureBlobStore::new(
                    endpoint,
                    "subcontractor-margin-chain-demo".into(),
                    identity_endpoint,
                    identity_header,
                    std::env::var("AZURE_CLIENT_ID")
                        .unwrap_or_else(|_| "ba10d5bc-6375-4325-8892-4c7a5be500ca".into()),
                ))),
            };
        }

        let path = PathBuf::from("/data/demo-workspaces");
        Self::filesystem(&path).unwrap_or_else(|error| {
            tracing::warn!(?path, %error, "durable demo directory unavailable; using process-local storage");
            Self::memory()
        })
    }

    pub fn backend_name(&self) -> &'static str {
        match self.backend.as_ref() {
            StoreBackend::Azure(_) => "azure-blob-shared",
            StoreBackend::Filesystem(_) => "filesystem-durable",
            StoreBackend::Memory | StoreBackend::MemoryState(_) => "memory-test",
        }
    }

    pub async fn create(&self) -> Result<(String, WorkspaceCreated), StoreError> {
        let id = new_id();
        let expires_at_epoch_seconds = epoch_seconds() + DEMO_TTL.as_secs();
        let workspace = Workspace {
            id: id.clone(),
            expires_at_epoch_seconds,
            chains: seeded_chains(),
            idempotency: HashMap::new(),
        };
        self.insert_new(&workspace).await?;
        Ok((
            id,
            WorkspaceCreated {
                expires_at: expires_at_epoch_seconds,
            },
        ))
    }

    pub async fn exists(&self, id: &str) -> bool {
        self.get(id).await.ok().flatten().is_some()
    }

    pub async fn get(&self, id: &str) -> Result<Option<Workspace>, StoreError> {
        let workspace = match self.backend.as_ref() {
            StoreBackend::Memory => None,
            StoreBackend::MemoryState(store) => {
                store.read().expect("demo store poisoned").get(id).cloned()
            }
            StoreBackend::Filesystem(path) => read_file_workspace(path, id)?,
            StoreBackend::Azure(store) => store.get(id).await?.map(|item| item.0),
        };
        let Some(workspace) = workspace else {
            return Ok(None);
        };
        if workspace.expires_at_epoch_seconds <= epoch_seconds() {
            let _ = self.remove(id).await;
            return Ok(None);
        }
        Ok(Some(workspace))
    }

    pub async fn with_workspace<T, F>(
        &self,
        id: &str,
        operation: F,
    ) -> Result<Option<T>, StoreError>
    where
        F: Fn(&mut Workspace) -> Mutation<T>,
    {
        match self.backend.as_ref() {
            StoreBackend::Memory => Ok(None),
            StoreBackend::MemoryState(store) => {
                let mut store = store.write().expect("demo store poisoned");
                let Some(workspace) = store.get_mut(id) else {
                    return Ok(None);
                };
                if workspace.expires_at_epoch_seconds <= epoch_seconds() {
                    store.remove(id);
                    return Ok(None);
                }
                Ok(Some(match operation(workspace) {
                    Mutation::Changed(result) | Mutation::Unchanged(result) => result,
                }))
            }
            StoreBackend::Filesystem(path) => mutate_file_workspace(path, id, operation),
            StoreBackend::Azure(store) => store.mutate(id, operation).await,
        }
    }

    pub async fn remove(&self, id: &str) -> Result<bool, StoreError> {
        match self.backend.as_ref() {
            StoreBackend::Memory => Ok(false),
            StoreBackend::MemoryState(store) => Ok(store
                .write()
                .expect("demo store poisoned")
                .remove(id)
                .is_some()),
            StoreBackend::Filesystem(path) => match fs::remove_file(workspace_path(path, id)) {
                Ok(()) => Ok(true),
                Err(error) if error.kind() == std::io::ErrorKind::NotFound => Ok(false),
                Err(error) => Err(error.into()),
            },
            StoreBackend::Azure(store) => store.remove(id).await,
        }
    }

    pub async fn purge_expired(&self) -> Result<usize, StoreError> {
        let now = epoch_seconds();
        match self.backend.as_ref() {
            StoreBackend::Memory => Ok(0),
            StoreBackend::MemoryState(store) => {
                let mut store = store.write().expect("demo store poisoned");
                let before = store.len();
                store.retain(|_, workspace| workspace.expires_at_epoch_seconds > now);
                Ok(before - store.len())
            }
            StoreBackend::Filesystem(path) => {
                let mut removed = 0;
                for entry in fs::read_dir(path)? {
                    let entry = entry?;
                    if entry.path().extension().and_then(|value| value.to_str()) != Some("json") {
                        continue;
                    }
                    let Some(id) = entry
                        .path()
                        .file_stem()
                        .and_then(|value| value.to_str())
                        .map(str::to_owned)
                    else {
                        continue;
                    };
                    if read_file_workspace(path, &id)?
                        .is_some_and(|workspace| workspace.expires_at_epoch_seconds <= now)
                        && self.remove(&id).await?
                    {
                        removed += 1;
                    }
                }
                Ok(removed)
            }
            StoreBackend::Azure(store) => store.purge_expired(now).await,
        }
    }

    pub async fn ready(&self) -> bool {
        match self.backend.as_ref() {
            StoreBackend::Azure(store) => store.ensure_container().await.is_ok(),
            StoreBackend::Filesystem(path) => fs::metadata(path).is_ok(),
            StoreBackend::Memory | StoreBackend::MemoryState(_) => true,
        }
    }

    async fn insert_new(&self, workspace: &Workspace) -> Result<(), StoreError> {
        match self.backend.as_ref() {
            StoreBackend::Memory => Err(StoreError::Unavailable(
                "memory store was not initialized".into(),
            )),
            StoreBackend::MemoryState(store) => {
                store
                    .write()
                    .expect("demo store poisoned")
                    .insert(workspace.id.clone(), workspace.clone());
                Ok(())
            }
            StoreBackend::Filesystem(path) => write_new_file_workspace(path, workspace),
            StoreBackend::Azure(store) => store.insert_new(workspace).await,
        }
    }
}

impl Default for DemoStore {
    fn default() -> Self {
        Self::memory()
    }
}

#[derive(Debug)]
pub enum StoreError {
    Io(std::io::Error),
    Serialization(serde_json::Error),
    Unavailable(String),
}

impl From<std::io::Error> for StoreError {
    fn from(value: std::io::Error) -> Self {
        Self::Io(value)
    }
}
impl From<serde_json::Error> for StoreError {
    fn from(value: serde_json::Error) -> Self {
        Self::Serialization(value)
    }
}

fn workspace_path(directory: &Path, id: &str) -> PathBuf {
    directory.join(format!("{id}.json"))
}

fn read_file_workspace(directory: &Path, id: &str) -> Result<Option<Workspace>, StoreError> {
    let mut file = match OpenOptions::new()
        .read(true)
        .open(workspace_path(directory, id))
    {
        Ok(file) => file,
        Err(error) if error.kind() == std::io::ErrorKind::NotFound => return Ok(None),
        Err(error) => return Err(error.into()),
    };
    file.lock_shared()?;
    let mut bytes = Vec::new();
    file.read_to_end(&mut bytes)?;
    Ok(Some(serde_json::from_slice(&bytes)?))
}

fn write_new_file_workspace(directory: &Path, workspace: &Workspace) -> Result<(), StoreError> {
    let mut file = OpenOptions::new()
        .write(true)
        .create_new(true)
        .open(workspace_path(directory, &workspace.id))?;
    file.write_all(&serde_json::to_vec(workspace)?)?;
    file.sync_all()?;
    Ok(())
}

fn mutate_file_workspace<T, F>(
    directory: &Path,
    id: &str,
    operation: F,
) -> Result<Option<T>, StoreError>
where
    F: Fn(&mut Workspace) -> Mutation<T>,
{
    let path = workspace_path(directory, id);
    let mut file = match OpenOptions::new().read(true).write(true).open(path) {
        Ok(file) => file,
        Err(error) if error.kind() == std::io::ErrorKind::NotFound => return Ok(None),
        Err(error) => return Err(error.into()),
    };
    file.lock_exclusive()?;
    let mut bytes = Vec::new();
    file.read_to_end(&mut bytes)?;
    let mut workspace: Workspace = serde_json::from_slice(&bytes)?;
    if workspace.expires_at_epoch_seconds <= epoch_seconds() {
        return Ok(None);
    }
    match operation(&mut workspace) {
        Mutation::Unchanged(result) => Ok(Some(result)),
        Mutation::Changed(result) => {
            file.seek(SeekFrom::Start(0))?;
            file.set_len(0)?;
            file.write_all(&serde_json::to_vec(&workspace)?)?;
            file.sync_all()?;
            Ok(Some(result))
        }
    }
}

#[derive(Clone)]
struct AzureBlobStore {
    client: Client,
    endpoint: String,
    container: String,
    identity_endpoint: String,
    identity_header: String,
    client_id: String,
    token: Arc<tokio::sync::Mutex<Option<AccessToken>>>,
    container_ready: Arc<tokio::sync::OnceCell<()>>,
}

#[derive(Clone)]
struct AccessToken {
    value: String,
    expires_at: u64,
}

#[derive(Deserialize)]
struct ManagedIdentityToken {
    access_token: String,
    expires_on: serde_json::Value,
}

#[derive(Deserialize)]
#[serde(rename_all = "PascalCase")]
struct BlobList {
    blobs: BlobItems,
}

#[derive(Deserialize)]
#[serde(rename_all = "PascalCase")]
struct BlobItems {
    #[serde(default)]
    blob: Vec<BlobItem>,
}

#[derive(Deserialize)]
#[serde(rename_all = "PascalCase")]
struct BlobItem {
    name: String,
}

impl AzureBlobStore {
    fn new(
        endpoint: String,
        container: String,
        identity_endpoint: String,
        identity_header: String,
        client_id: String,
    ) -> Self {
        Self {
            client: Client::new(),
            endpoint: endpoint.trim_end_matches('/').into(),
            container,
            identity_endpoint,
            identity_header,
            client_id,
            token: Arc::new(tokio::sync::Mutex::new(None)),
            container_ready: Arc::new(tokio::sync::OnceCell::new()),
        }
    }

    async fn access_token(&self) -> Result<String, StoreError> {
        let mut cached = self.token.lock().await;
        if let Some(token) = cached
            .as_ref()
            .filter(|token| token.expires_at > epoch_seconds() + 120)
        {
            return Ok(token.value.clone());
        }
        let response = self
            .client
            .get(&self.identity_endpoint)
            .query(&[
                ("api-version", "2019-08-01"),
                ("resource", "https://storage.azure.com/"),
                ("client_id", self.client_id.as_str()),
            ])
            .header("X-IDENTITY-HEADER", &self.identity_header)
            .send()
            .await
            .map_err(|error| StoreError::Unavailable(error.to_string()))?;
        if !response.status().is_success() {
            return Err(StoreError::Unavailable(format!(
                "managed identity returned {}",
                response.status()
            )));
        }
        let body: ManagedIdentityToken = response
            .json()
            .await
            .map_err(|error| StoreError::Unavailable(error.to_string()))?;
        let expires_at = body
            .expires_on
            .as_u64()
            .or_else(|| body.expires_on.as_str()?.parse().ok())
            .unwrap_or(epoch_seconds() + 300);
        *cached = Some(AccessToken {
            value: body.access_token.clone(),
            expires_at,
        });
        Ok(body.access_token)
    }

    fn container_url(&self) -> String {
        format!("{}/{}", self.endpoint, self.container)
    }
    fn blob_url(&self, id: &str) -> String {
        format!("{}/{}/{}.json", self.endpoint, self.container, id)
    }
    fn rate_blob_url(&self, key: &str) -> String {
        format!(
            "{}/{}/_rate/{}.json",
            self.endpoint,
            self.container,
            rate_key(key)
        )
    }

    async fn request(
        &self,
        method: reqwest::Method,
        url: String,
    ) -> Result<reqwest::RequestBuilder, StoreError> {
        let token = self.access_token().await?;
        Ok(self
            .client
            .request(method, url)
            .bearer_auth(token)
            .header("x-ms-version", "2023-11-03")
            .header("x-ms-date", httpdate::fmt_http_date(SystemTime::now())))
    }

    async fn ensure_container(&self) -> Result<(), StoreError> {
        self.container_ready
            .get_or_try_init(|| async {
                let response = self
                    .request(
                        reqwest::Method::PUT,
                        format!("{}?restype=container", self.container_url()),
                    )
                    .await?
                    .header("Content-Length", "0")
                    .send()
                    .await
                    .map_err(|error| StoreError::Unavailable(error.to_string()))?;
                if response.status().is_success() || response.status() == StatusCode::CONFLICT {
                    Ok(())
                } else {
                    Err(StoreError::Unavailable(format!(
                        "blob container returned {}",
                        response.status()
                    )))
                }
            })
            .await
            .copied()
    }

    async fn insert_new(&self, workspace: &Workspace) -> Result<(), StoreError> {
        self.ensure_container().await?;
        let response = self
            .request(reqwest::Method::PUT, self.blob_url(&workspace.id))
            .await?
            .header("x-ms-blob-type", "BlockBlob")
            .header("If-None-Match", "*")
            .json(workspace)
            .send()
            .await
            .map_err(|error| StoreError::Unavailable(error.to_string()))?;
        if response.status().is_success() {
            Ok(())
        } else {
            Err(StoreError::Unavailable(format!(
                "blob create returned {}",
                response.status()
            )))
        }
    }

    async fn get(&self, id: &str) -> Result<Option<(Workspace, String)>, StoreError> {
        let response = self
            .request(reqwest::Method::GET, self.blob_url(id))
            .await?
            .send()
            .await
            .map_err(|error| StoreError::Unavailable(error.to_string()))?;
        if response.status() == StatusCode::NOT_FOUND {
            return Ok(None);
        }
        if !response.status().is_success() {
            return Err(StoreError::Unavailable(format!(
                "blob read returned {}",
                response.status()
            )));
        }
        let etag = response
            .headers()
            .get("etag")
            .and_then(|value| value.to_str().ok())
            .unwrap_or_default()
            .to_owned();
        let workspace = response
            .json()
            .await
            .map_err(|error| StoreError::Unavailable(error.to_string()))?;
        Ok(Some((workspace, etag)))
    }

    async fn get_rate_bucket(&self, key: &str) -> Result<Option<(RateBucket, String)>, StoreError> {
        let response = self
            .request(reqwest::Method::GET, self.rate_blob_url(key))
            .await?
            .send()
            .await
            .map_err(|error| StoreError::Unavailable(error.to_string()))?;
        if response.status() == StatusCode::NOT_FOUND {
            return Ok(None);
        }
        if !response.status().is_success() {
            return Err(StoreError::Unavailable(format!(
                "rate-limit read returned {}",
                response.status()
            )));
        }
        let etag = response
            .headers()
            .get("etag")
            .and_then(|value| value.to_str().ok())
            .unwrap_or_default()
            .to_owned();
        let bucket = response
            .json()
            .await
            .map_err(|error| StoreError::Unavailable(error.to_string()))?;
        Ok(Some((bucket, etag)))
    }

    async fn check_rate_limit(
        &self,
        key: &str,
        allowance: usize,
        period: Duration,
    ) -> Result<(), RateLimitError> {
        self.ensure_container()
            .await
            .map_err(RateLimitError::Unavailable)?;
        let request_started_at = epoch_milliseconds();
        for attempt in 0..64 {
            let current = self
                .get_rate_bucket(key)
                .await
                .map_err(RateLimitError::Unavailable)?;
            let (mut bucket, etag) = current
                .map(|(bucket, etag)| (bucket, Some(etag)))
                .unwrap_or_default();
            check_bucket(
                &mut bucket.accepted_at_millis,
                request_started_at,
                allowance,
                period,
            )?;
            let mut request = self
                .request(reqwest::Method::PUT, self.rate_blob_url(key))
                .await
                .map_err(RateLimitError::Unavailable)?
                .header("x-ms-blob-type", "BlockBlob")
                .json(&bucket);
            request = if let Some(etag) = etag {
                request.header("If-Match", etag)
            } else {
                request.header("If-None-Match", "*")
            };
            let response = request.send().await.map_err(|error| {
                RateLimitError::Unavailable(StoreError::Unavailable(error.to_string()))
            })?;
            if response.status().is_success() {
                return Ok(());
            }
            if response.status() != StatusCode::PRECONDITION_FAILED
                && response.status() != StatusCode::CONFLICT
            {
                return Err(RateLimitError::Unavailable(StoreError::Unavailable(
                    format!("rate-limit update returned {}", response.status()),
                )));
            }
            tokio::time::sleep(contention_backoff(attempt)).await;
        }
        Err(RateLimitError::Unavailable(StoreError::Unavailable(
            "shared rate-limit update remained busy after retries".into(),
        )))
    }

    async fn mutate<T, F>(&self, id: &str, operation: F) -> Result<Option<T>, StoreError>
    where
        F: Fn(&mut Workspace) -> Mutation<T>,
    {
        for attempt in 0..64 {
            let Some((mut workspace, etag)) = self.get(id).await? else {
                return Ok(None);
            };
            if workspace.expires_at_epoch_seconds <= epoch_seconds() {
                let _ = self.remove(id).await;
                return Ok(None);
            }
            let result = match operation(&mut workspace) {
                Mutation::Unchanged(result) => return Ok(Some(result)),
                Mutation::Changed(result) => result,
            };
            let response = self
                .request(reqwest::Method::PUT, self.blob_url(id))
                .await?
                .header("x-ms-blob-type", "BlockBlob")
                .header("If-Match", etag)
                .json(&workspace)
                .send()
                .await
                .map_err(|error| StoreError::Unavailable(error.to_string()))?;
            if response.status().is_success() {
                return Ok(Some(result));
            }
            if response.status() != StatusCode::PRECONDITION_FAILED {
                return Err(StoreError::Unavailable(format!(
                    "blob update returned {}",
                    response.status()
                )));
            }
            tokio::time::sleep(contention_backoff(attempt)).await;
        }
        Err(StoreError::Unavailable(
            "shared demo update remained busy after retries".into(),
        ))
    }

    async fn remove(&self, id: &str) -> Result<bool, StoreError> {
        let response = self
            .request(reqwest::Method::DELETE, self.blob_url(id))
            .await?
            .send()
            .await
            .map_err(|error| StoreError::Unavailable(error.to_string()))?;
        if response.status().is_success() {
            Ok(true)
        } else if response.status() == StatusCode::NOT_FOUND {
            Ok(false)
        } else {
            Err(StoreError::Unavailable(format!(
                "blob delete returned {}",
                response.status()
            )))
        }
    }

    async fn purge_expired(&self, now: u64) -> Result<usize, StoreError> {
        self.ensure_container().await?;
        let response = self
            .request(
                reqwest::Method::GET,
                format!("{}?restype=container&comp=list", self.container_url()),
            )
            .await?
            .send()
            .await
            .map_err(|error| StoreError::Unavailable(error.to_string()))?;
        if !response.status().is_success() {
            return Err(StoreError::Unavailable(format!(
                "blob list returned {}",
                response.status()
            )));
        }
        let body = response
            .text()
            .await
            .map_err(|error| StoreError::Unavailable(error.to_string()))?;
        let list: BlobList = quick_xml::de::from_str(&body)
            .map_err(|error| StoreError::Unavailable(error.to_string()))?;
        let mut removed = 0;
        for item in list.blobs.blob {
            if item.name.starts_with("_rate/") {
                continue;
            }
            let Some(id) = item.name.strip_suffix(".json") else {
                continue;
            };
            if self
                .get(id)
                .await?
                .is_some_and(|(workspace, _)| workspace.expires_at_epoch_seconds <= now)
                && self.remove(id).await?
            {
                removed += 1;
            }
        }
        Ok(removed)
    }
}

#[derive(Clone, Default)]
pub struct Metrics {
    pub requests: Arc<std::sync::atomic::AtomicU64>,
}

fn epoch_seconds() -> u64 {
    SystemTime::now()
        .duration_since(UNIX_EPOCH)
        .unwrap_or_default()
        .as_secs()
}

fn epoch_milliseconds() -> u64 {
    u64::try_from(
        SystemTime::now()
            .duration_since(UNIX_EPOCH)
            .unwrap_or_default()
            .as_millis(),
    )
    .unwrap_or(u64::MAX)
}

#[derive(Clone)]
pub struct RateLimits {
    backend: Arc<RateLimitBackend>,
}

enum RateLimitBackend {
    Memory(Mutex<HashMap<String, Vec<u64>>>),
    Filesystem(PathBuf),
    Azure(AzureBlobStore),
}

#[derive(Debug)]
pub enum RateLimitError {
    Limited(u64),
    Unavailable(StoreError),
}

impl RateLimits {
    fn for_store(store: &DemoStore) -> Self {
        let backend = match store.backend.as_ref() {
            StoreBackend::Azure(store) => RateLimitBackend::Azure(store.clone()),
            StoreBackend::Filesystem(path) => {
                RateLimitBackend::Filesystem(path.join("rate-limits"))
            }
            StoreBackend::Memory | StoreBackend::MemoryState(_) => {
                RateLimitBackend::Memory(Mutex::new(HashMap::new()))
            }
        };
        Self {
            backend: Arc::new(backend),
        }
    }

    pub async fn check(
        &self,
        key: &str,
        allowance: usize,
        period: Duration,
    ) -> Result<(), RateLimitError> {
        match self.backend.as_ref() {
            RateLimitBackend::Memory(buckets) => {
                let now = epoch_milliseconds();
                let mut buckets = buckets.lock().expect("rate-limit store poisoned");
                check_bucket(
                    buckets.entry(key.to_owned()).or_default(),
                    now,
                    allowance,
                    period,
                )
            }
            RateLimitBackend::Filesystem(directory) => {
                check_file_bucket(directory, key, allowance, period)
            }
            RateLimitBackend::Azure(store) => store.check_rate_limit(key, allowance, period).await,
        }
    }
}

impl Default for RateLimits {
    fn default() -> Self {
        Self {
            backend: Arc::new(RateLimitBackend::Memory(Mutex::new(HashMap::new()))),
        }
    }
}

#[derive(Default, Deserialize, Serialize)]
struct RateBucket {
    accepted_at_millis: Vec<u64>,
}

fn check_bucket(
    entries: &mut Vec<u64>,
    now: u64,
    allowance: usize,
    period: Duration,
) -> Result<(), RateLimitError> {
    let period_millis = u64::try_from(period.as_millis()).unwrap_or(u64::MAX);
    entries.retain(|accepted| now.saturating_sub(*accepted) < period_millis);
    if entries.len() >= allowance {
        let retry_millis = period_millis.saturating_sub(now.saturating_sub(entries[0]));
        return Err(RateLimitError::Limited(retry_millis.div_ceil(1_000).max(1)));
    }
    entries.push(now);
    Ok(())
}

fn rate_key(key: &str) -> String {
    let digest = Sha256::digest(key.as_bytes());
    digest.iter().map(|byte| format!("{byte:02x}")).collect()
}

fn check_file_bucket(
    directory: &Path,
    key: &str,
    allowance: usize,
    period: Duration,
) -> Result<(), RateLimitError> {
    fs::create_dir_all(directory)
        .map_err(StoreError::from)
        .map_err(RateLimitError::Unavailable)?;
    let path = directory.join(format!("{}.json", rate_key(key)));
    let mut file = OpenOptions::new()
        .read(true)
        .write(true)
        .create(true)
        .truncate(false)
        .open(path)
        .map_err(StoreError::from)
        .map_err(RateLimitError::Unavailable)?;
    file.lock_exclusive()
        .map_err(StoreError::from)
        .map_err(RateLimitError::Unavailable)?;
    let mut bytes = Vec::new();
    file.read_to_end(&mut bytes)
        .map_err(StoreError::from)
        .map_err(RateLimitError::Unavailable)?;
    let mut bucket = if bytes.is_empty() {
        RateBucket::default()
    } else {
        serde_json::from_slice(&bytes)
            .map_err(StoreError::from)
            .map_err(RateLimitError::Unavailable)?
    };
    let result = check_bucket(
        &mut bucket.accepted_at_millis,
        epoch_milliseconds(),
        allowance,
        period,
    );
    file.seek(SeekFrom::Start(0))
        .map_err(StoreError::from)
        .map_err(RateLimitError::Unavailable)?;
    file.set_len(0)
        .map_err(StoreError::from)
        .map_err(RateLimitError::Unavailable)?;
    let encoded = serde_json::to_vec(&bucket)
        .map_err(StoreError::from)
        .map_err(RateLimitError::Unavailable)?;
    file.write_all(&encoded)
        .map_err(StoreError::from)
        .map_err(RateLimitError::Unavailable)?;
    file.sync_all()
        .map_err(StoreError::from)
        .map_err(RateLimitError::Unavailable)?;
    result
}

fn contention_backoff(attempt: u32) -> Duration {
    Duration::from_millis((2_u64.saturating_pow(attempt.min(5))).min(32))
}

#[derive(Clone, Debug, Deserialize)]
pub struct NewChain {
    pub name: String,
    pub contracting_client: String,
    pub end_client: Option<String>,
    pub approved_scope: String,
    pub client_commitment_minor: i64,
    pub margin_floor_basis_points: i64,
    pub subcontractor: String,
    pub cost_role: String,
    pub cost_minor: i64,
}

impl NewChain {
    pub fn validate(&self) -> Result<(), (&'static str, &'static str)> {
        validate_text("name", &self.name, 2, 120)?;
        validate_text("contracting_client", &self.contracting_client, 2, 120)?;
        if let Some(end_client) = &self.end_client {
            if !end_client.trim().is_empty() {
                validate_text("end_client", end_client, 2, 120)?;
            }
        }
        validate_text("approved_scope", &self.approved_scope, 4, 2_000)?;
        validate_text("subcontractor", &self.subcontractor, 2, 120)?;
        validate_text("cost_role", &self.cost_role, 2, 120)?;
        if self.client_commitment_minor <= 0 || self.client_commitment_minor > 10_000_000_000 {
            return Err((
                "client_commitment_minor",
                "Enter a client commitment above zero.",
            ));
        }
        if self.cost_minor < 0 || self.cost_minor > 10_000_000_000 {
            return Err(("cost_minor", "Enter a committed cost of zero or more."));
        }
        if !(0..=10_000).contains(&self.margin_floor_basis_points) {
            return Err((
                "margin_floor_basis_points",
                "Enter a margin floor from 0% to 100%.",
            ));
        }
        Ok(())
    }

    pub fn into_chain(self) -> JobChain {
        JobChain {
            id: new_id(),
            name: self.name.trim().to_owned(),
            contracting_client: self.contracting_client.trim().to_owned(),
            end_client: self
                .end_client
                .map(|value| value.trim().to_owned())
                .filter(|value| !value.is_empty()),
            currency: "USD".into(),
            client_commitment_minor: Some(self.client_commitment_minor),
            margin_floor_basis_points: self.margin_floor_basis_points,
            scopes: vec![ScopeRevision {
                id: new_id(),
                description: self.approved_scope.trim().to_owned(),
                status: ScopeStatus::Approved,
                linked_milestone_id: None,
            }],
            costs: vec![CostCommitment {
                id: new_id(),
                subcontractor: self.subcontractor.trim().to_owned(),
                role: self.cost_role.trim().to_owned(),
                amount_minor: self.cost_minor,
                state: CostState::Committed,
            }],
            milestones: vec![],
            last_risk_cause: Some("First subcontractor commitment".into()),
            version: 1,
        }
    }
}

fn validate_text(
    field: &'static str,
    value: &str,
    minimum: usize,
    maximum: usize,
) -> Result<(), (&'static str, &'static str)> {
    let count = value.trim().chars().count();
    if count < minimum || count > maximum {
        return Err((field, "Check this field and try again."));
    }
    Ok(())
}

pub fn seeded_chains() -> Vec<JobChain> {
    vec![annual_report(), autumn_launch(), field_interview()]
}

fn autumn_launch() -> JobChain {
    JobChain {
        id: "autumn-launch-films".into(),
        name: "Autumn launch films".into(),
        contracting_client: "Cinder & Co.".into(),
        end_client: Some("Aster Bikes".into()),
        currency: "USD".into(),
        client_commitment_minor: Some(2_400_000),
        margin_floor_basis_points: 2_000,
        scopes: vec![
            ScopeRevision {
                id: "launch-film".into(),
                description: "Launch film".into(),
                status: ScopeStatus::Approved,
                linked_milestone_id: Some("autumn-deposit".into()),
            },
            ScopeRevision {
                id: "social-cutdown".into(),
                description: "Social cut-down revision".into(),
                status: ScopeStatus::Pending,
                linked_milestone_id: Some("autumn-balance".into()),
            },
        ],
        costs: vec![
            CostCommitment {
                id: "samira-edit".into(),
                subcontractor: "Samira Chen".into(),
                role: "Edit".into(),
                amount_minor: 620_000,
                state: CostState::Committed,
            },
            CostCommitment {
                id: "osei-production".into(),
                subcontractor: "Osei Reed".into(),
                role: "Production".into(),
                amount_minor: 830_000,
                state: CostState::Committed,
            },
        ],
        milestones: vec![
            ClientMilestone {
                id: "autumn-deposit".into(),
                label: "Production deposit".into(),
                amount_minor: 1_200_000,
                status: MilestoneStatus::Sent,
                linked_scope_id: Some("launch-film".into()),
            },
            ClientMilestone {
                id: "autumn-balance".into(),
                label: "Final delivery".into(),
                amount_minor: 1_200_000,
                status: MilestoneStatus::Planned,
                linked_scope_id: Some("social-cutdown".into()),
            },
        ],
        last_risk_cause: Some("Social cut-down revision is not priced".into()),
        version: 1,
    }
}

fn annual_report() -> JobChain {
    JobChain {
        id: "annual-report-microsite".into(),
        name: "Annual report microsite".into(),
        contracting_client: "Common Thread Partners".into(),
        end_client: Some("Harbor Grid".into()),
        currency: "USD".into(),
        client_commitment_minor: Some(1_800_000),
        margin_floor_basis_points: 2_500,
        scopes: vec![ScopeRevision {
            id: "accessibility-review".into(),
            description: "Accessibility review".into(),
            status: ScopeStatus::Approved,
            linked_milestone_id: Some("annual-first-invoice".into()),
        }],
        costs: vec![CostCommitment {
            id: "microsite-build".into(),
            subcontractor: "Rafi Ortiz".into(),
            role: "Design and build".into(),
            amount_minor: 1_380_000,
            state: CostState::Committed,
        }],
        milestones: vec![ClientMilestone {
            id: "annual-first-invoice".into(),
            label: "First client invoice".into(),
            amount_minor: 1_800_000,
            status: MilestoneStatus::Due,
            linked_scope_id: Some("accessibility-review".into()),
        }],
        last_risk_cause: Some("Accessibility review was added".into()),
        version: 1,
    }
}

fn field_interview() -> JobChain {
    JobChain {
        id: "field-interview-edit".into(),
        name: "Field interview edit".into(),
        contracting_client: "Merritt Research".into(),
        end_client: None,
        currency: "USD".into(),
        client_commitment_minor: Some(960_000),
        margin_floor_basis_points: 3_000,
        scopes: vec![ScopeRevision {
            id: "interview-edit".into(),
            description: "Field interview edit".into(),
            status: ScopeStatus::Approved,
            linked_milestone_id: Some("interview-invoice".into()),
        }],
        costs: vec![CostCommitment {
            id: "interview-editor".into(),
            subcontractor: "Ari Bell".into(),
            role: "Interview edit".into(),
            amount_minor: 540_000,
            state: CostState::Committed,
        }],
        milestones: vec![ClientMilestone {
            id: "interview-invoice".into(),
            label: "Client invoice".into(),
            amount_minor: 960_000,
            status: MilestoneStatus::Paid,
            linked_scope_id: Some("interview-edit".into()),
        }],
        last_risk_cause: None,
        version: 1,
    }
}

#[cfg(test)]
mod tests {
    use super::*;
    use crate::domain::RiskState;

    #[test]
    fn fixture_values_match_the_demo_contract() {
        let chains = seeded_chains();
        let autumn = chains
            .iter()
            .find(|chain| chain.id == "autumn-launch-films")
            .unwrap();
        let annual = chains
            .iter()
            .find(|chain| chain.id == "annual-report-microsite")
            .unwrap();
        assert_eq!(autumn.calculation().expected_margin_minor, Some(950_000));
        assert_eq!(autumn.calculation().margin_percent_tenths, Some(396));
        assert_eq!(annual.calculation().margin_at_risk_minor, Some(30_000));
        assert_eq!(annual.calculation().risk_state, RiskState::BelowFloor);
    }

    #[tokio::test]
    async fn removing_a_workspace_invalidates_its_identifier() {
        let store = DemoStore::default();
        let (id, _) = store.create().await.unwrap();
        assert!(store.exists(&id).await);
        assert!(store.remove(&id).await.unwrap());
        assert!(!store.exists(&id).await);
    }

    #[test]
    fn a_concurrent_burst_uses_request_arrival_time_for_the_shared_allowance() {
        let mut accepted = Vec::new();
        let arrival = 10_000;
        for _ in 0..40 {
            assert!(check_bucket(&mut accepted, arrival, 40, Duration::from_secs(1)).is_ok());
        }
        assert!(matches!(
            check_bucket(&mut accepted, arrival, 40, Duration::from_secs(1)),
            Err(RateLimitError::Limited(1))
        ));
        assert!(check_bucket(&mut accepted, arrival + 1_000, 40, Duration::from_secs(1)).is_ok());
    }
}
