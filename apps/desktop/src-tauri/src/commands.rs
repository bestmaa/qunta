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
    pub os: &'static str,
    pub paths: DesktopPaths,
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
        os: std::env::consts::OS,
        paths: desktop_paths(),
    }
}

fn app_info() -> AppInfo {
    AppInfo::new("Qunta", env!("CARGO_PKG_VERSION"))
}

fn path_string(path: std::io::Result<std::path::PathBuf>) -> String {
    path.map(|value| value.display().to_string())
        .unwrap_or_else(|_| String::from("unknown"))
}
