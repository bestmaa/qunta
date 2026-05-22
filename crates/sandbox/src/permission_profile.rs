#[derive(Debug, Clone, Copy, Eq, PartialEq)]
pub enum PermissionProfile {
    Suggest,
    AutoEdit,
    ControlledFullAuto,
}

#[derive(Debug, Clone, Copy, Eq, PartialEq)]
pub enum ActionKind {
    Read,
    Write,
    Shell,
    Network,
    Install,
    Git,
}

#[derive(Debug, Clone, Copy, Eq, PartialEq)]
pub enum RiskLevel {
    Low,
    Medium,
    High,
}

#[derive(Debug, Clone, Copy, Eq, PartialEq)]
pub enum PermissionDecision {
    Allow,
    Ask,
    Deny,
}

#[derive(Debug, Clone, Eq, PartialEq)]
pub struct PermissionRule {
    pub action: ActionKind,
    pub decision: PermissionDecision,
    pub reason: &'static str,
}

pub fn decide_permission(
    profile: PermissionProfile,
    action: ActionKind,
    risk: RiskLevel,
) -> PermissionRule {
    if risk == RiskLevel::High {
        return PermissionRule {
            action,
            decision: PermissionDecision::Ask,
            reason: "high-risk actions require visible approval",
        };
    }

    match profile {
        PermissionProfile::Suggest => suggest_rule(action),
        PermissionProfile::AutoEdit => auto_edit_rule(action, risk),
        PermissionProfile::ControlledFullAuto => controlled_full_auto_rule(action, risk),
    }
}

fn suggest_rule(action: ActionKind) -> PermissionRule {
    let decision = match action {
        ActionKind::Read => PermissionDecision::Allow,
        ActionKind::Write
        | ActionKind::Shell
        | ActionKind::Network
        | ActionKind::Install
        | ActionKind::Git => PermissionDecision::Ask,
    };

    PermissionRule {
        action,
        decision,
        reason: "suggest mode requires approval before changing the workspace",
    }
}

fn auto_edit_rule(action: ActionKind, risk: RiskLevel) -> PermissionRule {
    let decision = match action {
        ActionKind::Read | ActionKind::Write if risk == RiskLevel::Low => PermissionDecision::Allow,
        ActionKind::Read | ActionKind::Write | ActionKind::Git => PermissionDecision::Ask,
        ActionKind::Shell | ActionKind::Network | ActionKind::Install => PermissionDecision::Ask,
    };

    PermissionRule {
        action,
        decision,
        reason: "auto-edit mode allows low-risk file work only",
    }
}

fn controlled_full_auto_rule(action: ActionKind, risk: RiskLevel) -> PermissionRule {
    let decision = match action {
        ActionKind::Read | ActionKind::Write if risk != RiskLevel::High => {
            PermissionDecision::Allow
        }
        ActionKind::Shell if risk == RiskLevel::Low => PermissionDecision::Allow,
        ActionKind::Git if risk == RiskLevel::Low => PermissionDecision::Allow,
        ActionKind::Network | ActionKind::Install => PermissionDecision::Ask,
        ActionKind::Shell | ActionKind::Git | ActionKind::Read | ActionKind::Write => {
            PermissionDecision::Ask
        }
    };

    PermissionRule {
        action,
        decision,
        reason: "controlled full-auto still asks for spend, install, and risk escalation",
    }
}

#[cfg(test)]
mod tests {
    use super::{decide_permission, ActionKind, PermissionDecision, PermissionProfile, RiskLevel};

    #[test]
    fn suggest_mode_allows_reads_only() {
        let read = decide_permission(PermissionProfile::Suggest, ActionKind::Read, RiskLevel::Low);
        let write = decide_permission(
            PermissionProfile::Suggest,
            ActionKind::Write,
            RiskLevel::Low,
        );

        assert_eq!(read.decision, PermissionDecision::Allow);
        assert_eq!(write.decision, PermissionDecision::Ask);
    }

    #[test]
    fn auto_edit_allows_low_risk_writes() {
        let decision = decide_permission(
            PermissionProfile::AutoEdit,
            ActionKind::Write,
            RiskLevel::Low,
        );

        assert_eq!(decision.decision, PermissionDecision::Allow);
    }

    #[test]
    fn controlled_full_auto_keeps_install_visible() {
        let decision = decide_permission(
            PermissionProfile::ControlledFullAuto,
            ActionKind::Install,
            RiskLevel::Low,
        );

        assert_eq!(decision.decision, PermissionDecision::Ask);
    }

    #[test]
    fn high_risk_actions_always_ask() {
        for profile in [
            PermissionProfile::Suggest,
            PermissionProfile::AutoEdit,
            PermissionProfile::ControlledFullAuto,
        ] {
            let decision = decide_permission(profile, ActionKind::Shell, RiskLevel::High);

            assert_eq!(decision.decision, PermissionDecision::Ask);
        }
    }
}
