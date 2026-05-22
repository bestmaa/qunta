use std::path::{Path, PathBuf};

use desktop_core::{DesktopError, DesktopResult};
use sandbox::{command_approval::CommandApprovalRequest, permission_profile::RiskLevel};

use crate::{
    codex_config::{
        generate_codex_config, ApprovalMode, CodexConfigInput, ModelIntent, SandboxMode,
    },
    process::{AgentProcess, ProcessEvent, ProcessSpec},
};

#[derive(Debug, Clone, Eq, PartialEq)]
pub struct MockSessionInput {
    pub session_id: String,
    pub workspace_path: PathBuf,
    pub config_root: PathBuf,
    pub gateway_base_url: String,
    pub gateway_session_token: String,
    pub prompt: String,
}

#[derive(Debug, Clone, Eq, PartialEq)]
pub enum SessionEvent {
    Started,
    AgentStdout(String),
    AgentStderr(String),
    CommandApprovalRequested {
        command: String,
        cwd: String,
        reason: String,
        risk: RiskLevel,
    },
    Completed,
}

#[derive(Debug, Clone, Eq, PartialEq)]
pub struct SessionResult {
    pub exit_code: Option<i32>,
    pub events: Vec<SessionEvent>,
    pub changed_files: Vec<PathBuf>,
}

pub fn run_controlled_mock_session(input: &MockSessionInput) -> DesktopResult<SessionResult> {
    validate_temp_workspace(&input.workspace_path)?;
    validate_prompt(&input.prompt)?;

    let config = generate_codex_config(&CodexConfigInput {
        session_id: input.session_id.clone(),
        workspace_path: input.workspace_path.clone(),
        config_root: input.config_root.clone(),
        gateway_base_url: input.gateway_base_url.clone(),
        gateway_session_token: input.gateway_session_token.clone(),
        model_intent: ModelIntent::Balanced,
        sandbox_mode: SandboxMode::WorkspaceWrite,
        approval_mode: ApprovalMode::OnRequest,
    })?;

    let process_result = AgentProcess::spawn(mock_agent_spec(&input.workspace_path))?.wait();
    let cleanup_result = config.cleanup();
    cleanup_result?;

    let exit = process_result?;
    let mut events = vec![SessionEvent::Started];
    events.extend(exit.events.into_iter().map(map_process_event));
    events.push(SessionEvent::Completed);

    Ok(SessionResult {
        exit_code: exit.code,
        events,
        changed_files: vec![input.workspace_path.join("qunta-agent-output.txt")],
    })
}

pub fn command_approval_event(request: &CommandApprovalRequest) -> SessionEvent {
    SessionEvent::CommandApprovalRequested {
        command: request.command.clone(),
        cwd: request.cwd.display().to_string(),
        reason: request.reason.clone(),
        risk: request.risk,
    }
}

fn validate_temp_workspace(path: &Path) -> DesktopResult<()> {
    let temp_root = std::env::temp_dir()
        .canonicalize()
        .map_err(|error| DesktopError::workspace_denied(error.to_string()))?;
    let workspace = path
        .canonicalize()
        .map_err(|error| DesktopError::workspace_denied(error.to_string()))?;

    if workspace.starts_with(temp_root) {
        return Ok(());
    }

    Err(DesktopError::workspace_denied(
        "mock session must use a temporary test workspace",
    ))
}

fn validate_prompt(prompt: &str) -> DesktopResult<()> {
    if prompt.trim().is_empty() {
        return Err(DesktopError::invalid_config("session prompt is required"));
    }

    Ok(())
}

fn map_process_event(event: ProcessEvent) -> SessionEvent {
    match event {
        ProcessEvent::Stdout(line) => SessionEvent::AgentStdout(line),
        ProcessEvent::Stderr(line) => SessionEvent::AgentStderr(line),
    }
}

fn mock_agent_spec(workspace_path: &Path) -> ProcessSpec {
    #[cfg(windows)]
    let (program, args) = (
        "cmd",
        vec![
            "/C",
            "echo session-start && echo harmless-change>qunta-agent-output.txt",
        ],
    );

    #[cfg(not(windows))]
    let (program, args) = (
        "sh",
        vec![
            "-c",
            "echo session-start; printf harmless-change > qunta-agent-output.txt",
        ],
    );

    ProcessSpec {
        program: String::from(program),
        args: args.into_iter().map(String::from).collect(),
        cwd: Some(workspace_path.to_path_buf()),
    }
}

#[cfg(test)]
mod tests {
    use sandbox::{
        command_approval::ApprovalQueue,
        permission_profile::{PermissionProfile, RiskLevel},
    };

    use super::{
        command_approval_event, run_controlled_mock_session, MockSessionInput, SessionEvent,
    };

    #[test]
    fn runs_mock_session_and_writes_harmless_change() {
        let root = std::env::temp_dir().join(format!("qunta-session-{}", std::process::id()));
        let workspace = root.join("workspace");
        let config_root = root.join("config");
        let output = workspace.join("qunta-agent-output.txt");
        let _ = std::fs::remove_dir_all(&root);
        std::fs::create_dir_all(&workspace).expect("workspace exists");

        let result = run_controlled_mock_session(&MockSessionInput {
            session_id: String::from("session_123"),
            workspace_path: workspace.clone(),
            config_root: config_root.clone(),
            gateway_base_url: String::from("https://gateway.test"),
            gateway_session_token: String::from("temp-token"),
            prompt: String::from("write harmless test file"),
        })
        .expect("session runs");

        assert_eq!(result.exit_code, Some(0));
        assert!(result.events.contains(&SessionEvent::Started));
        assert!(result.events.contains(&SessionEvent::Completed));
        assert!(result.changed_files.contains(&output));
        let written = std::fs::read_to_string(output).expect("file written");
        assert_eq!(written.trim(), "harmless-change");
        assert!(!config_root.join("session_123").exists());

        std::fs::remove_dir_all(root).expect("test workspace cleans up");
    }

    #[test]
    fn rejects_non_temp_workspace() {
        let input = MockSessionInput {
            session_id: String::from("session_123"),
            workspace_path: std::env::current_dir().expect("current dir"),
            config_root: std::env::temp_dir().join("qunta-session-config"),
            gateway_base_url: String::from("https://gateway.test"),
            gateway_session_token: String::from("temp-token"),
            prompt: String::from("write harmless test file"),
        };

        assert!(run_controlled_mock_session(&input).is_err());
    }

    #[test]
    fn maps_command_approval_to_session_event() {
        let mut queue = ApprovalQueue::default();
        let request = queue.request(
            PermissionProfile::Suggest,
            "pnpm test",
            "/tmp/project",
            "verify project",
        );
        let event = command_approval_event(&request);

        assert_eq!(
            event,
            SessionEvent::CommandApprovalRequested {
                command: String::from("pnpm test"),
                cwd: String::from("/tmp/project"),
                reason: String::from("verify project"),
                risk: RiskLevel::Low,
            }
        );
    }
}
