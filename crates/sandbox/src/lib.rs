use std::path::{Path, PathBuf};

use desktop_core::{DesktopError, DesktopResult};

#[derive(Debug, Clone, Eq, PartialEq)]
pub struct WorkspaceRoot {
    root: PathBuf,
}

impl WorkspaceRoot {
    pub fn new(root: impl Into<PathBuf>) -> DesktopResult<Self> {
        let root = root.into();

        if root.as_os_str().is_empty() {
            return Err(DesktopError::workspace_denied("workspace root is required"));
        }

        Ok(Self { root })
    }

    pub fn contains(&self, candidate: &Path) -> bool {
        candidate.starts_with(&self.root)
    }

    pub fn path(&self) -> &Path {
        &self.root
    }
}

#[cfg(test)]
mod tests {
    use std::path::Path;

    use super::WorkspaceRoot;

    #[test]
    fn rejects_empty_workspace_root() {
        assert!(WorkspaceRoot::new("").is_err());
    }

    #[test]
    fn checks_candidate_path() {
        let root = WorkspaceRoot::new("/tmp/project").expect("valid root");

        assert!(root.contains(Path::new("/tmp/project/src/main.rs")));
        assert!(!root.contains(Path::new("/tmp/other/main.rs")));
    }
}
