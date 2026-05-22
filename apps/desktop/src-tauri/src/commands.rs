use agent_runner::sidecar::{
    default_bundled_candidate, diagnose_sidecar, read_codex_version, SidecarConfig, SidecarSource,
};
use desktop_core::AppInfo;
use sandbox::{
    git_status::inspect_git_status,
    scanner::{scan_workspace, GitState},
};
use serde::Serialize;

#[derive(Debug, Serialize)]
pub struct DesktopAppInfo {
    pub identifier: &'static str,
    pub name: String,
    pub version: String,
}

#[derive(Debug, Serialize)]
pub struct DesktopHealth {
    pub name: String,
    pub status: &'static str,
    pub version: String,
}

#[derive(Debug, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct DesktopPaths {
    pub current_dir: String,
    pub temp_dir: String,
}

#[derive(Debug, Serialize)]
pub struct DesktopDiagnostics {
    pub app: DesktopAppInfo,
    pub codex: DesktopCodexSidecarDiagnostics,
    pub os: &'static str,
    pub paths: DesktopPaths,
}

#[derive(Debug, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct DesktopCodexSidecarDiagnostics {
    pub ready: bool,
    pub message: String,
    pub required_version: String,
    pub detected_version: Option<String>,
    pub path: Option<String>,
    pub source: Option<&'static str>,
}

#[derive(Debug, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct DesktopProjectMetadata {
    pub id: String,
    pub name: String,
    pub path: String,
    pub is_git_repository: bool,
}

#[derive(Debug, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct DesktopWorkspaceSummary {
    pub root: String,
    pub name: String,
    pub languages: Vec<String>,
    pub package_managers: Vec<String>,
    pub test_commands: Vec<String>,
    pub git_state: &'static str,
    pub ignored_entries: Vec<String>,
}

#[derive(Debug, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct DesktopGitChangedFile {
    pub path: String,
    pub status: String,
}

#[derive(Debug, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct DesktopGitCheckpoint {
    pub id: String,
    pub label: String,
    pub created_at_unix: u64,
}

#[derive(Debug, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct DesktopGitStatusSnapshot {
    pub root: String,
    pub branch: String,
    pub is_dirty: bool,
    pub changed_files: Vec<DesktopGitChangedFile>,
    pub checkpoint: DesktopGitCheckpoint,
}

#[tauri::command]
pub fn desktop_app_info() -> DesktopAppInfo {
    let info = app_info();

    DesktopAppInfo {
        identifier: "com.bestmaa.qunta",
        name: info.name,
        version: info.version,
    }
}

#[tauri::command]
pub fn desktop_health() -> DesktopHealth {
    let info = app_info();

    DesktopHealth {
        name: info.name,
        status: "ok",
        version: info.version,
    }
}

#[tauri::command]
pub fn desktop_paths() -> DesktopPaths {
    DesktopPaths {
        current_dir: path_string(std::env::current_dir()),
        temp_dir: std::env::temp_dir().display().to_string(),
    }
}

#[tauri::command]
pub fn desktop_diagnostics() -> DesktopDiagnostics {
    DesktopDiagnostics {
        app: desktop_app_info(),
        codex: desktop_codex_sidecar_diagnostics(),
        os: std::env::consts::OS,
        paths: desktop_paths(),
    }
}

#[tauri::command]
pub fn desktop_codex_sidecar_diagnostics() -> DesktopCodexSidecarDiagnostics {
    let config = SidecarConfig::new(default_bundled_candidate());
    let diagnostics = diagnose_sidecar(&config, read_codex_version);
    let location = diagnostics.location;

    DesktopCodexSidecarDiagnostics {
        ready: diagnostics.ready,
        message: diagnostics.message,
        required_version: diagnostics.required_version,
        detected_version: diagnostics.detected_version,
        path: location
            .as_ref()
            .map(|value| value.path.display().to_string()),
        source: location.map(|value| source_label(&value.source)),
    }
}

#[tauri::command]
pub fn desktop_validate_project_path(path: String) -> Result<DesktopProjectMetadata, String> {
    let canonical = std::path::PathBuf::from(path)
        .canonicalize()
        .map_err(|error| format!("Project path is not available: {error}"))?;

    if !canonical.is_dir() {
        return Err(String::from("Project path must be a folder"));
    }

    let name = canonical
        .file_name()
        .and_then(|value| value.to_str())
        .filter(|value| !value.trim().is_empty())
        .unwrap_or("Project")
        .to_string();
    let path = canonical.display().to_string();

    Ok(DesktopProjectMetadata {
        id: path.clone(),
        name,
        is_git_repository: canonical.join(".git").is_dir(),
        path,
    })
}

#[tauri::command]
pub fn desktop_scan_workspace(path: String) -> Result<DesktopWorkspaceSummary, String> {
    let summary = scan_workspace(path).map_err(|error| error.to_string())?;

    Ok(DesktopWorkspaceSummary {
        root: summary.root.display().to_string(),
        name: summary.name,
        languages: summary.languages,
        package_managers: summary.package_managers,
        test_commands: summary.test_commands,
        git_state: git_state_label(&summary.git_state),
        ignored_entries: summary.ignored_entries,
    })
}

#[tauri::command]
pub fn desktop_git_status(path: String) -> Result<DesktopGitStatusSnapshot, String> {
    let snapshot = inspect_git_status(path).map_err(|error| error.to_string())?;

    Ok(DesktopGitStatusSnapshot {
        root: snapshot.root.display().to_string(),
        branch: snapshot.branch,
        is_dirty: snapshot.is_dirty,
        changed_files: snapshot
            .changed_files
            .into_iter()
            .map(|file| DesktopGitChangedFile {
                path: file.path,
                status: file.status,
            })
            .collect(),
        checkpoint: DesktopGitCheckpoint {
            id: snapshot.checkpoint.id,
            label: snapshot.checkpoint.label,
            created_at_unix: snapshot.checkpoint.created_at_unix,
        },
    })
}

fn app_info() -> AppInfo {
    AppInfo::new("Qunta", env!("CARGO_PKG_VERSION"))
}

fn git_state_label(value: &GitState) -> &'static str {
    match value {
        GitState::Clean => "clean",
        GitState::Dirty => "dirty",
        GitState::NotRepository => "notRepository",
        GitState::Unknown => "unknown",
    }
}

fn source_label(source: &SidecarSource) -> &'static str {
    match source {
        SidecarSource::DevOverride => "devOverride",
        SidecarSource::Bundled => "bundled",
    }
}

fn path_string(path: std::io::Result<std::path::PathBuf>) -> String {
    path.map(|value| value.display().to_string())
        .unwrap_or_else(|_| String::from("unknown"))
}
