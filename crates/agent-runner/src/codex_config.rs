use std::{fs, path::PathBuf};

use desktop_core::{DesktopError, DesktopResult};

pub const GATEWAY_TOKEN_ENV: &str = "QUNTA_GATEWAY_SESSION_TOKEN";

#[derive(Debug, Clone, Eq, PartialEq)]
pub enum ModelIntent {
    Balanced,
    Fast,
    HighQuality,
}

#[derive(Debug, Clone, Eq, PartialEq)]
pub enum SandboxMode {
    ReadOnly,
    WorkspaceWrite,
}

#[derive(Debug, Clone, Eq, PartialEq)]
pub enum ApprovalMode {
    Suggest,
    OnRequest,
    AutoEdit,
}

#[derive(Debug, Clone, Eq, PartialEq)]
pub struct CodexConfigInput {
    pub session_id: String,
    pub workspace_path: PathBuf,
    pub config_root: PathBuf,
    pub gateway_base_url: String,
    pub gateway_session_token: String,
    pub model_intent: ModelIntent,
    pub sandbox_mode: SandboxMode,
    pub approval_mode: ApprovalMode,
}

#[derive(Debug, Clone, Eq, PartialEq)]
pub struct CodexSessionConfig {
    pub session_dir: PathBuf,
    pub config_path: PathBuf,
    pub launch_env: Vec<(String, String)>,
}

impl CodexSessionConfig {
    pub fn cleanup(&self) -> DesktopResult<()> {
        if self.session_dir.exists() {
            fs::remove_dir_all(&self.session_dir)
                .map_err(|error| DesktopError::storage_failed(error.to_string()))?;
        }

        Ok(())
    }
}

pub fn generate_codex_config(input: &CodexConfigInput) -> DesktopResult<CodexSessionConfig> {
    validate_input(input)?;

    let session_dir = input.config_root.join(safe_session_id(&input.session_id)?);
    fs::create_dir_all(&session_dir)
        .map_err(|error| DesktopError::storage_failed(error.to_string()))?;

    let config_path = session_dir.join("config.toml");
    let content = render_config(input);
    fs::write(&config_path, content)
        .map_err(|error| DesktopError::storage_failed(error.to_string()))?;

    Ok(CodexSessionConfig {
        session_dir,
        config_path,
        launch_env: vec![(
            GATEWAY_TOKEN_ENV.to_string(),
            input.gateway_session_token.clone(),
        )],
    })
}

pub fn render_config(input: &CodexConfigInput) -> String {
    format!(
        "[qunta]\nsession_id = {}\nworkspace_path = {}\n\
gateway_base_url = {}\ngateway_token_env = {}\n\
model_intent = \"{}\"\nsandbox_mode = \"{}\"\napproval_mode = \"{}\"\n",
        toml_quote(&input.session_id),
        toml_quote(&input.workspace_path.display().to_string()),
        toml_quote(&input.gateway_base_url),
        toml_quote(GATEWAY_TOKEN_ENV),
        model_intent_value(&input.model_intent),
        sandbox_mode_value(&input.sandbox_mode),
        approval_mode_value(&input.approval_mode),
    )
}

fn validate_input(input: &CodexConfigInput) -> DesktopResult<()> {
    if input.gateway_base_url.trim().is_empty() {
        return Err(DesktopError::invalid_config("gateway base URL is required"));
    }

    if input.gateway_session_token.trim().is_empty() {
        return Err(DesktopError::invalid_config(
            "gateway session token is required",
        ));
    }

    if input.workspace_path.as_os_str().is_empty() {
        return Err(DesktopError::invalid_config("workspace path is required"));
    }

    Ok(())
}

fn safe_session_id(session_id: &str) -> DesktopResult<String> {
    let valid = !session_id.is_empty()
        && session_id
            .chars()
            .all(|value| value.is_ascii_alphanumeric() || matches!(value, '-' | '_'));

    if valid {
        return Ok(session_id.to_string());
    }

    Err(DesktopError::invalid_config(
        "session id may only contain letters, numbers, dash, and underscore",
    ))
}

fn toml_quote(value: &str) -> String {
    format!("\"{}\"", value.replace('\\', "\\\\").replace('"', "\\\""))
}

fn model_intent_value(value: &ModelIntent) -> &'static str {
    match value {
        ModelIntent::Balanced => "balanced",
        ModelIntent::Fast => "fast",
        ModelIntent::HighQuality => "high-quality",
    }
}

fn sandbox_mode_value(value: &SandboxMode) -> &'static str {
    match value {
        SandboxMode::ReadOnly => "read-only",
        SandboxMode::WorkspaceWrite => "workspace-write",
    }
}

fn approval_mode_value(value: &ApprovalMode) -> &'static str {
    match value {
        ApprovalMode::Suggest => "suggest",
        ApprovalMode::OnRequest => "on-request",
        ApprovalMode::AutoEdit => "auto-edit",
    }
}

#[cfg(test)]
mod tests {
    use super::{
        generate_codex_config, render_config, ApprovalMode, CodexConfigInput, ModelIntent,
        SandboxMode, GATEWAY_TOKEN_ENV,
    };

    #[test]
    fn renders_gateway_backed_config_without_raw_token() {
        let input = test_input();
        let rendered = render_config(&input);

        assert!(rendered.contains("gateway_base_url = \"https://gateway.test\""));
        assert!(rendered.contains("gateway_token_env = \"QUNTA_GATEWAY_SESSION_TOKEN\""));
        assert!(rendered.contains("approval_mode = \"on-request\""));
        assert!(!rendered.contains("secret-session-token"));
    }

    #[test]
    fn writes_per_session_config_and_cleans_it() {
        let input = test_input();
        let generated = generate_codex_config(&input).expect("config writes");
        let config = std::fs::read_to_string(&generated.config_path).expect("config exists");

        assert!(config.contains("session_id = \"session_123\""));
        assert_eq!(
            generated.launch_env,
            vec![(
                GATEWAY_TOKEN_ENV.to_string(),
                String::from("secret-session-token")
            )]
        );

        generated.cleanup().expect("session config cleans up");
        assert!(!generated.session_dir.exists());
    }

    #[test]
    fn rejects_path_like_session_id() {
        let mut input = test_input();
        input.session_id = String::from("../escape");

        assert!(generate_codex_config(&input).is_err());
    }

    fn test_input() -> CodexConfigInput {
        CodexConfigInput {
            session_id: String::from("session_123"),
            workspace_path: PathBuf::from("/workspace/project"),
            config_root: std::env::temp_dir().join(format!("qunta-config-{}", std::process::id())),
            gateway_base_url: String::from("https://gateway.test"),
            gateway_session_token: String::from("secret-session-token"),
            model_intent: ModelIntent::Balanced,
            sandbox_mode: SandboxMode::WorkspaceWrite,
            approval_mode: ApprovalMode::OnRequest,
        }
    }

    use std::path::PathBuf;
}
