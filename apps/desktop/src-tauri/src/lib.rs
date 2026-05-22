mod commands;
mod diagnostics_bundle;

pub use commands::{
    desktop_app_info, desktop_codex_sidecar_diagnostics, desktop_diagnostics, desktop_git_status,
    desktop_health, desktop_paths, desktop_scan_workspace, desktop_validate_project_path,
    DesktopAppInfo, DesktopCodexSidecarDiagnostics, DesktopDiagnostics, DesktopGitChangedFile,
    DesktopGitCheckpoint, DesktopGitStatusSnapshot, DesktopHealth, DesktopPaths,
    DesktopProjectMetadata, DesktopWorkspaceSummary,
};
pub use diagnostics_bundle::{desktop_export_diagnostics_bundle, DiagnosticsBundle};

#[cfg(not(test))]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_dialog::init())
        .invoke_handler(tauri::generate_handler![
            commands::desktop_app_info,
            commands::desktop_health,
            commands::desktop_paths,
            commands::desktop_diagnostics,
            commands::desktop_codex_sidecar_diagnostics,
            commands::desktop_validate_project_path,
            commands::desktop_scan_workspace,
            commands::desktop_git_status,
            diagnostics_bundle::desktop_export_diagnostics_bundle
        ])
        .run(tauri::generate_context!())
        .expect("failed to run Tauri app");
}

#[cfg(test)]
mod tests {
    use super::{
        desktop_app_info, desktop_codex_sidecar_diagnostics, desktop_diagnostics,
        desktop_git_status, desktop_health, desktop_paths, desktop_scan_workspace,
        desktop_validate_project_path,
    };
    use crate::desktop_export_diagnostics_bundle;

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

    #[test]
    fn reports_codex_sidecar_diagnostics() {
        let diagnostics = desktop_codex_sidecar_diagnostics();

        assert!(!diagnostics.message.is_empty());
        assert!(!diagnostics.required_version.is_empty());
    }

    #[test]
    fn validates_project_path_metadata() {
        let metadata = desktop_validate_project_path(std::env::temp_dir().display().to_string())
            .expect("temp dir is a valid project path");

        assert!(!metadata.name.is_empty());
        assert!(!metadata.path.is_empty());
    }

    #[test]
    fn scans_workspace_summary() {
        let summary = desktop_scan_workspace(std::env::temp_dir().display().to_string())
            .expect("temp dir can be scanned");

        assert!(!summary.name.is_empty());
    }

    #[test]
    fn rejects_git_status_for_non_repo() {
        let status = desktop_git_status(std::env::temp_dir().display().to_string());

        assert!(status.is_err());
    }

    #[test]
    fn exports_masked_diagnostics_bundle() {
        let bundle = desktop_export_diagnostics_bundle(true);

        assert!(bundle.privacy_mode);
        assert!(bundle
            .masked_logs
            .iter()
            .all(|line| !line.contains("sk-demo")));
    }
}
