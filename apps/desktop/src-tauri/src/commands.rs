use desktop_core::AppInfo;
use serde::Serialize;

#[derive(Debug, Serialize)]
pub struct DesktopHealth {
    pub name: String,
    pub status: &'static str,
    pub version: String,
}

#[tauri::command]
pub fn desktop_health() -> DesktopHealth {
    let info = AppInfo::new("Qunta", env!("CARGO_PKG_VERSION"));

    DesktopHealth {
        name: info.name,
        status: "ok",
        version: info.version,
    }
}
