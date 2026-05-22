mod commands;

pub use commands::{
    desktop_app_info, desktop_diagnostics, desktop_health, desktop_paths, DesktopAppInfo,
    DesktopDiagnostics, DesktopHealth, DesktopPaths,
};

#[cfg(not(test))]
pub fn run() {
    tauri::Builder::default()
        .invoke_handler(tauri::generate_handler![
            commands::desktop_app_info,
            commands::desktop_health,
            commands::desktop_paths,
            commands::desktop_diagnostics
        ])
        .run(tauri::generate_context!())
        .expect("failed to run Tauri app");
}

#[cfg(test)]
mod tests {
    use super::{desktop_app_info, desktop_diagnostics, desktop_health, desktop_paths};

    #[test]
    fn reports_desktop_health() {
        let health = desktop_health();

        assert_eq!(health.status, "ok");
    }

    #[test]
    fn reports_app_info() {
        let info = desktop_app_info();

        assert_eq!(info.identifier, "com.bestmaa.qunta");
        assert_eq!(info.name, "Qunta");
    }

    #[test]
    fn reports_paths_and_diagnostics() {
        let paths = desktop_paths();
        let diagnostics = desktop_diagnostics();

        assert!(!paths.temp_dir.is_empty());
        assert_eq!(diagnostics.app.name, "Qunta");
    }
}
