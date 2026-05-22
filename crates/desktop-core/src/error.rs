use std::fmt::{Display, Formatter};

#[derive(Debug, Clone, Eq, PartialEq)]
pub enum DesktopErrorKind {
    InvalidConfig,
    PermissionDenied,
    ProcessFailed,
    WorkspaceDenied,
}

#[derive(Debug, Clone, Eq, PartialEq)]
pub struct DesktopError {
    kind: DesktopErrorKind,
    message: String,
}

impl DesktopError {
    pub fn invalid_config(message: impl Into<String>) -> Self {
        Self {
            kind: DesktopErrorKind::InvalidConfig,
            message: message.into(),
        }
    }

    pub fn permission_denied(message: impl Into<String>) -> Self {
        Self {
            kind: DesktopErrorKind::PermissionDenied,
            message: message.into(),
        }
    }

    pub fn workspace_denied(message: impl Into<String>) -> Self {
        Self {
            kind: DesktopErrorKind::WorkspaceDenied,
            message: message.into(),
        }
    }

    pub fn kind(&self) -> &DesktopErrorKind {
        &self.kind
    }
}

impl Display for DesktopError {
    fn fmt(&self, formatter: &mut Formatter<'_>) -> std::fmt::Result {
        write!(formatter, "{:?}: {}", self.kind, self.message)
    }
}

impl std::error::Error for DesktopError {}

pub type DesktopResult<T> = Result<T, DesktopError>;
