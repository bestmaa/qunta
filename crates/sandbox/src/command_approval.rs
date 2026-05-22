use std::path::PathBuf;

use crate::permission_profile::{
    decide_permission, ActionKind, PermissionDecision, PermissionProfile, RiskLevel,
};

#[derive(Debug, Clone, Eq, PartialEq)]
pub enum ApprovalStatus {
    Pending,
    Approved,
    Rejected,
}

#[derive(Debug, Clone, Eq, PartialEq)]
pub struct CommandApprovalRequest {
    pub id: String,
    pub command: String,
    pub cwd: PathBuf,
    pub reason: String,
    pub risk: RiskLevel,
    pub status: ApprovalStatus,
}

#[derive(Debug, Clone, Eq, PartialEq)]
pub struct ApprovalAuditEntry {
    pub request_id: String,
    pub decision: ApprovalStatus,
    pub message: String,
}

#[derive(Debug, Default)]
pub struct ApprovalQueue {
    pending: Vec<CommandApprovalRequest>,
    audit: Vec<ApprovalAuditEntry>,
}

impl ApprovalQueue {
    pub fn request(
        &mut self,
        profile: PermissionProfile,
        command: impl Into<String>,
        cwd: impl Into<PathBuf>,
        reason: impl Into<String>,
    ) -> CommandApprovalRequest {
        let command = command.into();
        let risk = classify_command_risk(&command);
        let rule = decide_permission(profile, ActionKind::Shell, risk);
        let status = match rule.decision {
            PermissionDecision::Allow => ApprovalStatus::Approved,
            PermissionDecision::Ask | PermissionDecision::Deny => ApprovalStatus::Pending,
        };
        let request = CommandApprovalRequest {
            id: format!("cmd-{}", self.pending.len() + self.audit.len() + 1),
            command,
            cwd: cwd.into(),
            reason: reason.into(),
            risk,
            status,
        };

        if request.status == ApprovalStatus::Pending {
            self.pending.push(request.clone());
        }

        request
    }

    pub fn approve(&mut self, request_id: &str) -> Option<ApprovalAuditEntry> {
        self.resolve(request_id, ApprovalStatus::Approved)
    }

    pub fn reject(&mut self, request_id: &str) -> Option<ApprovalAuditEntry> {
        self.resolve(request_id, ApprovalStatus::Rejected)
    }

    pub fn can_run(request: &CommandApprovalRequest) -> bool {
        request.status == ApprovalStatus::Approved
    }

    pub fn pending(&self) -> &[CommandApprovalRequest] {
        &self.pending
    }

    pub fn audit(&self) -> &[ApprovalAuditEntry] {
        &self.audit
    }

    fn resolve(
        &mut self,
        request_id: &str,
        decision: ApprovalStatus,
    ) -> Option<ApprovalAuditEntry> {
        let index = self.pending.iter().position(|item| item.id == request_id)?;
        let mut request = self.pending.remove(index);
        request.status = decision.clone();

        let entry = ApprovalAuditEntry {
            request_id: request.id,
            message: format!("Command {} by user decision", decision_label(&decision)),
            decision,
        };
        self.audit.push(entry.clone());
        Some(entry)
    }
}

pub fn classify_command_risk(command: &str) -> RiskLevel {
    let lower = command.to_ascii_lowercase();
    let high_risk = [
        "rm -rf",
        "git reset --hard",
        "git clean",
        "sudo ",
        "del /s",
        "rmdir /s",
        "format ",
    ];

    if high_risk.iter().any(|pattern| lower.contains(pattern)) {
        return RiskLevel::High;
    }

    if lower.contains("npm install")
        || lower.contains("pnpm add")
        || lower.contains("curl ")
        || lower.contains("git push")
    {
        return RiskLevel::Medium;
    }

    RiskLevel::Low
}

fn decision_label(status: &ApprovalStatus) -> &'static str {
    match status {
        ApprovalStatus::Pending => "left pending",
        ApprovalStatus::Approved => "approved",
        ApprovalStatus::Rejected => "rejected",
    }
}

#[cfg(test)]
mod tests {
    use super::{classify_command_risk, ApprovalQueue};
    use crate::permission_profile::{PermissionProfile, RiskLevel};

    #[test]
    fn classifies_destructive_commands_as_high_risk() {
        assert_eq!(classify_command_risk("git reset --hard"), RiskLevel::High);
    }

    #[test]
    fn rejected_commands_cannot_run() {
        let mut queue = ApprovalQueue::default();
        let request = queue.request(
            PermissionProfile::Suggest,
            "cargo test",
            "/tmp/project",
            "verify project",
        );

        assert!(!ApprovalQueue::can_run(&request));
        let entry = queue.reject(&request.id).expect("request rejected");
        assert_eq!(entry.message, "Command rejected by user decision");
        assert!(queue.pending().is_empty());
        assert_eq!(queue.audit().len(), 1);
    }

    #[test]
    fn controlled_low_risk_shell_can_run_without_queue() {
        let mut queue = ApprovalQueue::default();
        let request = queue.request(
            PermissionProfile::ControlledFullAuto,
            "cargo test",
            "/tmp/project",
            "verify project",
        );

        assert!(ApprovalQueue::can_run(&request));
        assert!(queue.pending().is_empty());
    }
}
