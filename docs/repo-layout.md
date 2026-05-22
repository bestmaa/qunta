# Repository Layout

## Purpose

This repository is a monorepo for the desktop app, Rust native crates, cloud services, shared packages, tests, and documentation. The layout keeps product areas separated so agent tasks can modify small, obvious modules without creating a monolith.

## Root Layout

```text
.
├── apps/
│   ├── desktop/
│   └── desktop-ui/
├── crates/
│   ├── agent-runner/
│   ├── desktop-core/
│   └── sandbox/
├── docs/
├── packages/
│   ├── shared-types/
│   └── ui/
├── services/
│   ├── api/
│   └── llm-gateway/
├── tests/
│   ├── e2e/
│   └── fixtures/
├── tools/
└── task.md
```

## Apps

### `apps/desktop`

Owns the Tauri app shell, app config, capabilities, icons, build metadata, and native entrypoint. It may depend on Rust crates and the built desktop UI assets.

### `apps/desktop-ui`

Owns the React + TypeScript + Vite UI. It may depend on `packages/ui` and `packages/shared-types`. It must not own provider routing, billing decisions, raw shell execution, or direct filesystem mutation.

## Rust Crates

### `crates/desktop-core`

Owns Tauri commands, local app state, diagnostics, path validation, settings, and local database access.

### `crates/agent-runner`

Owns Codex sidecar discovery, session config generation, process lifecycle, event parsing, cancellation, and runner diagnostics.

### `crates/sandbox`

Owns workspace boundary checks, deny-read patterns, command policy, patch validation, and patch application.

## Cloud Services

### `services/api`

Owns account auth, plans, billing state, usage summaries, update metadata, and desktop API contracts.

### `services/llm-gateway`

Owns gateway authentication, provider-hidden model routing, provider adapters, streaming normalization, retry logic, and server-side usage metering.

## Shared Packages

### `packages/shared-types`

Owns TypeScript contracts shared by UI and services: auth, sessions, projects, billing, usage, events, and typed errors. Files use `*.type.ts` for pure types.

### `packages/ui`

Owns reusable UI primitives such as buttons, panels, badges, layout, menus, dialogs, tabs, and theme tokens. It must not import Tauri APIs, cloud clients, or service code.

## Tests

### `tests/fixtures`

Contains small sample projects for workspace scanner, patch apply, git status, and command approval tests.

### `tests/e2e`

Contains end-to-end smoke flows for login, project selection, agent event streaming, approvals, patch preview, and verification commands.

## Tools

`tools` contains local scripts for validation, fixture setup, release checks, and developer diagnostics. Scripts must be deterministic and documented.

## Generated Files

- Desktop build output stays under each app's configured build directory.
- Rust target output stays in `target/`.
- Test fixtures may create temporary folders under OS temp directories only.
- Local user workspaces must never be generated inside this repository.
- Provider secrets must never be generated into source folders.

## Naming Rules

- TypeScript type-only files: `*.type.ts`.
- React components: `PascalCase.tsx`.
- React hooks: `use-name.ts`.
- Service modules: lowercase kebab directories with small files.
- Rust modules: lowercase snake case.
- Docs: lowercase kebab markdown files.

## Ownership Boundaries

- UI packages cannot import cloud service internals.
- Cloud services cannot import Tauri or Rust desktop crates.
- Provider adapters cannot import billing UI code.
- Rust crates cannot depend on React UI packages.
- Shared types cannot contain runtime side effects.

## Secret Placement Rules

- Provider keys are stored only in server secret stores or server environment variables.
- Desktop auth tokens use OS-secure storage when implemented.
- `.env` examples may include placeholder names only.
- Real keys, tokens, and user project files must not be committed.
