use serde::{Deserialize, Serialize};
use uuid::Uuid;

pub const RULE_VERSION: &str = "margin-v1";

#[derive(Clone, Debug, Deserialize, Serialize, PartialEq, Eq)]
pub struct ScopeRevision {
    pub id: String,
    pub description: String,
    pub status: ScopeStatus,
    pub linked_milestone_id: Option<String>,
}

#[derive(Clone, Copy, Debug, Deserialize, Serialize, PartialEq, Eq)]
#[serde(rename_all = "snake_case")]
pub enum ScopeStatus {
    Pending,
    Approved,
}

#[derive(Clone, Debug, Deserialize, Serialize, PartialEq, Eq)]
pub struct CostCommitment {
    pub id: String,
    pub subcontractor: String,
    pub role: String,
    pub amount_minor: i64,
    pub state: CostState,
}

#[derive(Clone, Copy, Debug, Deserialize, Serialize, PartialEq, Eq)]
#[serde(rename_all = "snake_case")]
pub enum CostState {
    Committed,
    Void,
}

#[derive(Clone, Debug, Deserialize, Serialize, PartialEq, Eq)]
pub struct ClientMilestone {
    pub id: String,
    pub label: String,
    pub amount_minor: i64,
    pub status: MilestoneStatus,
    pub linked_scope_id: Option<String>,
}

#[derive(Clone, Copy, Debug, Deserialize, Serialize, PartialEq, Eq)]
#[serde(rename_all = "snake_case")]
pub enum MilestoneStatus {
    Planned,
    Due,
    Sent,
    PartPaid,
    Paid,
    Overdue,
}

impl MilestoneStatus {
    pub fn can_transition_to(self, next: Self) -> bool {
        use MilestoneStatus::*;
        matches!(
            (self, next),
            (Planned, Due | Sent)
                | (Due, Sent | Overdue)
                | (Sent, PartPaid | Paid | Overdue)
                | (PartPaid, Paid | Overdue)
                | (Overdue, Sent | PartPaid | Paid)
        ) || self == next
    }
}

#[derive(Clone, Debug, Deserialize, Serialize, PartialEq, Eq)]
pub struct JobChain {
    pub id: String,
    pub name: String,
    pub contracting_client: String,
    pub end_client: Option<String>,
    pub currency: String,
    pub client_commitment_minor: Option<i64>,
    pub margin_floor_basis_points: i64,
    pub scopes: Vec<ScopeRevision>,
    pub costs: Vec<CostCommitment>,
    pub milestones: Vec<ClientMilestone>,
    pub last_risk_cause: Option<String>,
    pub version: u64,
}

#[derive(Clone, Copy, Debug, Deserialize, Serialize, PartialEq, Eq)]
#[serde(rename_all = "snake_case")]
pub enum RiskState {
    Incomplete,
    Safe,
    NearFloor,
    BelowFloor,
}

#[derive(Clone, Debug, Deserialize, Serialize, PartialEq, Eq)]
pub struct MarginCalculation {
    pub client_commitment_minor: Option<i64>,
    pub committed_cost_minor: i64,
    pub expected_margin_minor: Option<i64>,
    pub margin_floor_minor: Option<i64>,
    pub margin_at_risk_minor: Option<i64>,
    pub margin_percent_tenths: Option<i64>,
    pub risk_state: RiskState,
    pub rule_version: &'static str,
    pub cause: Option<String>,
    pub input_version: u64,
}

impl JobChain {
    pub fn calculation(&self) -> MarginCalculation {
        let committed_cost_minor = self
            .costs
            .iter()
            .filter(|cost| cost.state != CostState::Void)
            .map(|cost| cost.amount_minor)
            .sum();

        let Some(commitment) = self.client_commitment_minor else {
            return MarginCalculation {
                client_commitment_minor: None,
                committed_cost_minor,
                expected_margin_minor: None,
                margin_floor_minor: None,
                margin_at_risk_minor: None,
                margin_percent_tenths: None,
                risk_state: RiskState::Incomplete,
                rule_version: RULE_VERSION,
                cause: self.last_risk_cause.clone(),
                input_version: self.version,
            };
        };

        let expected = commitment.saturating_sub(committed_cost_minor);
        let floor = conservative_floor(commitment, self.margin_floor_basis_points);
        let at_risk = (floor - expected).max(0);
        let percent_tenths = if commitment == 0 {
            None
        } else {
            let numerator = expected as i128 * 1_000;
            let rounded = if numerator >= 0 {
                (numerator + commitment as i128 / 2) / commitment as i128
            } else {
                (numerator - commitment as i128 / 2) / commitment as i128
            };
            Some(rounded as i64)
        };
        let pending_unpriced = self
            .scopes
            .iter()
            .any(|scope| scope.status == ScopeStatus::Pending);
        let near_boundary = conservative_floor(
            commitment,
            (self.margin_floor_basis_points + 500).min(10_000),
        );
        let risk_state = if expected < floor {
            RiskState::BelowFloor
        } else if expected <= near_boundary || pending_unpriced {
            RiskState::NearFloor
        } else {
            RiskState::Safe
        };

        MarginCalculation {
            client_commitment_minor: Some(commitment),
            committed_cost_minor,
            expected_margin_minor: Some(expected),
            margin_floor_minor: Some(floor),
            margin_at_risk_minor: Some(at_risk),
            margin_percent_tenths: percent_tenths,
            risk_state,
            rule_version: RULE_VERSION,
            cause: self.last_risk_cause.clone(),
            input_version: self.version,
        }
    }
}

pub fn conservative_floor(commitment_minor: i64, basis_points: i64) -> i64 {
    let product = commitment_minor as i128 * basis_points as i128;
    if product >= 0 {
        ((product + 9_999) / 10_000) as i64
    } else {
        (product / 10_000) as i64
    }
}

pub fn new_id() -> String {
    Uuid::now_v7().to_string()
}

#[cfg(test)]
mod tests {
    use super::*;

    fn chain(commitment: Option<i64>, cost: i64, floor_bps: i64) -> JobChain {
        JobChain {
            id: new_id(),
            name: "Test job".into(),
            contracting_client: "Client".into(),
            end_client: None,
            currency: "USD".into(),
            client_commitment_minor: commitment,
            margin_floor_basis_points: floor_bps,
            scopes: vec![],
            costs: vec![CostCommitment {
                id: new_id(),
                subcontractor: "Partner".into(),
                role: "Delivery".into(),
                amount_minor: cost,
                state: CostState::Committed,
            }],
            milestones: vec![],
            last_risk_cause: None,
            version: 1,
        }
    }

    #[test]
    fn rounds_margin_floor_up_to_a_minor_unit() {
        assert_eq!(conservative_floor(10_001, 2_500), 2_501);
        assert_eq!(conservative_floor(2_400_000, 2_000), 480_000);
    }

    #[test]
    fn exact_fixture_math_uses_integer_minor_units() {
        let result = chain(Some(2_400_000), 1_450_000, 2_000).calculation();
        assert_eq!(result.expected_margin_minor, Some(950_000));
        assert_eq!(result.margin_percent_tenths, Some(396));
        assert_eq!(result.margin_floor_minor, Some(480_000));
    }

    #[test]
    fn claim_money_integrity_uses_integer_minor_units_and_rounds_up() {
        let result = chain(Some(10_001), 7_500, 2_500).calculation();
        assert_eq!(result.client_commitment_minor, Some(10_001));
        assert_eq!(result.committed_cost_minor, 7_500);
        assert_eq!(result.expected_margin_minor, Some(2_501));
        assert_eq!(result.margin_floor_minor, Some(2_501));
        assert_eq!(conservative_floor(10_001, 2_500), 2_501);
    }

    #[test]
    fn risk_boundaries_are_explicit() {
        let cases = [
            (None, 0, RiskState::Incomplete),
            (Some(10_000), 8_001, RiskState::BelowFloor),
            (Some(10_000), 8_000, RiskState::NearFloor),
            (Some(10_000), 7_500, RiskState::NearFloor),
            (Some(10_000), 7_499, RiskState::Safe),
            (Some(10_000), 11_000, RiskState::BelowFloor),
        ];
        for (commitment, cost, expected) in cases {
            assert_eq!(
                chain(commitment, cost, 2_000).calculation().risk_state,
                expected
            );
        }
    }

    #[test]
    fn arithmetic_stays_in_range_for_large_safe_values() {
        for commitment in [0, 1, 99, 1_000_000, i64::MAX / 20] {
            for bps in [0, 1, 2_500, 10_000] {
                let floor = conservative_floor(commitment, bps);
                assert!(floor >= 0);
                assert!(floor <= commitment);
            }
        }
    }

    #[test]
    fn rejects_invalid_invoice_state_transitions() {
        assert!(!MilestoneStatus::Paid.can_transition_to(MilestoneStatus::Planned));
        assert!(MilestoneStatus::Sent.can_transition_to(MilestoneStatus::Paid));
        assert!(MilestoneStatus::Due.can_transition_to(MilestoneStatus::Overdue));
    }
}
