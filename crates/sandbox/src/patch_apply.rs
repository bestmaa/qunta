use std::{
    fs,
    path::{Path, PathBuf},
};

use desktop_core::{DesktopError, DesktopResult};

#[derive(Debug, Clone, Eq, PartialEq)]
pub struct PatchChange {
    pub relative_path: PathBuf,
    pub expected_old: Option<String>,
    pub new_content: Option<String>,
}

#[derive(Debug, Clone, Eq, PartialEq)]
pub struct PatchApplyAudit {
    pub changed_paths: Vec<PathBuf>,
    pub message: String,
}

pub fn apply_patch_changes(
    workspace_root: impl AsRef<Path>,
    changes: &[PatchChange],
) -> DesktopResult<PatchApplyAudit> {
    let root = workspace_root
        .as_ref()
        .canonicalize()
        .map_err(|error| DesktopError::workspace_denied(error.to_string()))?;
    let mut backups = Vec::new();
    let mut changed_paths = Vec::new();

    for change in changes {
        let target = resolve_target(&root, &change.relative_path)?;
        let old_content = fs::read_to_string(&target).ok();

        if old_content != change.expected_old {
            rollback(&backups)?;
            return Err(DesktopError::storage_failed(format!(
                "Patch conflict at {}",
                change.relative_path.display()
            )));
        }

        backups.push((target.clone(), old_content));
        write_change(&target, change.new_content.as_deref())?;
        changed_paths.push(change.relative_path.clone());
    }

    Ok(PatchApplyAudit {
        changed_paths,
        message: format!("Applied {} accepted patch change(s)", changes.len()),
    })
}

fn resolve_target(root: &Path, relative_path: &Path) -> DesktopResult<PathBuf> {
    if relative_path.is_absolute()
        || relative_path
            .components()
            .any(|part| part.as_os_str() == "..")
    {
        return Err(DesktopError::workspace_denied(
            "patch path must stay inside workspace",
        ));
    }

    let target = root.join(relative_path);
    let parent = target
        .parent()
        .ok_or_else(|| DesktopError::workspace_denied("patch path has no parent"))?;
    let canonical_parent = parent
        .canonicalize()
        .map_err(|error| DesktopError::workspace_denied(error.to_string()))?;

    if !canonical_parent.starts_with(root) {
        return Err(DesktopError::workspace_denied(
            "patch target escapes workspace",
        ));
    }

    Ok(target)
}

fn write_change(target: &Path, content: Option<&str>) -> DesktopResult<()> {
    match content {
        Some(content) => fs::write(target, content)
            .map_err(|error| DesktopError::storage_failed(error.to_string())),
        None => {
            fs::remove_file(target).map_err(|error| DesktopError::storage_failed(error.to_string()))
        }
    }
}

fn rollback(backups: &[(PathBuf, Option<String>)]) -> DesktopResult<()> {
    for (path, content) in backups.iter().rev() {
        match content {
            Some(content) => {
                fs::write(path, content)
                    .map_err(|error| DesktopError::storage_failed(error.to_string()))?;
            }
            None if path.exists() => {
                fs::remove_file(path)
                    .map_err(|error| DesktopError::storage_failed(error.to_string()))?;
            }
            None => {}
        }
    }

    Ok(())
}

#[cfg(test)]
mod tests {
    use super::{apply_patch_changes, PatchChange};

    #[test]
    fn applies_changes_inside_workspace() {
        let root = fixture_root("apply");
        let _ = std::fs::remove_dir_all(&root);
        std::fs::create_dir_all(root.join("src")).expect("fixture dir");
        std::fs::write(root.join("src/app.ts"), "old").expect("fixture file");

        let audit = apply_patch_changes(
            &root,
            &[PatchChange {
                relative_path: "src/app.ts".into(),
                expected_old: Some(String::from("old")),
                new_content: Some(String::from("new")),
            }],
        )
        .expect("patch applies");

        assert_eq!(
            audit.changed_paths,
            vec![std::path::PathBuf::from("src/app.ts")]
        );
        assert_eq!(
            std::fs::read_to_string(root.join("src/app.ts")).expect("file"),
            "new"
        );

        std::fs::remove_dir_all(root).expect("cleanup");
    }

    #[test]
    fn rejects_workspace_escape() {
        let root = fixture_root("escape");
        let _ = std::fs::remove_dir_all(&root);
        std::fs::create_dir_all(&root).expect("fixture dir");

        let result = apply_patch_changes(
            &root,
            &[PatchChange {
                relative_path: "../outside.txt".into(),
                expected_old: None,
                new_content: Some(String::from("nope")),
            }],
        );

        assert!(result.is_err());
        std::fs::remove_dir_all(root).expect("cleanup");
    }

    #[test]
    fn reports_conflict_without_overwriting() {
        let root = fixture_root("conflict");
        let _ = std::fs::remove_dir_all(&root);
        std::fs::create_dir_all(&root).expect("fixture dir");
        std::fs::write(root.join("file.txt"), "current").expect("fixture file");

        let result = apply_patch_changes(
            &root,
            &[PatchChange {
                relative_path: "file.txt".into(),
                expected_old: Some(String::from("old")),
                new_content: Some(String::from("new")),
            }],
        );

        assert!(result.is_err());
        assert_eq!(
            std::fs::read_to_string(root.join("file.txt")).expect("file"),
            "current"
        );
        std::fs::remove_dir_all(root).expect("cleanup");
    }

    fn fixture_root(name: &str) -> std::path::PathBuf {
        std::env::temp_dir().join(format!("qunta-patch-{name}-{}", std::process::id()))
    }
}
