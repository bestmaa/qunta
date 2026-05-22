use agent_runner::sidecar::{
    default_bundled_candidate, diagnose_sidecar, read_codex_version, SidecarConfig,
};
use serde::Serialize;

use crate::commands::desktop_app_info;

#[derive(Debug, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct DiagnosticsBundle {
    pub app_version: String,
    pub config_summary: String,
    pub masked_logs: Vec<String>,
    pub os: &'static str,
    pub privacy_mode: bool,
    pub recent_errors: Vec<String>,
    pub runner_version: String,
}

#[tauri::command]
pub fn desktop_export_diagnostics_bundle(privacy_mode: bool) -> DiagnosticsBundle {
    let app = desktop_app_info();
    let runner = diagnose_sidecar(
        &SidecarConfig::new(default_bundled_candidate()),
        read_codex_version,
    );

    DiagnosticsBundle {
        app_version: app.version,
        config_summary: config_summary(privacy_mode),
        masked_logs: sample_logs(privacy_mode),
        os: std::env::consts::OS,
        privacy_mode,
        recent_errors: vec![String::from("No recent runtime errors")],
        runner_version: runner
            .detected_version
            .unwrap_or_else(|| String::from("not detected")),
    }
}

pub fn mask_diagnostics_line(line: &str, privacy_mode: bool) -> String {
    let mut masked = mask_after(line, "Bearer ");
    masked = mask_after(&masked, "qgt_");
    masked = mask_env_secret(&masked, "OPENAI_API_KEY=");
    masked = mask_env_secret(&masked, "DEEPSEEK_API_KEY=");

    if privacy_mode {
        masked = mask_path(&masked);
    }

    masked
}

fn config_summary(privacy_mode: bool) -> String {
    if privacy_mode {
        String::from("workspace=<masked>; approval=suggest; telemetry=off")
    } else {
        String::from("workspace=selected project; approval=suggest; telemetry=off")
    }
}

fn sample_logs(privacy_mode: bool) -> Vec<String> {
    [
        "runner started with Bearer qgt_dev_secret",
        "workspace=/home/user/project",
        "OPENAI_API_KEY=sk-demo",
    ]
    .iter()
    .map(|line| mask_diagnostics_line(line, privacy_mode))
    .collect()
}

fn mask_after(line: &str, marker: &str) -> String {
    line.find(marker)
        .map(|index| format!("{}{}***", &line[..index], marker))
        .unwrap_or_else(|| line.to_string())
}

fn mask_env_secret(line: &str, marker: &str) -> String {
    line.strip_prefix(marker)
        .map(|_| format!("{marker}***"))
        .unwrap_or_else(|| line.to_string())
}

fn mask_path(line: &str) -> String {
    if line.contains("/home/") || line.contains("\\Users\\") {
        return String::from("workspace=<masked>");
    }

    line.to_string()
}

#[cfg(test)]
mod tests {
    use super::mask_diagnostics_line;

    #[test]
    fn masks_tokens_and_provider_secrets() {
        let masked = mask_diagnostics_line("Bearer qgt_secret OPENAI_API_KEY=sk-demo", false);

        assert!(masked.contains("Bearer ***"));
        assert!(!masked.contains("qgt_secret"));
        assert!(!masked.contains("sk-demo"));
    }

    #[test]
    fn masks_paths_in_privacy_mode() {
        let masked = mask_diagnostics_line("workspace=/home/aditya/project", true);

        assert_eq!(masked, "workspace=<masked>");
    }
}
