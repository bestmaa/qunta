use std::{
    path::{Path, PathBuf},
    process::Command,
    time::{SystemTime, UNIX_EPOCH},
};

use desktop_core::{DesktopError, DesktopResult};

#[derive(Debug, Clone, Eq, PartialEq)]
pub struct GitChangedFile {
    pub path: String,
    pub status: String,
}

#[derive(Debug, Clone, Eq, PartialEq)]
pub struct GitCheckpoint {
    pub id: String,
    pub label: String,
    pub created_at_unix: u64,
}

#[derive(Debug, Clone, Eq, PartialEq)]
pub struct GitStatusSnapshot {
    pub root: PathBuf,
    pub branch: String,
    pub is_dirty: bool,
    pub changed_files: Vec<GitChangedFile>,
    pub checkpoint: GitCheckpoint,
}

pub fn inspect_git_status(root: impl AsRef<Path>) -> DesktopResult<GitStatusSnapshot> {
    let root = root
        .as_ref()
        .canonicalize()
        .map_err(|error| DesktopError::workspace_denied(error.to_string()))?;

    if !root.join(".git").exists() {
        return Err(DesktopError::workspace_denied(
            "git status requires a git workspace",
        ));
    }

    let output = Command::new("git")
        .arg("-C")
        .arg(&root)
        .arg("status")
        .arg("--porcelain=v1")
        .arg("--branch")
        .output()
        .map_err(|error| DesktopError::workspace_denied(error.to_string()))?;

    if !output.status.success() {
        return Err(DesktopError::workspace_denied(
            "git status could not inspect workspace",
        ));
    }

    let status = String::from_utf8_lossy(&output.stdout);
    Ok(snapshot_from_porcelain(&root, &status))
}

fn snapshot_from_porcelain(root: &Path, status: &str) -> GitStatusSnapshot {
    let branch = parse_branch(status).unwrap_or_else(|| String::from("unknown"));
    let changed_files = parse_changed_files(status);
    let is_dirty = !changed_files.is_empty();

    GitStatusSnapshot {
        checkpoint: checkpoint_for(&branch, is_dirty),
        root: root.to_path_buf(),
        branch,
        is_dirty,
        changed_files,
    }
}

fn parse_branch(status: &str) -> Option<String> {
    status.lines().find_map(|line| {
        line.strip_prefix("## ")
            .and_then(|value| value.split("...").next())
            .map(str::trim)
            .filter(|value| !value.is_empty())
            .map(ToOwned::to_owned)
    })
}

fn parse_changed_files(status: &str) -> Vec<GitChangedFile> {
    status
        .lines()
        .filter(|line| !line.starts_with("## "))
        .filter_map(parse_changed_file)
        .collect()
}

fn parse_changed_file(line: &str) -> Option<GitChangedFile> {
    if line.len() < 4 {
        return None;
    }

    let code = line.get(0..2)?;
    let raw_path = line.get(3..)?.trim();
    let path = raw_path
        .rsplit(" -> ")
        .next()
        .unwrap_or(raw_path)
        .to_string();

    Some(GitChangedFile {
        path,
        status: status_label(code),
    })
}

fn status_label(code: &str) -> String {
    if code == "??" {
        return String::from("untracked");
    }

    if code.contains('D') {
        return String::from("deleted");
    }

    if code.contains('A') {
        return String::from("added");
    }

    if code.contains('M') {
        return String::from("modified");
    }

    String::from("changed")
}

fn checkpoint_for(branch: &str, is_dirty: bool) -> GitCheckpoint {
    let state = if is_dirty { "dirty" } else { "clean" };
    let created_at_unix = SystemTime::now()
        .duration_since(UNIX_EPOCH)
        .map(|value| value.as_secs())
        .unwrap_or_default();

    GitCheckpoint {
        id: format!("local-{branch}-{state}").replace('/', "-"),
        label: format!("Local checkpoint before agent run on {branch}"),
        created_at_unix,
    }
}

#[cfg(test)]
mod tests {
    use super::snapshot_from_porcelain;

    #[test]
    fn parses_git_status_fixture() {
        let snapshot = snapshot_from_porcelain(
            std::path::Path::new("/tmp/project"),
            "## main...origin/main\n M src/app.ts\nA  README.md\n?? notes.md\n",
        );

        assert_eq!(snapshot.branch, "main");
        assert!(snapshot.is_dirty);
        assert_eq!(snapshot.changed_files.len(), 3);
        assert_eq!(snapshot.changed_files[0].status, "modified");
        assert_eq!(snapshot.changed_files[2].path, "notes.md");
        assert!(snapshot.checkpoint.id.contains("main-dirty"));
    }
}
