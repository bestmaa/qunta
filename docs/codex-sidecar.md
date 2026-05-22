# Codex Sidecar Strategy

Qunta treats Codex as a local runtime sidecar. The desktop app owns discovery,
version validation, diagnostics, and cancellation. The cloud LLM gateway still
owns provider selection and provider keys.

## Discovery Order

1. Development override from `QUNTA_CODEX_BINARY`.
2. Bundled binary next to the app at `sidecars/codex` or `sidecars/codex.exe`.

The override is for local development and CI smoke tests. Release builds should
ship the bundled binary beside the Tauri executable.

## Required Version

The runner currently requires Codex `0.1.0`. A mismatch is treated as not ready
and must show a helpful diagnostic:

```text
Codex version mismatch: required 0.1.0, found <detected>
```

This strict check avoids sending paid user sessions into an unknown runtime.

## Desktop Diagnostics

The desktop command `desktop_codex_sidecar_diagnostics` returns:

- readiness
- helpful message
- required and detected version
- resolved path
- source (`devOverride` or `bundled`)

The general desktop diagnostics payload includes the same Codex sidecar status.

## Packaging Notes

The repo does not commit a Codex binary. Release automation should download or
build the approved Codex CLI artifact, place it in the Tauri sidecar directory,
verify its checksum, and then run the app build smoke.
