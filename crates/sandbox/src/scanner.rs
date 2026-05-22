use std::{
    collections::BTreeSet,
    fs,
    path::{Path, PathBuf},
    process::Command,
};

use desktop_core::{DesktopError, DesktopResult};

#[derive(Debug, Clone, Eq, PartialEq)]
pub enum GitState {
    Clean,
    Dirty,
    NotRepository,
    Unknown,
}

#[derive(Debug, Clone, Eq, PartialEq)]
pub struct WorkspaceSummary {
    pub root: PathBuf,
    pub name: String,
    pub languages: Vec<String>,
    pub package_managers: Vec<String>,
    pub test_commands: Vec<String>,
    pub git_state: GitState,
    pub ignored_entries: Vec<String>,
}

pub fn scan_workspace(root: impl AsRef<Path>) -> DesktopResult<WorkspaceSummary> {
    let root = root
        .as_ref()
        .canonicalize()
        .map_err(|error| DesktopError::workspace_denied(error.to_string()))?;

    if !root.is_dir() {
        return Err(DesktopError::workspace_denied(
            "workspace scanner requires a folder",
        ));
    }

    let entries = safe_root_entries(&root)?;
    let names = entries.iter().cloned().collect::<BTreeSet<_>>();
    let ignored_entries = ignored_entries(&names);

    Ok(WorkspaceSummary {
        name: workspace_name(&root),
        languages: detect_languages(&names),
        package_managers: detect_package_managers(&names),
        test_commands: detect_test_commands(&names),
        git_state: detect_git_state(&root),
        ignored_entries,
        root,
    })
}

fn safe_root_entries(root: &Path) -> DesktopResult<Vec<String>> {
    let mut entries = Vec::new();

    for entry in
        fs::read_dir(root).map_err(|error| DesktopError::workspace_denied(error.to_string()))?
    {
        let entry = entry.map_err(|error| DesktopError::workspace_denied(error.to_string()))?;
        if let Some(name) = entry.file_name().to_str() {
            entries.push(name.to_string());
        }
    }

    Ok(entries)
}

fn workspace_name(root: &Path) -> String {
    root.file_name()
        .and_then(|value| value.to_str())
        .unwrap_or("Project")
        .to_string()
}

fn detect_languages(names: &BTreeSet<String>) -> Vec<String> {
    let mut values = Vec::new();
    push_if(&mut values, names.contains("Cargo.toml"), "Rust");
    push_if(
        &mut values,
        names.contains("package.json") || names.contains("tsconfig.json"),
        "TypeScript",
    );
    push_if(
        &mut values,
        names.contains("pyproject.toml") || names.contains("requirements.txt"),
        "Python",
    );
    push_if(&mut values, names.contains("go.mod"), "Go");
    values
}

fn detect_package_managers(names: &BTreeSet<String>) -> Vec<String> {
    let mut values = Vec::new();
    push_if(&mut values, names.contains("pnpm-lock.yaml"), "pnpm");
    push_if(&mut values, names.contains("package-lock.json"), "npm");
    push_if(&mut values, names.contains("yarn.lock"), "yarn");
    push_if(&mut values, names.contains("Cargo.toml"), "cargo");
    push_if(&mut values, names.contains("pyproject.toml"), "python");
    push_if(&mut values, names.contains("go.mod"), "go");
    values
}

fn detect_test_commands(names: &BTreeSet<String>) -> Vec<String> {
    let mut values = Vec::new();
    push_if(&mut values, names.contains("pnpm-lock.yaml"), "pnpm test");
    push_if(&mut values, names.contains("package-lock.json"), "npm test");
    push_if(&mut values, names.contains("Cargo.toml"), "cargo test");
    push_if(
        &mut values,
        names.contains("pyproject.toml") || names.contains("pytest.ini"),
        "pytest",
    );
    push_if(&mut values, names.contains("go.mod"), "go test ./...");
    values
}

fn ignored_entries(names: &BTreeSet<String>) -> Vec<String> {
    ignored_names()
        .iter()
        .filter(|name| names.contains(**name))
        .map(|name| (*name).to_string())
        .collect()
}

fn ignored_names() -> &'static [&'static str] {
    &[
        ".git",
        ".ssh",
        ".aws",
        ".azure",
        ".gcloud",
        "node_modules",
        "target",
        "dist",
        "build",
        ".cache",
    ]
}

fn detect_git_state(root: &Path) -> GitState {
    if !root.join(".git").exists() {
        return GitState::NotRepository;
    }

    match Command::new("git")
        .arg("-C")
        .arg(root)
        .arg("status")
        .arg("--porcelain")
        .output()
    {
        Ok(output) if output.status.success() && output.stdout.is_empty() => GitState::Clean,
        Ok(output) if output.status.success() => GitState::Dirty,
        _ => GitState::Unknown,
    }
}

fn push_if(values: &mut Vec<String>, condition: bool, value: &str) {
    if condition {
        values.push(value.to_string());
    }
}

#[cfg(test)]
mod tests {
    use super::{scan_workspace, GitState};

    #[test]
    fn detects_markers_and_ignored_entries() {
        let root = temp_root("markers");
        let _ = std::fs::remove_dir_all(&root);
        std::fs::create_dir_all(root.join("node_modules")).expect("ignored folder");
        std::fs::write(root.join("Cargo.toml"), "[package]\nname='demo'").expect("cargo marker");
        std::fs::write(root.join("pnpm-lock.yaml"), "").expect("pnpm marker");
        std::fs::write(root.join(".env"), "SECRET=1").expect("secret marker");

        let summary = scan_workspace(&root).expect("scan works");

        assert!(summary.languages.contains(&String::from("Rust")));
        assert!(summary.package_managers.contains(&String::from("pnpm")));
        assert!(summary.test_commands.contains(&String::from("cargo test")));
        assert!(summary
            .ignored_entries
            .contains(&String::from("node_modules")));
        assert_eq!(summary.git_state, GitState::NotRepository);

        std::fs::remove_dir_all(root).expect("fixture cleanup");
    }

    fn temp_root(name: &str) -> std::path::PathBuf {
        std::env::temp_dir().join(format!("qunta-scan-{name}-{}", std::process::id()))
    }
}
