mod error;
pub mod local_state;

pub use error::{DesktopError, DesktopErrorKind, DesktopResult};

#[derive(Debug, Clone, Eq, PartialEq)]
pub struct AppInfo {
    pub name: String,
    pub version: String,
}

impl AppInfo {
    pub fn new(name: impl Into<String>, version: impl Into<String>) -> Self {
        Self {
            name: name.into(),
            version: version.into(),
        }
    }
}

#[cfg(test)]
mod tests {
    use super::{AppInfo, DesktopError, DesktopErrorKind};

    #[test]
    fn creates_app_info() {
        let info = AppInfo::new("Coding Agent", "0.1.0");

        assert_eq!(info.name, "Coding Agent");
        assert_eq!(info.version, "0.1.0");
    }

    #[test]
    fn creates_typed_error() {
        let error = DesktopError::invalid_config("missing config");

        assert_eq!(error.kind(), &DesktopErrorKind::InvalidConfig);
    }
}
