use desktop_core::{DesktopError, DesktopResult};

#[derive(Debug, Clone, Eq, PartialEq)]
pub enum RunnerStatus {
    Idle,
    Starting,
    Running,
    Stopped,
}

#[derive(Debug, Clone, Eq, PartialEq)]
pub struct RunnerConfig {
    pub binary_path: String,
    pub workspace_path: String,
}

impl RunnerConfig {
    pub fn validate(&self) -> DesktopResult<()> {
        if self.binary_path.trim().is_empty() {
            return Err(DesktopError::invalid_config(
                "runner binary path is required",
            ));
        }

        if self.workspace_path.trim().is_empty() {
            return Err(DesktopError::invalid_config("workspace path is required"));
        }

        Ok(())
    }
}

#[cfg(test)]
mod tests {
    use super::RunnerConfig;

    #[test]
    fn rejects_empty_binary_path() {
        let config = RunnerConfig {
            binary_path: String::new(),
            workspace_path: String::from("/tmp/project"),
        };

        assert!(config.validate().is_err());
    }
}
