mod commands;

pub use commands::{desktop_health, DesktopHealth};

#[cfg(not(test))]
pub fn run() {
    tauri::Builder::default()
        .invoke_handler(tauri::generate_handler![commands::desktop_health])
        .run(tauri::generate_context!())
        .expect("failed to run Tauri app");
}

#[cfg(test)]
mod tests {
    use super::desktop_health;

    #[test]
    fn reports_desktop_health() {
        let health = desktop_health();

        assert_eq!(health.status, "ok");
    }
}
