use std::path::{Path, PathBuf};

use desktop_core::{DesktopError, DesktopResult};

use crate::{
    command_approval::{ApprovalQueue, CommandApprovalRequest},
    permission_profile::PermissionProfile,
};

#[derive(Debug, Clone, Eq, PartialEq)]
pub struct VerificationCommand {
    pub command: String,
    pub cwd: PathBuf,
    pub reason: String,
}

pub fn suggest_verification_commands(
    workspace_root: impl Into<PathBuf>,
    commands: &[String],
) -> Vec<VerificationCommand> {
    let cwd = workspace_root.into();

    commands
        .iter()
        .map(|command| VerificationCommand {
            command: command.clone(),
            cwd: cwd.clone(),
            reason: String::from("verify accepted changes"),
        })
        .collect()
}

pub fn request_verification_approval(
    queue: &mut ApprovalQueue,
    profile: PermissionProfile,
    workspace_root: impl AsRef<Path>,
    command: &VerificationCommand,
) -> DesktopResult<CommandApprovalRequest> {
    let root = workspace_root
        .as_ref()
        .canonicalize()
        .map_err(|error| DesktopError::workspace_denied(error.to_string()))?;
    let cwd = command
        .cwd
        .canonicalize()
        .map_err(|error| DesktopError::workspace_denied(error.to_string()))?;

    if !cwd.starts_with(root) {
        return Err(DesktopError::workspace_denied(
            "verification command must run inside selected project",
        ));
    }

    Ok(queue.request(
        profile,
        command.command.clone(),
        cwd,
        command.reason.clone(),
    ))
}

#[cfg(test)]
mod tests {
    use super::{
        request_verification_approval, suggest_verification_commands, VerificationCommand,
    };
    use crate::{command_approval::ApprovalQueue, permission_profile::PermissionProfile};

    #[test]
    fn suggests_commands_in_workspace_cwd() {
        let root = std::env::temp_dir();
        let suggestions =
            suggest_verification_commands(root.clone(), &[String::from("cargo test")]);

        assert_eq!(suggestions[0].cwd, root);
        assert_eq!(suggestions[0].reason, "verify accepted changes");
    }

    #[test]
    fn requests_approval_for_verification_command() {
        let root = fixture_root("approval");
        let _ = std::fs::remove_dir_all(&root);
        std::fs::create_dir_all(&root).expect("fixture dir");
        let mut queue = ApprovalQueue::default();
        let command = VerificationCommand {
            command: String::from("cargo test"),
            cwd: root.clone(),
            reason: String::from("verify accepted changes"),
        };

        let request =
            request_verification_approval(&mut queue, PermissionProfile::Suggest, &root, &command)
                .expect("approval requested");

        assert_eq!(request.command, "cargo test");
        assert_eq!(queue.pending().len(), 1);
        std::fs::remove_dir_all(root).expect("cleanup");
    }

    #[test]
    fn rejects_commands_outside_workspace() {
        let root = fixture_root("outside");
        let outside = fixture_root("outside-other");
        let _ = std::fs::remove_dir_all(&root);
        let _ = std::fs::remove_dir_all(&outside);
        std::fs::create_dir_all(&root).expect("root dir");
        std::fs::create_dir_all(&outside).expect("outside dir");
        let mut queue = ApprovalQueue::default();
        let command = VerificationCommand {
            command: String::from("cargo test"),
            cwd: outside.clone(),
            reason: String::from("verify accepted changes"),
        };

        assert!(request_verification_approval(
            &mut queue,
            PermissionProfile::Suggest,
            &root,
            &command
        )
        .is_err());
        assert!(queue.pending().is_empty());
        std::fs::remove_dir_all(root).expect("cleanup root");
        std::fs::remove_dir_all(outside).expect("cleanup outside");
    }

    fn fixture_root(name: &str) -> std::path::PathBuf {
        std::env::temp_dir().join(format!("qunta-verify-{name}-{}", std::process::id()))
    }
}
