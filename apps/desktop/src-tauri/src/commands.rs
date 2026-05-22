use agent_runner::sidecar::{
    default_bundled_candidate, diagnose_sidecar, read_codex_version, SidecarConfig, SidecarSource,
};
use desktop_core::AppInfo;
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

fn app_info() -> AppInfo {
    AppInfo::new("Qunta", env!("CARGO_PKG_VERSION"))
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
