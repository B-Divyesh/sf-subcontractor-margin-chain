use crate::domain::{
    new_id, ClientMilestone, CostCommitment, CostState, JobChain, MilestoneStatus, ScopeRevision,
    ScopeStatus,
};
use serde::{Deserialize, Serialize};
use std::{
    collections::HashMap,
    sync::{Arc, Mutex, RwLock},
    time::{Duration, Instant, SystemTime, UNIX_EPOCH},
};

pub const DEMO_TTL: Duration = Duration::from_secs(24 * 60 * 60);

#[derive(Clone)]
pub struct AppState {
    pub demo: DemoStore,
    pub rate_limits: RateLimits,
}

impl Default for AppState {
    fn default() -> Self {
        Self {
            demo: DemoStore::default(),
            rate_limits: RateLimits::default(),
        }
    }
}

#[derive(Clone, Default)]
pub struct DemoStore {
    inner: Arc<RwLock<HashMap<String, Workspace>>>,
}

#[derive(Clone, Debug)]
pub struct Workspace {
    pub id: String,
    pub expires_at_epoch_seconds: u64,
    pub chains: Vec<JobChain>,
    pub idempotency: HashMap<String, IdempotentResult>,
}

#[derive(Clone, Debug)]
pub enum IdempotentResult {
    Chain(JobChain),
}

#[derive(Clone, Debug, Serialize)]
pub struct WorkspaceCreated {
    pub expires_at: u64,
}

impl DemoStore {
    pub fn create(&self) -> (String, WorkspaceCreated) {
        let id = new_id();
        let expires_at_epoch_seconds = epoch_seconds() + DEMO_TTL.as_secs();
        let workspace = Workspace {
            id: id.clone(),
            expires_at_epoch_seconds,
            chains: seeded_chains(),
            idempotency: HashMap::new(),
        };
        self.inner
            .write()
            .expect("demo store poisoned")
            .insert(id.clone(), workspace);
        (
            id,
            WorkspaceCreated {
                expires_at: expires_at_epoch_seconds,
            },
        )
    }

    pub fn exists(&self, id: &str) -> bool {
        self.get(id).is_some()
    }

    pub fn get(&self, id: &str) -> Option<Workspace> {
        let workspace = self
            .inner
            .read()
            .expect("demo store poisoned")
            .get(id)
            .cloned()?;
        if workspace.expires_at_epoch_seconds <= epoch_seconds() {
            self.remove(id);
            return None;
        }
        Some(workspace)
    }

    pub fn with_workspace<T>(
        &self,
        id: &str,
        operation: impl FnOnce(&mut Workspace) -> T,
    ) -> Option<T> {
        let mut store = self.inner.write().expect("demo store poisoned");
        let workspace = store.get_mut(id)?;
        if workspace.expires_at_epoch_seconds <= epoch_seconds() {
            store.remove(id);
            return None;
        }
        Some(operation(workspace))
    }

    pub fn remove(&self, id: &str) -> bool {
        self.inner
            .write()
            .expect("demo store poisoned")
            .remove(id)
            .is_some()
    }

    pub fn purge_expired(&self) -> usize {
        let now = epoch_seconds();
        let mut store = self.inner.write().expect("demo store poisoned");
        let before = store.len();
        store.retain(|_, workspace| workspace.expires_at_epoch_seconds > now);
        before - store.len()
    }

    pub fn count(&self) -> usize {
        self.inner.read().expect("demo store poisoned").len()
    }
}

fn epoch_seconds() -> u64 {
    SystemTime::now()
        .duration_since(UNIX_EPOCH)
        .unwrap_or_default()
        .as_secs()
}

#[derive(Clone, Default)]
pub struct RateLimits {
    buckets: Arc<Mutex<HashMap<String, Vec<Instant>>>>,
}

impl RateLimits {
    pub fn check(&self, key: &str, allowance: usize, period: Duration) -> Result<(), u64> {
        let now = Instant::now();
        let mut buckets = self.buckets.lock().expect("rate-limit store poisoned");
        let entries = buckets.entry(key.to_owned()).or_default();
        entries.retain(|instant| now.duration_since(*instant) < period);
        if entries.len() >= allowance {
            let retry = period
                .saturating_sub(now.duration_since(entries[0]))
                .as_secs()
                .max(1);
            return Err(retry);
        }
        entries.push(now);
        Ok(())
    }
}

#[derive(Debug, Deserialize)]
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
        if self.client_commitment_minor <= 0 || self.client_commitment_minor > 100_000_000_00 {
            return Err((
                "client_commitment_minor",
                "Enter a client commitment above zero.",
            ));
        }
        if self.cost_minor < 0 || self.cost_minor > 100_000_000_00 {
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
        client_commitment_minor: Some(24_000_00),
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
                amount_minor: 6_200_00,
                state: CostState::Committed,
            },
            CostCommitment {
                id: "osei-production".into(),
                subcontractor: "Osei Reed".into(),
                role: "Production".into(),
                amount_minor: 8_300_00,
                state: CostState::Committed,
            },
        ],
        milestones: vec![
            ClientMilestone {
                id: "autumn-deposit".into(),
                label: "Production deposit".into(),
                amount_minor: 12_000_00,
                status: MilestoneStatus::Sent,
                linked_scope_id: Some("launch-film".into()),
            },
            ClientMilestone {
                id: "autumn-balance".into(),
                label: "Final delivery".into(),
                amount_minor: 12_000_00,
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
        client_commitment_minor: Some(18_000_00),
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
            amount_minor: 13_800_00,
            state: CostState::Committed,
        }],
        milestones: vec![ClientMilestone {
            id: "annual-first-invoice".into(),
            label: "First client invoice".into(),
            amount_minor: 18_000_00,
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
        client_commitment_minor: Some(9_600_00),
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
            amount_minor: 5_400_00,
            state: CostState::Committed,
        }],
        milestones: vec![ClientMilestone {
            id: "interview-invoice".into(),
            label: "Client invoice".into(),
            amount_minor: 9_600_00,
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
        assert_eq!(autumn.calculation().expected_margin_minor, Some(9_500_00));
        assert_eq!(autumn.calculation().margin_percent_tenths, Some(396));
        assert_eq!(annual.calculation().margin_at_risk_minor, Some(300_00));
        assert_eq!(annual.calculation().risk_state, RiskState::BelowFloor);
    }

    #[test]
    fn removing_a_workspace_invalidates_its_identifier() {
        let store = DemoStore::default();
        let (id, _) = store.create();
        assert!(store.exists(&id));
        assert!(store.remove(&id));
        assert!(!store.exists(&id));
    }
}
