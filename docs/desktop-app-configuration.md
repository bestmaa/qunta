# Desktop App Configuration

## Purpose

Qunta uses Tauri v2 as the desktop shell. The configuration must stay small, explicit, and permission-scoped so later agent features cannot accidentally gain broad local access.

## App Identity

- Product name: `Qunta`
- Tauri identifier: `com.bestmaa.qunta`
- Rust package: `qunta-desktop`
- Main window label: `main`
- Initial window size: `1240x820`
- Minimum window size: `960x640`

## Build Flow

The Tauri shell reads the React UI from `apps/desktop-ui`.

```text
Dev UI: http://localhost:1420
Build UI: apps/desktop-ui/dist
Before dev: corepack pnpm --dir ../desktop-ui dev
Before build: corepack pnpm --dir ../desktop-ui build
```

## Permissions

The default capability includes only `core:default`. Shell, filesystem, dialog, updater, notification, and process permissions must be added by future tasks only when the task implements the matching guarded feature.

Strict rule: no shell command permissions are enabled in this scaffold.

## Icons

`apps/desktop/src-tauri/icons/icon.ico` is a placeholder icon for Windows resource generation. A production icon set will be added in the packaging phase.

## Verification

Run:

```bash
corepack pnpm lint
corepack pnpm typecheck
corepack pnpm test
corepack pnpm --filter @qunta/desktop-ui build
cargo fmt --check
cargo clippy --all-targets --all-features -- -D warnings
cargo test
```

On this Windows/WSL workspace, Rust verification uses Windows Cargo with `CARGO_TARGET_DIR` set to a local temp directory because UNC target locks can fail.
