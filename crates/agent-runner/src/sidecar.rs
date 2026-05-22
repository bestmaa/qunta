use std::{
    path::{Path, PathBuf},
    process::Command,
};

use desktop_core::{DesktopError, DesktopResult};

pub const CODEX_REQUIRED_VERSION: &str = "0.1.0";
pub const QUNTA_CODEX_BINARY_ENV: &str = "QUNTA_CODEX_BINARY";

#[derive(Debug, Clone, Eq, PartialEq)]
pub enum SidecarSource {
    DevOverride,
    Bundled,
}

#[derive(Debug, Clone, Eq, PartialEq)]
pub struct SidecarConfig {
    pub required_version: String,
    pub dev_override: Option<PathBuf>,
    pub bundled_candidate: PathBuf,
}

impl SidecarConfig {
    pub fn new(bundled_candidate: impl Into<PathBuf>) -> Self {
        Self {
            required_version: String::from(CODEX_REQUIRED_VERSION),
            dev_override: std::env::var_os(QUNTA_CODEX_BINARY_ENV).map(PathBuf::from),
            bundled_candidate: bundled_candidate.into(),
        }
    }
}

#[derive(Debug, Clone, Eq, PartialEq)]
pub struct SidecarLocation {
    pub source: SidecarSource,
    pub path: PathBuf,
}

#[derive(Debug, Clone, Eq, PartialEq)]
pub struct SidecarDiagnostics {
    pub ready: bool,
    pub message: String,
    pub required_version: String,
    pub detected_version: Option<String>,
    pub location: Option<SidecarLocation>,
}

pub fn default_bundled_candidate() -> PathBuf {
    let binary = if cfg!(windows) { "codex.exe" } else { "codex" };
    std::env::current_exe()
        .ok()
        .and_then(|path| path.parent().map(Path::to_path_buf))
        .unwrap_or_else(|| PathBuf::from("."))
        .join("sidecars")
        .join(binary)
}

pub fn locate_sidecar(config: &SidecarConfig) -> DesktopResult<SidecarLocation> {
    if let Some(path) = &config.dev_override {
        return existing_location(path, SidecarSource::DevOverride);
    }

    existing_location(&config.bundled_candidate, SidecarSource::Bundled)
}

pub fn diagnose_sidecar<F>(config: &SidecarConfig, read_version: F) -> SidecarDiagnostics
where
    F: FnOnce(&Path) -> DesktopResult<String>,
{
    let location = match locate_sidecar(config) {
        Ok(location) => location,
        Err(error) => {
            return SidecarDiagnostics {
                ready: false,
                message: error.to_string(),
                required_version: config.required_version.clone(),
                detected_version: None,
                location: None,
            };
        }
    };

    let output = match read_version(&location.path) {
        Ok(output) => output,
        Err(error) => {
            return SidecarDiagnostics {
                ready: false,
                message: format!("Codex version check failed: {error}"),
                required_version: config.required_version.clone(),
                detected_version: None,
                location: Some(location),
            };
        }
    };
    let detected = parse_codex_version(&output);

    SidecarDiagnostics {
        ready: detected == Some(config.required_version.as_str()),
        message: version_message(&config.required_version, detected),
        required_version: config.required_version.clone(),
        detected_version: detected.map(String::from),
        location: Some(location),
    }
}

pub fn read_codex_version(path: &Path) -> DesktopResult<String> {
    let output = Command::new(path)
        .arg("--version")
        .output()
        .map_err(|error| DesktopError::process_failed(error.to_string()))?;

    if !output.status.success() {
        return Err(DesktopError::process_failed(format!(
            "Codex exited with status {:?}",
            output.status.code()
        )));
    }

    Ok(String::from_utf8_lossy(&output.stdout).to_string())
}

pub fn parse_codex_version(output: &str) -> Option<&str> {
    output.split_whitespace().find(|part| {
        part.chars()
            .next()
            .is_some_and(|value| value.is_ascii_digit())
    })
}

fn existing_location(path: &Path, source: SidecarSource) -> DesktopResult<SidecarLocation> {
    if path.is_file() {
        return Ok(SidecarLocation {
            source,
            path: path.to_path_buf(),
        });
    }

    Err(DesktopError::invalid_config(format!(
        "Codex sidecar not found at {}",
        path.display()
    )))
}

fn version_message(required: &str, detected: Option<&str>) -> String {
    match detected {
        Some(version) if version == required => format!("Codex {version} is ready"),
        Some(version) => format!("Codex version mismatch: required {required}, found {version}"),
        None => format!("Codex version mismatch: required {required}, found unknown"),
    }
}

#[cfg(test)]
mod tests {
    use super::{
        diagnose_sidecar, parse_codex_version, SidecarConfig, SidecarSource, CODEX_REQUIRED_VERSION,
    };

    #[test]
    fn parses_cli_version_output() {
        assert_eq!(parse_codex_version("codex 0.1.0"), Some("0.1.0"));
    }

    #[test]
    fn reports_version_mismatch() {
        let file = tempfile_path("codex-mismatch");
        std::fs::write(&file, "mock").expect("mock sidecar exists");
        let config = SidecarConfig {
            required_version: String::from(CODEX_REQUIRED_VERSION),
            dev_override: Some(file.clone()),
            bundled_candidate: file,
        };
        let diagnostics = diagnose_sidecar(&config, |_| Ok(String::from("codex 9.9.9")));

        assert!(!diagnostics.ready);
        assert!(diagnostics.message.contains("required 0.1.0"));
        assert_eq!(
            diagnostics.location.map(|value| value.source),
            Some(SidecarSource::DevOverride)
        );
    }

    fn tempfile_path(name: &str) -> std::path::PathBuf {
        std::env::temp_dir().join(format!("qunta-{name}-{}", std::process::id()))
    }
}
