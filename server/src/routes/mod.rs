use crate::{
    demo::{
        AgencyMember, AgencyRole, AppState, IdempotentResult, Mutation, NewChain, RateLimitError,
        StoreError, WorkspaceCreated,
    },
    domain::{
        new_id, CostCommitment, CostState, JobChain, MarginCalculation, MilestoneStatus,
        ScopeStatus,
    },
};
use axum::{
    extract::{Path, Request, State},
    http::{header, HeaderMap, HeaderName, HeaderValue, StatusCode},
    middleware::Next,
    response::{IntoResponse, Response},
    routing::{delete, get, patch, post},
    Json, Router,
};
use serde::{Deserialize, Serialize};
use std::sync::atomic::Ordering;
use std::time::Duration;

const COOKIE_NAME: &str = "smc_demo";
const AGENCY_COOKIE_NAME: &str = "smc_agency";

#[derive(Serialize)]
struct HealthResponse {
    status: &'static str,
    build_sha: &'static str,
}

#[derive(Clone, Debug, Serialize)]
pub struct JobView {
    #[serde(flatten)]
    pub chain: JobChain,
    pub calculation: MarginCalculation,
}

impl From<JobChain> for JobView {
    fn from(chain: JobChain) -> Self {
        let calculation = chain.calculation();
        Self { chain, calculation }
    }
}

#[derive(Serialize)]
struct ChainList {
    chains: Vec<JobView>,
}

#[derive(Debug, Serialize)]
struct Problem {
    #[serde(rename = "type")]
    kind: &'static str,
    title: &'static str,
    status: u16,
    code: &'static str,
    detail: String,
    request_id: String,
    #[serde(skip_serializing_if = "Option::is_none")]
    field: Option<&'static str>,
}

pub struct ApiError {
    status: StatusCode,
    code: &'static str,
    title: &'static str,
    detail: String,
    field: Option<&'static str>,
    retry_after: Option<u64>,
}

impl ApiError {
    fn new(
        status: StatusCode,
        code: &'static str,
        title: &'static str,
        detail: impl Into<String>,
    ) -> Self {
        Self {
            status,
            code,
            title,
            detail: detail.into(),
            field: None,
            retry_after: None,
        }
    }

    fn field(mut self, field: &'static str) -> Self {
        self.field = Some(field);
        self
    }

    pub fn rate_limited(retry_after: u64) -> Self {
        Self {
            status: StatusCode::TOO_MANY_REQUESTS,
            code: "rate_limited",
            title: "Too many requests",
            detail: "Too many requests reached the demo. Wait, then try again.".into(),
            field: None,
            retry_after: Some(retry_after),
        }
    }
}

impl IntoResponse for ApiError {
    fn into_response(self) -> Response {
        let request_id = new_id();
        let problem = Problem {
            kind: "https://subcontractor-margin-chain.sociobot.in/problems/api",
            title: self.title,
            status: self.status.as_u16(),
            code: self.code,
            detail: self.detail,
            request_id: request_id.clone(),
            field: self.field,
        };
        let mut response = (self.status, Json(problem)).into_response();
        response.headers_mut().insert(
            header::CONTENT_TYPE,
            HeaderValue::from_static("application/problem+json"),
        );
        response
            .headers_mut()
            .insert(header::CACHE_CONTROL, HeaderValue::from_static("no-store"));
        response.headers_mut().insert(
            HeaderName::from_static("x-request-id"),
            HeaderValue::from_str(&request_id)
                .unwrap_or_else(|_| HeaderValue::from_static("unknown")),
        );
        if let Some(seconds) = self.retry_after {
            response.headers_mut().insert(
                header::RETRY_AFTER,
                HeaderValue::from_str(&seconds.to_string())
                    .unwrap_or_else(|_| HeaderValue::from_static("1")),
            );
        }
        response
    }
}

pub fn health_router() -> Router<AppState> {
    Router::new()
        .route("/health", get(health))
        .route("/ready", get(ready))
}

pub fn operations_router() -> Router<AppState> {
    Router::new().route("/internal/metrics", get(metrics))
}

pub fn api_router() -> Router<AppState> {
    Router::new()
        .route("/api/v1/demo/workspaces", post(create_workspace))
        .route("/api/v1/demo/workspaces/current", delete(delete_workspace))
        .route("/api/v1/demo/chains", get(list_chains).post(create_chain))
        .route(
            "/api/v1/demo/chains/{chain_id}",
            get(get_chain).patch(update_chain),
        )
        .route("/api/v1/demo/chains/{chain_id}/costs", post(add_cost))
        .route(
            "/api/v1/demo/chains/{chain_id}/scopes/{scope_id}",
            patch(update_scope),
        )
        .route(
            "/api/v1/demo/chains/{chain_id}/milestones/{milestone_id}",
            patch(update_milestone),
        )
        // The app routes intentionally use a different cookie and are never
        // provisioned from demo fixtures. The handlers share domain validation
        // and durable storage, so money rules cannot drift between modes.
        .route("/api/v1/app/agency", post(create_agency).get(get_agency))
        .route("/api/v1/app/members", post(add_member))
        .route(
            "/api/v1/app/access/{agency_id}/{member_id}",
            get(open_member_session),
        )
        .route("/api/v1/app/chains", get(list_chains).post(create_chain))
        .route(
            "/api/v1/app/chains/{chain_id}",
            get(get_chain).patch(update_chain),
        )
        .route("/api/v1/app/chains/{chain_id}/costs", post(add_cost))
        .route(
            "/api/v1/app/chains/{chain_id}/scopes/{scope_id}",
            patch(update_scope),
        )
        .route(
            "/api/v1/app/chains/{chain_id}/milestones/{milestone_id}",
            patch(update_milestone),
        )
}

#[derive(Deserialize)]
struct NewAgency {
    name: String,
}

#[derive(Serialize)]
struct AgencyView {
    name: String,
    role: &'static str,
}

async fn create_agency(
    State(state): State<AppState>,
    headers: HeaderMap,
    Json(input): Json<NewAgency>,
) -> Result<Response, ApiError> {
    let name = input.name.trim();
    if name.chars().count() < 2 || name.chars().count() > 120 {
        return Err(ApiError::new(
            StatusCode::UNPROCESSABLE_ENTITY,
            "invalid_agency",
            "Check the agency name",
            "Enter an agency name from 2 to 120 characters.",
        )
        .field("name"));
    }
    let (id, member_id) = state
        .agency
        .create_agency(name.to_owned())
        .await
        .map_err(store_error)?;
    let secure = forwarded_https(&headers);
    let mut response = (
        StatusCode::CREATED,
        Json(AgencyView {
            name: name.to_owned(),
            role: "owner",
        }),
    )
        .into_response();
    response.headers_mut().insert(
        header::SET_COOKIE,
        HeaderValue::from_str(&format!(
            "{AGENCY_COOKIE_NAME}={id}; Path=/; Max-Age=31536000; HttpOnly; SameSite=Lax{}",
            if secure { "; Secure" } else { "" }
        ))
        .expect("agency cookie is valid"),
    );
    response.headers_mut().append(
        header::SET_COOKIE,
        HeaderValue::from_str(&format!(
            "smc_agency_member={member_id}; Path=/; Max-Age=31536000; HttpOnly; SameSite=Lax{}",
            if secure { "; Secure" } else { "" }
        ))
        .expect("member cookie is valid"),
    );
    response
        .headers_mut()
        .insert(header::CACHE_CONTROL, HeaderValue::from_static("no-store"));
    Ok(response)
}

async fn get_agency(
    State(state): State<AppState>,
    headers: HeaderMap,
) -> Result<Response, ApiError> {
    let id = agency_id(&headers)?;
    let agency = state
        .agency
        .get(&id)
        .await
        .map_err(store_error)?
        .filter(|workspace| workspace.permanent)
        .ok_or_else(missing_agency)?;
    let role = role_name(agency_member(&agency, &headers)?.role);
    let mut response = Json(AgencyView {
        name: agency.agency_name.unwrap_or_else(|| "Agency".into()),
        role,
    })
    .into_response();
    response
        .headers_mut()
        .insert(header::CACHE_CONTROL, HeaderValue::from_static("no-store"));
    Ok(response)
}

#[derive(Deserialize)]
struct NewMember {
    name: String,
    role: AgencyRole,
}

#[derive(Serialize)]
struct MemberInvite {
    id: String,
    role: AgencyRole,
    access_path: String,
}

async fn add_member(
    State(state): State<AppState>,
    headers: HeaderMap,
    Json(input): Json<NewMember>,
) -> Result<Response, ApiError> {
    let agency_id = agency_id(&headers)?;
    require_agency_role(&state, &headers, &agency_id, &[AgencyRole::Owner]).await?;
    let name = input.name.trim();
    if name.chars().count() < 2 || name.chars().count() > 120 {
        return Err(ApiError::new(
            StatusCode::UNPROCESSABLE_ENTITY,
            "invalid_member",
            "Check the member name",
            "Enter a member name from 2 to 120 characters.",
        )
        .field("name"));
    }
    let member = AgencyMember {
        id: new_id(),
        name: name.to_owned(),
        role: input.role,
    };
    let result = state
        .agency
        .with_workspace(&agency_id, |agency| {
            agency.members.push(member.clone());
            Mutation::Changed(member.clone())
        })
        .await
        .map_err(store_error)?
        .ok_or_else(missing_agency)?;
    let mut response = (
        StatusCode::CREATED,
        Json(MemberInvite {
            id: result.id.clone(),
            role: result.role,
            access_path: format!("/api/v1/app/access/{agency_id}/{}", result.id),
        }),
    )
        .into_response();
    response
        .headers_mut()
        .insert(header::CACHE_CONTROL, HeaderValue::from_static("no-store"));
    Ok(response)
}

async fn open_member_session(
    State(state): State<AppState>,
    Path((agency_id, member_id)): Path<(String, String)>,
    headers: HeaderMap,
) -> Result<Response, ApiError> {
    let agency = state
        .agency
        .get(&agency_id)
        .await
        .map_err(store_error)?
        .filter(|workspace| workspace.permanent)
        .ok_or_else(missing_agency)?;
    if !agency.members.iter().any(|member| member.id == member_id) {
        return Err(missing_agency());
    }
    let secure = forwarded_https(&headers);
    let mut response = StatusCode::NO_CONTENT.into_response();
    response.headers_mut().append(
        header::SET_COOKIE,
        HeaderValue::from_str(&format!(
            "{AGENCY_COOKIE_NAME}={agency_id}; Path=/; Max-Age=31536000; HttpOnly; SameSite=Lax{}",
            if secure { "; Secure" } else { "" }
        ))
        .expect("agency cookie is valid"),
    );
    response.headers_mut().append(
        header::SET_COOKIE,
        HeaderValue::from_str(&format!(
            "smc_agency_member={member_id}; Path=/; Max-Age=31536000; HttpOnly; SameSite=Lax{}",
            if secure { "; Secure" } else { "" }
        ))
        .expect("member cookie is valid"),
    );
    response
        .headers_mut()
        .insert(header::CACHE_CONTROL, HeaderValue::from_static("no-store"));
    Ok(response)
}

pub async fn global_rate_limit(
    State(state): State<AppState>,
    request: Request,
    next: Next,
) -> Response {
    let ip = client_ip(request.headers());
    match state
        .rate_limits
        .check(&format!("global:{ip}"), 40, Duration::from_secs(1))
        .await
    {
        Ok(()) => next.run(request).await,
        Err(error) => rate_limit_error(error).into_response(),
    }
}

async fn health() -> Json<HealthResponse> {
    Json(HealthResponse {
        status: "ok",
        build_sha: option_env!("BUILD_SHA").unwrap_or("dev"),
    })
}

async fn ready(State(state): State<AppState>) -> Response {
    if state.demo.ready().await {
        (
            StatusCode::OK,
            Json(serde_json::json!({"status":"ready","demo_store":state.demo.backend_name()})),
        )
            .into_response()
    } else {
        (
            StatusCode::SERVICE_UNAVAILABLE,
            Json(serde_json::json!({"status":"not_ready","demo_store":state.demo.backend_name()})),
        )
            .into_response()
    }
}

async fn metrics(State(state): State<AppState>) -> Response {
    let requests = state.metrics.requests.load(Ordering::Relaxed);
    (
        [(header::CONTENT_TYPE, "text/plain; version=0.0.4; charset=utf-8")],
        format!(
            "# HELP smc_http_requests_total Requests served by this replica.\n# TYPE smc_http_requests_total counter\nsmc_http_requests_total {requests}\n# HELP smc_demo_store_ready Shared demo persistence readiness.\n# TYPE smc_demo_store_ready gauge\nsmc_demo_store_ready {}\n",
            u8::from(state.demo.ready().await)
        ),
    ).into_response()
}

pub async fn count_request(
    State(state): State<AppState>,
    request: Request,
    next: Next,
) -> Response {
    state.metrics.requests.fetch_add(1, Ordering::Relaxed);
    next.run(request).await
}

async fn create_workspace(
    State(state): State<AppState>,
    headers: HeaderMap,
) -> Result<Response, ApiError> {
    if let Ok(existing_id) = workspace_id(&headers) {
        if let Some(existing) = state.demo.get(&existing_id).await.map_err(store_error)? {
            let mut response = Json(WorkspaceCreated {
                expires_at: existing.expires_at_epoch_seconds,
            })
            .into_response();
            demo_no_store(&mut response);
            return Ok(response);
        }
    }
    let ip = client_ip(&headers);
    state
        .rate_limits
        .check(&format!("provision:{ip}"), 5, Duration::from_secs(60 * 60))
        .await
        .map_err(rate_limit_error)?;
    let (workspace_id, created) = state.demo.create().await.map_err(store_error)?;
    let mut response = (StatusCode::CREATED, Json(created)).into_response();
    let secure = forwarded_https(&headers);
    let cookie = format!(
        "{COOKIE_NAME}={workspace_id}; Path=/; Max-Age=86400; HttpOnly; SameSite=Lax{}",
        if secure { "; Secure" } else { "" }
    );
    response.headers_mut().insert(
        header::SET_COOKIE,
        HeaderValue::from_str(&cookie).expect("workspace cookie is valid"),
    );
    demo_no_store(&mut response);
    Ok(response)
}

async fn delete_workspace(
    State(state): State<AppState>,
    headers: HeaderMap,
) -> Result<Response, ApiError> {
    let workspace_id = workspace_id(&headers)?;
    check_demo_write(&state, &headers, &workspace_id).await?;
    if !state
        .demo
        .remove(&workspace_id)
        .await
        .map_err(store_error)?
    {
        return Err(missing_workspace());
    }
    let mut response = StatusCode::NO_CONTENT.into_response();
    let secure = forwarded_https(&headers);
    response.headers_mut().insert(
        header::SET_COOKIE,
        HeaderValue::from_str(&format!(
            "smc_demo=; Path=/; Max-Age=0; HttpOnly; SameSite=Lax{}",
            if secure { "; Secure" } else { "" }
        ))
        .expect("expired workspace cookie is valid"),
    );
    demo_no_store(&mut response);
    Ok(response)
}

async fn list_chains(
    State(state): State<AppState>,
    headers: HeaderMap,
) -> Result<Response, ApiError> {
    let workspace_id = workspace_id(&headers)?;
    let workspace = store_for(&state, &headers)
        .get(&workspace_id)
        .await
        .map_err(store_error)?
        .ok_or_else(missing_workspace)?;
    let can_view_rates = if workspace.permanent {
        matches!(
            agency_member(&workspace, &headers)?.role,
            AgencyRole::Owner | AgencyRole::Finance
        )
    } else {
        true
    };
    let mut chains: Vec<JobView> = workspace
        .chains
        .into_iter()
        .map(|mut chain| {
            if !can_view_rates {
                chain.costs.clear();
            }
            JobView::from(chain)
        })
        .collect();
    chains.sort_by_key(|chain| match chain.calculation.risk_state {
        crate::domain::RiskState::BelowFloor => 0,
        crate::domain::RiskState::NearFloor => 1,
        crate::domain::RiskState::Incomplete => 2,
        crate::domain::RiskState::Safe => 3,
    });
    let mut response = Json(ChainList { chains }).into_response();
    demo_no_store(&mut response);
    Ok(response)
}

async fn get_chain(
    State(state): State<AppState>,
    Path(chain_id): Path<String>,
    headers: HeaderMap,
) -> Result<Response, ApiError> {
    let workspace_id = workspace_id(&headers)?;
    let workspace = store_for(&state, &headers)
        .get(&workspace_id)
        .await
        .map_err(store_error)?
        .ok_or_else(missing_workspace)?;
    let can_view_rates = if workspace.permanent {
        matches!(
            agency_member(&workspace, &headers)?.role,
            AgencyRole::Owner | AgencyRole::Finance
        )
    } else {
        true
    };
    let mut chain = workspace
        .chains
        .into_iter()
        .find(|chain| chain.id == chain_id)
        .ok_or_else(missing_chain)?;
    if !can_view_rates {
        chain.costs.clear();
    }
    let mut response = Json(JobView::from(chain)).into_response();
    demo_no_store(&mut response);
    Ok(response)
}

async fn create_chain(
    State(state): State<AppState>,
    headers: HeaderMap,
    Json(input): Json<NewChain>,
) -> Result<Response, ApiError> {
    let workspace_id = workspace_id(&headers)?;
    require_agency_role(
        &state,
        &headers,
        &workspace_id,
        &[AgencyRole::Owner, AgencyRole::Finance, AgencyRole::Producer],
    )
    .await?;
    check_demo_write(&state, &headers, &workspace_id).await?;
    let key = idempotency_key(&headers)?;
    input.validate().map_err(|(field, detail)| {
        ApiError::new(
            StatusCode::UNPROCESSABLE_ENTITY,
            "invalid_chain",
            "Check the job chain",
            detail,
        )
        .field(field)
    })?;

    let result = store_for(&state, &headers)
        .with_workspace(&workspace_id, |workspace| {
            if let Some(IdempotentResult::Chain(chain)) = workspace.idempotency.get(&key) {
                return Mutation::Unchanged((StatusCode::OK, chain.clone()));
            }
            let chain = input.clone().into_chain();
            workspace.chains.push(chain.clone());
            workspace
                .idempotency
                .insert(key.clone(), IdempotentResult::Chain(chain.clone()));
            Mutation::Changed((StatusCode::CREATED, chain))
        })
        .await
        .map_err(store_error)?
        .ok_or_else(missing_workspace)?;
    let mut response = (result.0, Json(JobView::from(result.1))).into_response();
    demo_no_store(&mut response);
    Ok(response)
}

#[derive(Debug, Deserialize)]
struct ChainPatch {
    client_commitment_minor: Option<i64>,
    margin_floor_basis_points: Option<i64>,
}

async fn update_chain(
    State(state): State<AppState>,
    Path(chain_id): Path<String>,
    headers: HeaderMap,
    Json(input): Json<ChainPatch>,
) -> Result<Response, ApiError> {
    let workspace_id = workspace_id(&headers)?;
    require_agency_role(
        &state,
        &headers,
        &workspace_id,
        &[AgencyRole::Owner, AgencyRole::Finance, AgencyRole::Producer],
    )
    .await?;
    check_demo_write(&state, &headers, &workspace_id).await?;
    if input.client_commitment_minor.is_none() && input.margin_floor_basis_points.is_none() {
        return Err(ApiError::new(
            StatusCode::UNPROCESSABLE_ENTITY,
            "empty_change",
            "Nothing to change",
            "Enter a client commitment or margin floor, then try again.",
        ));
    }
    if input
        .client_commitment_minor
        .is_some_and(|amount| amount <= 0)
    {
        return Err(ApiError::new(
            StatusCode::UNPROCESSABLE_ENTITY,
            "invalid_money",
            "Check the amount",
            "Enter a client commitment above zero.",
        )
        .field("client_commitment_minor"));
    }
    if input
        .margin_floor_basis_points
        .is_some_and(|bps| !(0..=10_000).contains(&bps))
    {
        return Err(ApiError::new(
            StatusCode::UNPROCESSABLE_ENTITY,
            "invalid_floor",
            "Check the margin floor",
            "Enter a margin floor from 0% to 100%.",
        )
        .field("margin_floor_basis_points"));
    }
    let result = store_for(&state, &headers)
        .with_workspace(&workspace_id, |workspace| {
            let Some(chain) = workspace
                .chains
                .iter_mut()
                .find(|chain| chain.id == chain_id)
            else {
                return Mutation::Unchanged(None);
            };
            if let Some(amount) = input.client_commitment_minor {
                chain.client_commitment_minor = Some(amount);
                chain.last_risk_cause = Some("Client commitment changed".into());
            }
            if let Some(bps) = input.margin_floor_basis_points {
                chain.margin_floor_basis_points = bps;
                chain.last_risk_cause = Some("Margin floor changed".into());
            }
            chain.version += 1;
            Mutation::Changed(Some(chain.clone()))
        })
        .await
        .map_err(store_error)?
        .ok_or_else(missing_workspace)?
        .ok_or_else(missing_chain)?;
    let mut response = Json(JobView::from(result)).into_response();
    demo_no_store(&mut response);
    Ok(response)
}

#[derive(Debug, Deserialize)]
struct NewCost {
    subcontractor: String,
    role: String,
    amount_minor: i64,
}

async fn add_cost(
    State(state): State<AppState>,
    Path(chain_id): Path<String>,
    headers: HeaderMap,
    Json(input): Json<NewCost>,
) -> Result<Response, ApiError> {
    let workspace_id = workspace_id(&headers)?;
    require_agency_role(
        &state,
        &headers,
        &workspace_id,
        &[AgencyRole::Owner, AgencyRole::Finance],
    )
    .await?;
    check_demo_write(&state, &headers, &workspace_id).await?;
    let key = idempotency_key(&headers)?;
    if input.subcontractor.trim().chars().count() < 2 || input.subcontractor.chars().count() > 120 {
        return Err(ApiError::new(
            StatusCode::UNPROCESSABLE_ENTITY,
            "invalid_cost",
            "Check the commitment",
            "Enter the subcontractor name.",
        )
        .field("subcontractor"));
    }
    if input.role.trim().chars().count() < 2 || input.role.chars().count() > 120 {
        return Err(ApiError::new(
            StatusCode::UNPROCESSABLE_ENTITY,
            "invalid_cost",
            "Check the commitment",
            "Name the work this commitment covers.",
        )
        .field("role"));
    }
    if input.amount_minor < 0 || input.amount_minor > 10_000_000_000 {
        return Err(ApiError::new(
            StatusCode::UNPROCESSABLE_ENTITY,
            "invalid_money",
            "Check the amount",
            "Enter a committed cost of zero or more.",
        )
        .field("amount_minor"));
    }
    let result = store_for(&state, &headers)
        .with_workspace(&workspace_id, |workspace| {
            if let Some(IdempotentResult::Chain(chain)) = workspace.idempotency.get(&key) {
                return Mutation::Unchanged(Some((StatusCode::OK, chain.clone())));
            }
            let Some(chain) = workspace
                .chains
                .iter_mut()
                .find(|chain| chain.id == chain_id)
            else {
                return Mutation::Unchanged(None);
            };
            let role = input.role.trim().to_owned();
            chain.costs.push(CostCommitment {
                id: new_id(),
                subcontractor: input.subcontractor.trim().to_owned(),
                role: role.clone(),
                amount_minor: input.amount_minor,
                state: CostState::Committed,
            });
            chain.last_risk_cause = Some(format!("{role} was added"));
            chain.version += 1;
            let chain = chain.clone();
            workspace
                .idempotency
                .insert(key.clone(), IdempotentResult::Chain(chain.clone()));
            Mutation::Changed(Some((StatusCode::CREATED, chain)))
        })
        .await
        .map_err(store_error)?
        .ok_or_else(missing_workspace)?
        .ok_or_else(missing_chain)?;
    let mut response = (result.0, Json(JobView::from(result.1))).into_response();
    demo_no_store(&mut response);
    Ok(response)
}

#[derive(Debug, Deserialize)]
struct ScopePatch {
    status: ScopeStatus,
}

async fn update_scope(
    State(state): State<AppState>,
    Path((chain_id, scope_id)): Path<(String, String)>,
    headers: HeaderMap,
    Json(input): Json<ScopePatch>,
) -> Result<Response, ApiError> {
    let workspace_id = workspace_id(&headers)?;
    require_agency_role(
        &state,
        &headers,
        &workspace_id,
        &[AgencyRole::Owner, AgencyRole::Finance, AgencyRole::Producer],
    )
    .await?;
    check_demo_write(&state, &headers, &workspace_id).await?;
    if input.status != ScopeStatus::Approved {
        return Err(ApiError::new(
            StatusCode::CONFLICT,
            "invalid_transition",
            "Scope state cannot change",
            "A pending demo revision can only be approved.",
        ));
    }
    let result = store_for(&state, &headers)
        .with_workspace(&workspace_id, |workspace| {
            let Some(chain) = workspace
                .chains
                .iter_mut()
                .find(|chain| chain.id == chain_id)
            else {
                return Mutation::Unchanged(None);
            };
            let Some(scope) = chain.scopes.iter_mut().find(|scope| scope.id == scope_id) else {
                return Mutation::Unchanged(None);
            };
            scope.status = ScopeStatus::Approved;
            chain.version += 1;
            Mutation::Changed(Some(chain.clone()))
        })
        .await
        .map_err(store_error)?
        .ok_or_else(missing_workspace)?
        .ok_or_else(|| missing_record("scope_not_found", "Scope revision not found"))?;
    let mut response = Json(JobView::from(result)).into_response();
    demo_no_store(&mut response);
    Ok(response)
}

#[derive(Debug, Deserialize)]
struct MilestonePatch {
    status: MilestoneStatus,
}

async fn update_milestone(
    State(state): State<AppState>,
    Path((chain_id, milestone_id)): Path<(String, String)>,
    headers: HeaderMap,
    Json(input): Json<MilestonePatch>,
) -> Result<Response, ApiError> {
    let workspace_id = workspace_id(&headers)?;
    require_agency_role(
        &state,
        &headers,
        &workspace_id,
        &[AgencyRole::Owner, AgencyRole::Finance, AgencyRole::Producer],
    )
    .await?;
    check_demo_write(&state, &headers, &workspace_id).await?;
    let result = store_for(&state, &headers)
        .with_workspace(&workspace_id, |workspace| {
            let Some(chain) = workspace
                .chains
                .iter_mut()
                .find(|chain| chain.id == chain_id)
            else {
                return Mutation::Unchanged(None);
            };
            let Some(milestone) = chain
                .milestones
                .iter_mut()
                .find(|milestone| milestone.id == milestone_id)
            else {
                return Mutation::Unchanged(None);
            };
            if !milestone.status.can_transition_to(input.status) {
                return Mutation::Unchanged(Some(Err(ApiError::new(
                    StatusCode::CONFLICT,
                    "invalid_transition",
                    "Invoice state cannot change",
                    "Choose the next invoice state and try again.",
                ))));
            }
            milestone.status = input.status;
            chain.version += 1;
            Mutation::Changed(Some(Ok(chain.clone())))
        })
        .await
        .map_err(store_error)?
        .ok_or_else(missing_workspace)?
        .ok_or_else(|| missing_record("milestone_not_found", "Client milestone not found"))??;
    let mut response = Json(JobView::from(result)).into_response();
    demo_no_store(&mut response);
    Ok(response)
}

fn workspace_id(headers: &HeaderMap) -> Result<String, ApiError> {
    let cookies = headers
        .get(header::COOKIE)
        .and_then(|value| value.to_str().ok())
        .unwrap_or_default();
    cookies
        .split(';')
        .filter_map(|item| item.trim().split_once('='))
        .find_map(|(name, value)| {
            ((name == COOKIE_NAME || name == AGENCY_COOKIE_NAME) && !value.is_empty())
                .then(|| value.to_owned())
        })
        .ok_or_else(missing_workspace)
}

fn agency_id(headers: &HeaderMap) -> Result<String, ApiError> {
    let cookies = headers
        .get(header::COOKIE)
        .and_then(|value| value.to_str().ok())
        .unwrap_or_default();
    cookies
        .split(';')
        .filter_map(|item| item.trim().split_once('='))
        .find_map(|(name, value)| {
            (name == AGENCY_COOKIE_NAME && !value.is_empty()).then(|| value.to_owned())
        })
        .ok_or_else(missing_agency)
}

fn cookie(headers: &HeaderMap, wanted: &str) -> Option<String> {
    headers
        .get(header::COOKIE)
        .and_then(|value| value.to_str().ok())
        .unwrap_or_default()
        .split(';')
        .filter_map(|item| item.trim().split_once('='))
        .find_map(|(name, value)| (name == wanted && !value.is_empty()).then(|| value.to_owned()))
}

fn store_for<'a>(state: &'a AppState, headers: &HeaderMap) -> &'a crate::demo::DemoStore {
    if cookie(headers, AGENCY_COOKIE_NAME).is_some() {
        &state.agency
    } else {
        &state.demo
    }
}

fn agency_member<'a>(
    workspace: &'a crate::demo::Workspace,
    headers: &HeaderMap,
) -> Result<&'a crate::demo::AgencyMember, ApiError> {
    let member_id = cookie(headers, "smc_agency_member").ok_or_else(missing_agency)?;
    workspace
        .members
        .iter()
        .find(|member| member.id == member_id)
        .ok_or_else(missing_agency)
}

fn role_name(role: AgencyRole) -> &'static str {
    match role {
        AgencyRole::Owner => "owner",
        AgencyRole::Finance => "finance",
        AgencyRole::Producer => "producer",
        AgencyRole::Viewer => "viewer",
    }
}

async fn require_agency_role(
    state: &AppState,
    headers: &HeaderMap,
    workspace_id: &str,
    allowed: &[AgencyRole],
) -> Result<(), ApiError> {
    // Demo requests deliberately remain open inside their isolated workspace.
    if cookie(headers, AGENCY_COOKIE_NAME).is_none() {
        return Ok(());
    }
    let workspace = state
        .agency
        .get(workspace_id)
        .await
        .map_err(store_error)?
        .ok_or_else(missing_agency)?;
    let member = agency_member(&workspace, headers)?;
    if allowed.contains(&member.role) {
        Ok(())
    } else {
        Err(ApiError::new(
            StatusCode::FORBIDDEN,
            "financial_access_denied",
            "Your role cannot make this change",
            "Ask an owner or finance member to update this financial record.",
        ))
    }
}

fn idempotency_key(headers: &HeaderMap) -> Result<String, ApiError> {
    let value = headers
        .get("idempotency-key")
        .and_then(|value| value.to_str().ok())
        .unwrap_or_default()
        .trim();
    if value.len() < 8 || value.len() > 200 {
        return Err(ApiError::new(
            StatusCode::BAD_REQUEST,
            "idempotency_key_required",
            "Request key required",
            "This change needs an Idempotency-Key of at least eight characters.",
        ));
    }
    Ok(value.to_owned())
}

async fn check_demo_write(
    state: &AppState,
    headers: &HeaderMap,
    workspace: &str,
) -> Result<(), ApiError> {
    let ip = client_ip(headers);
    state
        .rate_limits
        .check(
            &format!("demo-write:{workspace}"),
            30,
            Duration::from_secs(60),
        )
        .await
        .map_err(rate_limit_error)?;
    state
        .rate_limits
        .check(&format!("demo-ip-write:{ip}"), 60, Duration::from_secs(60))
        .await
        .map_err(rate_limit_error)
}

fn rate_limit_error(error: RateLimitError) -> ApiError {
    match error {
        RateLimitError::Limited(retry_after) => ApiError::rate_limited(retry_after),
        RateLimitError::Unavailable(error) => store_error(error),
    }
}

fn client_ip(headers: &HeaderMap) -> String {
    headers
        .get("x-forwarded-for")
        .and_then(|value| value.to_str().ok())
        .and_then(|value| value.split(',').next())
        .map(str::trim)
        .filter(|value| !value.is_empty())
        .unwrap_or("local")
        .chars()
        .take(64)
        .collect()
}

fn forwarded_https(headers: &HeaderMap) -> bool {
    headers
        .get("x-forwarded-proto")
        .and_then(|value| value.to_str().ok())
        .and_then(|value| value.split(',').next())
        .is_some_and(|value| value.trim().eq_ignore_ascii_case("https"))
}

fn store_error(error: StoreError) -> ApiError {
    tracing::error!(?error, "demo persistence unavailable");
    ApiError::new(
        StatusCode::SERVICE_UNAVAILABLE,
        "demo_store_unavailable",
        "Demo temporarily unavailable",
        "The shared demo store could not be reached. Wait a moment, then try again.",
    )
}

fn missing_workspace() -> ApiError {
    ApiError::new(
        StatusCode::UNAUTHORIZED,
        "demo_workspace_missing",
        "Demo expired",
        "This demo workspace is missing or expired. Start a new sample to continue.",
    )
}

fn missing_agency() -> ApiError {
    ApiError::new(
        StatusCode::UNAUTHORIZED,
        "agency_session_missing",
        "Set up your agency",
        "Create or return to an agency workspace to view real records.",
    )
}

fn missing_chain() -> ApiError {
    missing_record("chain_not_found", "Job chain not found")
}

fn missing_record(code: &'static str, title: &'static str) -> ApiError {
    ApiError::new(
        StatusCode::NOT_FOUND,
        code,
        title,
        "This demo record is not available. Return to the job register.",
    )
}

fn demo_no_store(response: &mut Response) {
    response
        .headers_mut()
        .insert(header::CACHE_CONTROL, HeaderValue::from_static("no-store"));
}

pub async fn api_not_found() -> Response {
    ApiError::new(
        StatusCode::NOT_FOUND,
        "api_not_found",
        "API route not found",
        "Check the API address and try again.",
    )
    .into_response()
}
