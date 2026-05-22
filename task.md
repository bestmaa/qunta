# Qunta Task Queue - Tauri + Codex Backend Product

This task queue is for building Qunta, a sellable desktop coding-agent product. The app will use a custom desktop UI, a Rust native core, Codex as the local agent runtime, and a private server-side LLM gateway that can route to DeepSeek, OpenAI, or any other provider without exposing provider details to users.

Iska goal ye hai ki user ko ek clean desktop coding agent mile. User sirf app use karega; provider ka naam, API key, model routing, billing logic, fallback logic sab hamare backend/server ke through hidden rahega.

## Queue Rules

- Pick only the first task with `Status: pending`.
- Before coding, mark that task `Status: in_progress`.
- After coding, run the task verification plus standard verification.
- Mark the task `completed` only after tests/docs pass.
- Commit with the exact task commit message.
- Do not implement behavior from future tasks.
- Do not keep the product monolithic; keep desktop UI, Rust core, agent runner, cloud API, LLM gateway, billing, and provider adapters separate.
- Keep one desktop shell and one cloud API; do not create duplicate servers for the same responsibility.
- No source code file may exceed 250 lines. Split into modules before crossing the limit.
- Keep strict TypeScript and put shared frontend/backend types in `*.type.ts`.
- Keep Rust strongly typed with small modules, explicit errors, and no stringly typed provider logic.
- Verify every code task immediately after implementation.
- Do not expose raw provider keys, raw user tokens, or internal model/provider names to desktop users.
- Codex-facing prompts, rules, and config must be deterministic and short enough for agent execution.
- Sandbox/workspace code must be isolated per project and per task.
- Approval flows must be explicit before destructive file edits, shell commands, git operations, dependency installs, or network access.
- Billing, usage, and cost tracking must be implemented server-side, not trusted from the desktop app.

## Standard Verification

```bash
pnpm lint
pnpm typecheck
pnpm test
cargo fmt --check
cargo clippy --all-targets --all-features -- -D warnings
cargo test
git diff --check
```

## GPT-5.5 Low-Token Prompt

```text
Qunta task runner.
Read AGENTS.md, PROJECT_CONTEXT.md, and task.md. Pick first `Status: pending` only.
Goal: build Qunta, a sellable Tauri desktop coding-agent app using a Rust core, React UI, Codex local runtime, and private LLM gateway.
Keep modules separate, strict TS/Rust, files <=250 lines, no provider secrets in desktop, verify after every code task.
Run pnpm lint, pnpm typecheck, pnpm test, cargo fmt --check, cargo clippy --all-targets --all-features -- -D warnings, cargo test, git diff --check.
```

## Product Contract

Target user flow:

1. User installs the desktop app.
2. User signs in to the product account.
3. User selects or creates a local project workspace.
4. User asks the agent to inspect, explain, modify, test, or build code.
5. App starts an isolated local agent session.
6. Codex runs locally as a controlled sidecar/worker.
7. LLM requests go through the private LLM gateway.
8. Gateway routes to DeepSeek, OpenAI, or another provider based on server policy.
9. UI streams reasoning summary, command logs, file changes, and diffs.
10. User approves sensitive actions before they run.
11. App applies accepted patches and stores audit history.
12. User never sees provider keys or internal provider routing.

Target user flow Hinglish:

1. User desktop app install karta hai.
2. User product account se login karta hai.
3. User local project folder select karta hai.
4. User agent ko task deta hai: code samjho, bug fix karo, feature banao, test chalao.
5. App isolated local agent session start karta hai.
6. Codex controlled sidecar/worker ke through local project par kaam karta hai.
7. LLM request hamare private LLM gateway se jati hai.
8. Gateway andar se DeepSeek/OpenAI/other provider choose karta hai.
9. UI me logs, diff, files, aur approvals stream hote hain.
10. Sensitive action ke liye user approval required hota hai.
11. Accepted patches apply hote hain aur audit history save hoti hai.
12. User ko provider key ya provider name nahi dikhta.

## Architecture Contract

```text
apps/desktop              Tauri desktop app
apps/desktop-ui           React + TypeScript UI
crates/desktop-core       Rust commands, process control, local state
crates/agent-runner       Codex sidecar/session runner
crates/sandbox            workspace isolation and permissions
services/api              cloud API, auth, billing, job metadata
services/llm-gateway      provider routing and OpenAI-compatible gateway
packages/shared-types     shared TypeScript contracts
packages/ui               reusable UI components
docs                      architecture, security, setup, release notes
```

## Queue

### Phase 1: Product Foundation

#### T0101 - Define Product Requirements

- Version: `v0.1.0`
- Status: `completed`
- Goal: Define the exact MVP scope for the desktop coding-agent product.
- Persona: Product architect; keep the first release sellable but focused.
- Success Criteria: Docs define supported OS, user flow, local workspace flow, cloud dependency, provider hiding, approval modes, and non-goals.
- Constraints: Planning/docs only.
- Output: `docs/product-requirements.md`.
- Strict Rule: Do not promise cloud autonomous repo agents in MVP.
- Verify: Documentation review and standard verification if project exists.
- Commit: `Define product requirements`

#### T0102 - Define Modular Architecture

- Version: `v0.1.1`
- Status: `completed`
- Goal: Define the separated desktop, core, runner, gateway, API, billing, and UI modules.
- Persona: System architect; avoid a monolithic app.
- Success Criteria: Architecture doc includes module responsibilities, data flow, IPC boundaries, trust boundaries, and deployment shape.
- Constraints: Planning/docs only.
- Output: `docs/architecture.md`.
- Strict Rule: No module may own both UI rendering and provider billing logic.
- Verify: Documentation review.
- Commit: `Define modular architecture`

#### T0103 - Define Repository Layout

- Version: `v0.1.2`
- Status: `completed`
- Goal: Define the monorepo layout for desktop, Rust crates, services, packages, and docs.
- Persona: Repo maintainer; make future tasks predictable.
- Success Criteria: Docs define folder layout, package names, build ownership, and generated file locations.
- Constraints: Planning/docs only.
- Output: `docs/repo-layout.md`.
- Strict Rule: Do not place cloud provider keys or user workspaces inside source folders.
- Verify: Documentation review.
- Commit: `Define repo layout`

#### T0104 - Define Coding Standards

- Version: `v0.1.3`
- Status: `completed`
- Goal: Define strict TypeScript, Rust, test, formatting, and 250-line file rules.
- Persona: Engineering lead; keep the codebase maintainable for agent work.
- Success Criteria: Standards mention file size, naming, errors, shared types, tests, comments, and verification.
- Constraints: Planning/docs only.
- Output: `docs/coding-standards.md`.
- Strict Rule: Every implementation task must verify before completion.
- Verify: Documentation review.
- Commit: `Define coding standards`

#### T0105 - Define Threat Model

- Version: `v0.1.4`
- Status: `completed`
- Goal: Define security risks for local code access, shell commands, secrets, provider routing, billing, and updates.
- Persona: Security architect; assume coding agents can be prompted into risky actions.
- Success Criteria: Threat model covers local workspace isolation, command approvals, token storage, provider key handling, prompt injection, update integrity, and audit logs.
- Constraints: Planning/docs only.
- Output: `docs/security-threat-model.md`.
- Strict Rule: Provider API keys must only live in server-side infrastructure.
- Verify: Documentation review.
- Commit: `Define desktop agent threat model`

### Phase 2: Monorepo And Tooling Scaffold

#### T0201 - Scaffold Monorepo Tooling

- Version: `v0.2.0`
- Status: `completed`
- Goal: Create the initial monorepo tooling for TypeScript, Rust, and docs.
- Persona: Platform engineer; make all future tasks easy to verify.
- Success Criteria: Package manager config, lint/typecheck/test scripts, Rust workspace, formatting config, and README exist.
- Constraints: No product features yet.
- Output: Root configs, workspace files, README.
- Strict Rule: Keep generated configs minimal and documented.
- Verify: Standard verification or documented skipped commands if no code exists yet.
- Commit: `Scaffold monorepo tooling`

#### T0202 - Add Shared Type Package

- Version: `v0.2.1`
- Status: `completed`
- Goal: Add `packages/shared-types` for cross-app TypeScript contracts.
- Persona: Type system engineer; prevent duplicated request/response shapes.
- Success Criteria: Package exports typed auth, project, session, provider-agnostic model, and error contracts.
- Constraints: Types only.
- Output: `packages/shared-types`.
- Strict Rule: No type file over 250 lines.
- Verify: Typecheck and unit tests if applicable.
- Commit: `Add shared type package`

#### T0203 - Add UI Package

- Version: `v0.2.2`
- Status: `completed`
- Goal: Add reusable UI package for buttons, panels, status badges, layout primitives, and theme tokens.
- Persona: Design system engineer; keep desktop UI consistent.
- Success Criteria: UI package has typed exports, basic tests, and no app-specific business logic.
- Constraints: UI primitives only.
- Output: `packages/ui`.
- Strict Rule: UI package must not call cloud API or Tauri APIs directly.
- Verify: Lint, typecheck, tests.
- Commit: `Add desktop UI package`

#### T0204 - Add Rust Workspace Crates

- Version: `v0.2.3`
- Status: `completed`
- Goal: Create Rust crates for desktop core, agent runner, sandbox, and shared errors.
- Persona: Rust platform engineer; prepare native boundaries.
- Success Criteria: Crates compile, expose minimal typed modules, and share a typed error model.
- Constraints: No Codex execution yet.
- Output: `crates/desktop-core`, `crates/agent-runner`, `crates/sandbox`.
- Strict Rule: Keep each Rust file under 250 lines.
- Verify: Cargo fmt, clippy, tests.
- Commit: `Add Rust workspace crates`

### Phase 3: Tauri Desktop Shell

#### T0301 - Scaffold Tauri Desktop App

- Version: `v0.3.0`
- Status: `completed`
- Goal: Create the Tauri v2 desktop app with React + TypeScript + Vite.
- Persona: Desktop app engineer; establish the native shell.
- Success Criteria: App starts locally, shows the first desktop shell screen, and connects to Rust commands.
- Constraints: No real agent execution.
- Output: `apps/desktop`, `apps/desktop-ui`.
- Strict Rule: Do not hardcode cloud API secrets in desktop code.
- Verify: Tauri dev build, lint, typecheck, cargo checks.
- Commit: `Scaffold Tauri desktop app`

#### T0302 - Add Desktop App Configuration

- Version: `v0.3.1`
- Status: `completed`
- Goal: Configure app identifier, windows, permissions, icons placeholder, and build metadata.
- Persona: Release engineer; make packaging predictable.
- Success Criteria: Tauri config is minimal, permission-scoped, and documented.
- Constraints: No production signing yet.
- Output: Tauri config, capabilities, docs.
- Strict Rule: Shell command permissions must be deny-by-default.
- Verify: Tauri config validation and standard verification.
- Commit: `Configure desktop app shell`

#### T0303 - Add Rust IPC Commands

- Version: `v0.3.2`
- Status: `completed`
- Goal: Add typed Tauri commands for app info, health, local paths, and diagnostics.
- Persona: Native bridge engineer; make UI-to-Rust communication safe.
- Success Criteria: UI can invoke typed commands and render returned diagnostics.
- Constraints: No workspace mutation.
- Output: Tauri commands and TypeScript command wrappers.
- Strict Rule: IPC responses must use typed objects, not raw strings.
- Verify: Rust tests, TS typecheck, UI smoke.
- Commit: `Add typed desktop IPC commands`

#### T0304 - Add Local SQLite State

- Version: `v0.3.3`
- Status: `completed`
- Goal: Add local state storage for settings, recent projects, sessions, and audit cache.
- Persona: Local data engineer; keep app useful offline without storing provider secrets.
- Success Criteria: SQLite migrations, repository layer, typed state models, and tests exist.
- Constraints: No secrets storage except encrypted auth/session tokens later.
- Output: Local DB module.
- Strict Rule: Do not store raw provider API keys locally.
- Verify: Migration tests and cargo tests.
- Commit: `Add local desktop state store`

### Phase 4: Auth And Cloud API

#### T0401 - Define Cloud API Contract

- Version: `v0.4.0`
- Status: `completed`
- Goal: Define cloud API endpoints for auth, device sessions, usage, billing, gateway access, and app updates.
- Persona: API architect; keep desktop and cloud contracts stable.
- Success Criteria: OpenAPI or typed route spec covers MVP endpoints and error responses.
- Constraints: Contract/docs/types only.
- Output: `docs/cloud-api-contract.md`, shared route types.
- Strict Rule: Do not expose provider routing details in public response contracts.
- Verify: Typecheck and docs review.
- Commit: `Define cloud API contract`

#### T0402 - Scaffold Cloud API Service

- Version: `v0.4.1`
- Status: `completed`
- Goal: Create the cloud API service with strict TypeScript, health checks, config validation, and logging.
- Persona: Backend platform engineer; make a deployable API foundation.
- Success Criteria: Service starts, validates env, exposes health, and has test setup.
- Constraints: No real billing or provider routing yet.
- Output: `services/api`.
- Strict Rule: Environment validation must fail closed.
- Verify: Lint, typecheck, tests.
- Commit: `Scaffold cloud API service`

#### T0403 - Add Auth Session Flow

- Version: `v0.4.2`
- Status: `completed`
- Goal: Implement desktop-friendly login/session flow.
- Persona: Auth engineer; make sign-in safe for desktop users.
- Success Criteria: API supports session create/refresh/revoke and desktop stores token securely.
- Constraints: Use provider-neutral auth contracts.
- Output: Auth routes, desktop auth client, tests.
- Strict Rule: Never log raw tokens.
- Verify: Auth tests, desktop integration smoke.
- Commit: `Add desktop auth session flow`

#### T0404 - Add Account And Plan Model

- Version: `v0.4.3`
- Status: `completed`
- Goal: Add account, subscription plan, feature flag, and usage limit models.
- Persona: SaaS backend engineer; prepare product monetization.
- Success Criteria: User plan can limit sessions, monthly usage, and premium features.
- Constraints: Billing provider integration later.
- Output: Models, migrations, repositories, tests.
- Strict Rule: Desktop must not decide paid access by itself.
- Verify: Backend tests and typecheck.
- Commit: `Add account plan model`

### Phase 5: Private LLM Gateway

#### T0501 - Define LLM Gateway Contract

- Version: `v0.5.0`
- Status: `completed`
- Goal: Define a provider-hidden gateway contract compatible with Codex needs.
- Persona: AI platform architect; hide provider complexity behind one contract.
- Success Criteria: Contract defines auth, request, streaming, tool-call passthrough, errors, retries, usage, and audit IDs.
- Constraints: Contract/docs/types only.
- Output: `docs/llm-gateway-contract.md`, shared types.
- Strict Rule: Public contracts must not expose internal provider names.
- Verify: Typecheck and docs review.
- Commit: `Define LLM gateway contract`

#### T0502 - Scaffold LLM Gateway Service

- Version: `v0.5.1`
- Status: `completed`
- Goal: Create `services/llm-gateway` with config validation, auth middleware, streaming foundation, and tests.
- Persona: AI backend engineer; create a reliable routing service.
- Success Criteria: Gateway starts, accepts authenticated requests, returns mocked streaming responses, and records usage metadata.
- Constraints: No real provider calls yet.
- Output: Gateway service and tests.
- Strict Rule: Reject unauthenticated requests by default.
- Verify: Lint, typecheck, tests.
- Commit: `Scaffold LLM gateway service`

#### T0503 - Add Provider Adapter Interface

- Version: `v0.5.2`
- Status: `completed`
- Goal: Add a strict interface for OpenAI-compatible and custom provider adapters.
- Persona: Provider integration engineer; make provider swaps safe.
- Success Criteria: Interface covers request transform, streaming parse, usage mapping, error mapping, and capability metadata.
- Constraints: Interface and mock adapter only.
- Output: Provider adapter modules.
- Strict Rule: Adapter output must normalize usage and errors.
- Verify: Unit tests.
- Commit: `Add provider adapter interface`

#### T0504 - Add OpenAI Provider Adapter

- Version: `v0.5.3`
- Status: `completed`
- Goal: Add server-side OpenAI adapter for the LLM gateway.
- Persona: Provider engineer; keep OpenAI details isolated.
- Success Criteria: Adapter streams responses, maps errors, records usage, and reads keys only from server env/secret store.
- Constraints: No desktop exposure.
- Output: OpenAI adapter and tests with mocked HTTP.
- Strict Rule: Never return raw OpenAI keys, org IDs, or internal headers to clients.
- Verify: Provider adapter tests.
- Commit: `Add OpenAI gateway adapter`

#### T0505 - Add DeepSeek Provider Adapter

- Version: `v0.5.4`
- Status: `completed`
- Goal: Add server-side DeepSeek adapter for the LLM gateway.
- Persona: Provider engineer; make low-cost routing possible.
- Success Criteria: Adapter streams responses, maps errors, records usage, and follows provider-specific rate limit handling.
- Constraints: No desktop exposure.
- Output: DeepSeek adapter and tests with mocked HTTP.
- Strict Rule: Provider name may appear in server logs but not in desktop user response unless explicitly configured for internal debug.
- Verify: Provider adapter tests.
- Commit: `Add DeepSeek gateway adapter`

#### T0506 - Add Routing Policy Engine

- Version: `v0.5.5`
- Status: `completed`
- Goal: Add server-side policy for model/provider selection, fallback, limits, and cost controls.
- Persona: AI cost engineer; route tasks without exposing choices to users.
- Success Criteria: Policy can route by plan, task type, latency, failure, and budget.
- Constraints: Must be server-side only.
- Output: Routing policy module and tests.
- Strict Rule: Desktop sends capability intent, not provider choice.
- Verify: Policy tests.
- Commit: `Add LLM routing policy`

### Phase 6: Codex Runtime Integration

#### T0601 - Define Codex Runtime Contract

- Version: `v0.6.0`
- Status: `completed`
- Goal: Define how the desktop app launches, configures, streams, and stops Codex sessions.
- Persona: Agent runtime architect; make Codex controllable and observable.
- Success Criteria: Contract defines session inputs, workspace path, gateway endpoint, approval mode, events, cancellation, and output artifacts.
- Constraints: Contract/docs/types only.
- Output: `docs/codex-runtime-contract.md`.
- Strict Rule: Codex config must point to the private gateway, not direct user provider keys.
- Verify: Docs review.
- Commit: `Define Codex runtime contract`

#### T0602 - Add Agent Runner Process Model

- Version: `v0.6.1`
- Status: `completed`
- Goal: Implement the Rust process model for starting and stopping a controlled agent runner.
- Persona: Systems engineer; avoid orphan processes and hidden commands.
- Success Criteria: Runner can spawn a mock agent, stream stdout/stderr/events, cancel safely, and return exit status.
- Constraints: Mock process only.
- Output: `crates/agent-runner` process module.
- Strict Rule: Always clean up child processes on cancellation.
- Verify: Cargo tests.
- Commit: `Add agent runner process model`

#### T0603 - Bundle Codex Sidecar

- Version: `v0.6.2`
- Status: `completed`
- Goal: Add sidecar strategy for bundling or locating the Codex CLI binary.
- Persona: Desktop distribution engineer; make agent runtime installable.
- Success Criteria: App can locate bundled/dev Codex binary, validate version, and report diagnostics.
- Constraints: No live task execution yet.
- Output: Sidecar config, version check, docs.
- Strict Rule: Version mismatch must fail with a helpful message.
- Verify: Tauri build smoke and Rust tests.
- Commit: `Add Codex sidecar discovery`

#### T0604 - Add Codex Config Generation

- Version: `v0.6.3`
- Status: `pending`
- Goal: Generate per-session Codex config that routes LLM calls through the private gateway.
- Persona: Agent configuration engineer; isolate sessions and secrets.
- Success Criteria: Config includes gateway base URL, temporary session token, model intent, sandbox mode, and approval mode.
- Constraints: Do not persist raw gateway session token beyond session lifecycle.
- Output: Config generator and tests.
- Strict Rule: Config must be per-session and cleaned after session end.
- Verify: Rust tests and config snapshot tests.
- Commit: `Generate Codex session config`

#### T0605 - Run First Local Codex Session

- Version: `v0.6.4`
- Status: `pending`
- Goal: Execute a controlled Codex session against a test workspace and mocked gateway.
- Persona: Agent integration engineer; prove the full local loop.
- Success Criteria: Session starts, streams events, writes a harmless file change, and exits cleanly.
- Constraints: Use a temporary test workspace.
- Output: Integration test and runner wiring.
- Strict Rule: Test must not touch real user folders.
- Verify: Integration test and standard verification.
- Commit: `Run controlled Codex session`

### Phase 7: Workspace And Sandbox

#### T0701 - Define Workspace Safety Rules

- Version: `v0.7.0`
- Status: `pending`
- Goal: Define local workspace permissions, allowed paths, denied paths, and git safety.
- Persona: Security engineer; protect user machine and secrets.
- Success Criteria: Rules cover project root, ignored files, env files, SSH keys, cloud credentials, destructive commands, and git operations.
- Constraints: Docs/contracts only.
- Output: `docs/workspace-safety.md`.
- Strict Rule: Sensitive files must be deny-read by default unless user explicitly approves.
- Verify: Docs review.
- Commit: `Define workspace safety rules`

#### T0702 - Add Project Picker

- Version: `v0.7.1`
- Status: `pending`
- Goal: Let users select and remember local project folders.
- Persona: Desktop UX engineer; make workspace selection simple.
- Success Criteria: UI opens folder picker, validates project path, stores recent projects, and shows project metadata.
- Constraints: No agent execution.
- Output: Project picker UI and Rust path validation.
- Strict Rule: Do not scan parent directories outside selected project.
- Verify: UI tests, Rust tests, manual smoke.
- Commit: `Add project picker`

#### T0703 - Add Workspace Scanner

- Version: `v0.7.2`
- Status: `pending`
- Goal: Scan selected project for language, package manager, git status, and test commands.
- Persona: Developer experience engineer; help the agent start with context.
- Success Criteria: Scanner returns typed project summary and ignores sensitive/large folders.
- Constraints: Read-only scanning.
- Output: Rust scanner and UI summary.
- Strict Rule: Scanner must respect deny patterns.
- Verify: Scanner tests with fixture projects.
- Commit: `Add workspace scanner`

#### T0704 - Add Permission Profile Engine

- Version: `v0.7.3`
- Status: `pending`
- Goal: Add permission profiles for suggest, auto-edit, and full-auto-like controlled modes.
- Persona: Safety engineer; make automation levels explicit.
- Success Criteria: Profiles define read, write, shell, network, install, git, and approval requirements.
- Constraints: Policy engine only.
- Output: Permission profile module and tests.
- Strict Rule: High-risk actions always require visible approval in MVP.
- Verify: Policy tests.
- Commit: `Add permission profiles`

#### T0705 - Add Command Approval System

- Version: `v0.7.4`
- Status: `pending`
- Goal: Intercept requested shell commands and ask for user approval when required.
- Persona: Agent safety engineer; prevent surprise command execution.
- Success Criteria: UI shows command, cwd, risk label, reason, approve/reject controls, and audit entry.
- Constraints: Must integrate with runner events.
- Output: Approval queue and UI.
- Strict Rule: Rejected commands must not run.
- Verify: Approval tests and manual smoke.
- Commit: `Add command approval system`

### Phase 8: Desktop UI Experience

#### T0801 - Define Desktop UI Information Architecture

- Version: `v0.8.0`
- Status: `pending`
- Goal: Define the app layout for chat, file tree, diff viewer, terminal logs, approvals, settings, and account.
- Persona: Product designer; make workflows clear and dense enough for coding work.
- Success Criteria: Docs/wireframes define first screen, project screen, session screen, settings, and error states.
- Constraints: Design/docs only.
- Output: `docs/ui-information-architecture.md`.
- Strict Rule: Do not build a marketing landing page as the first screen.
- Verify: Design review.
- Commit: `Define desktop UI architecture`

#### T0802 - Build App Shell Layout

- Version: `v0.8.1`
- Status: `pending`
- Goal: Build the main desktop layout with sidebar, project header, session area, and status bar.
- Persona: Frontend engineer; create the reusable UI frame.
- Success Criteria: Responsive desktop layout works at common window sizes and has empty/loading/error states.
- Constraints: Static data only.
- Output: App shell components.
- Strict Rule: No UI component file over 250 lines.
- Verify: Lint, typecheck, UI tests, screenshot smoke.
- Commit: `Build desktop app shell`

#### T0803 - Build Chat Composer

- Version: `v0.8.2`
- Status: `pending`
- Goal: Add prompt composer with attachments, project context toggle, and send/cancel controls.
- Persona: Frontend UX engineer; make task submission ergonomic.
- Success Criteria: Composer validates input, supports multiline prompts, disabled states, and keyboard shortcuts.
- Constraints: No live agent call yet.
- Output: Chat composer components and tests.
- Strict Rule: Composer must not expose provider/model names in MVP.
- Verify: UI tests and typecheck.
- Commit: `Build chat composer`

#### T0804 - Build Event Stream Timeline

- Version: `v0.8.3`
- Status: `pending`
- Goal: Show agent events such as thinking summary, file read, command request, command output, patch, test result, and completion.
- Persona: Frontend engineer; make agent work observable.
- Success Criteria: Timeline renders typed events, groups noisy logs, and handles streaming updates.
- Constraints: Mock events first.
- Output: Timeline components and tests.
- Strict Rule: Never render raw secrets from event payloads.
- Verify: UI tests and snapshot tests.
- Commit: `Build agent event timeline`

#### T0805 - Add File Tree Viewer

- Version: `v0.8.4`
- Status: `pending`
- Goal: Add project file tree with search, ignored folder handling, and changed-file indicators.
- Persona: Frontend workspace engineer; help users inspect project context.
- Success Criteria: File tree renders scanned workspace summary and changed file states.
- Constraints: Read-only viewer.
- Output: File tree UI and tests.
- Strict Rule: Hidden/denied paths must not appear unless allowed by policy.
- Verify: UI tests.
- Commit: `Add project file tree viewer`

#### T0806 - Add Diff Viewer

- Version: `v0.8.5`
- Status: `pending`
- Goal: Add a diff viewer for proposed file changes.
- Persona: Code review UX engineer; make patch review clear.
- Success Criteria: Viewer supports added/modified/deleted files, inline diff, accept/reject file, and copy path.
- Constraints: No patch apply yet.
- Output: Diff viewer components and tests.
- Strict Rule: Diff viewer must handle large files with truncation.
- Verify: UI tests and manual smoke.
- Commit: `Add patch diff viewer`

#### T0807 - Add Terminal Log Panel

- Version: `v0.8.6`
- Status: `pending`
- Goal: Show command output in a terminal-like panel.
- Persona: Developer tools engineer; make logs readable without freezing UI.
- Success Criteria: Panel supports streaming, ANSI formatting, search, pause, clear, and command grouping.
- Constraints: Mock output first.
- Output: Terminal log panel and tests.
- Strict Rule: Mask known secret patterns before rendering.
- Verify: UI tests.
- Commit: `Add terminal log panel`

### Phase 9: Session Orchestration

#### T0901 - Add Session State Machine

- Version: `v0.9.0`
- Status: `pending`
- Goal: Add a typed session state machine for idle, starting, running, waiting approval, applying patch, completed, failed, and cancelled.
- Persona: State management engineer; prevent UI/runtime drift.
- Success Criteria: State transitions are typed, tested, and used by UI controls.
- Constraints: No live Codex dependency.
- Output: Session state module and tests.
- Strict Rule: Impossible states must be unrepresentable where practical.
- Verify: Unit tests and typecheck.
- Commit: `Add session state machine`

#### T0902 - Connect UI To Local Runner

- Version: `v0.9.1`
- Status: `pending`
- Goal: Connect chat submission to the local agent runner and stream events into UI.
- Persona: Full-stack desktop engineer; complete the local loop.
- Success Criteria: User can send a prompt, runner starts, events stream, and session can cancel.
- Constraints: Use mocked gateway if needed.
- Output: UI-runner integration.
- Strict Rule: Cancel must stop the runner process.
- Verify: Integration smoke and tests.
- Commit: `Connect UI to agent runner`

#### T0903 - Add Patch Apply Flow

- Version: `v0.9.2`
- Status: `pending`
- Goal: Allow users to apply accepted patches to the selected workspace.
- Persona: Source control engineer; make file edits reviewable.
- Success Criteria: Patches apply atomically where possible, conflict clearly, and create audit entries.
- Constraints: No git commit automation yet.
- Output: Patch apply module and UI actions.
- Strict Rule: Never apply patches outside project root.
- Verify: Patch tests with fixture repos.
- Commit: `Add patch apply flow`

#### T0904 - Add Test Command Suggestions

- Version: `v0.9.3`
- Status: `pending`
- Goal: Suggest and run project verification commands after changes.
- Persona: DX engineer; make "verify after code" real in the product.
- Success Criteria: App suggests detected test commands and lets user approve execution.
- Constraints: Command execution must use approval profile.
- Output: Verification command UI and runner integration.
- Strict Rule: Tests must run in selected project cwd only.
- Verify: Command approval tests.
- Commit: `Add verification command flow`

#### T0905 - Add Git Status And Checkpoint View

- Version: `v0.9.4`
- Status: `pending`
- Goal: Show git status before/after sessions and support local checkpoints.
- Persona: Version control engineer; help users recover.
- Success Criteria: UI shows branch, dirty files, changed files, and checkpoint metadata.
- Constraints: No automatic commits in MVP.
- Output: Git status module and UI.
- Strict Rule: Do not run destructive git commands.
- Verify: Git fixture tests.
- Commit: `Add git status checkpoint view`

### Phase 10: Server Usage, Billing, And Limits

#### T1001 - Add Usage Metering

- Version: `v0.10.0`
- Status: `pending`
- Goal: Record token usage, session count, provider cost, latency, and error metadata server-side.
- Persona: Billing infrastructure engineer; make the product sellable.
- Success Criteria: Gateway records normalized usage per account/session without exposing provider details to desktop.
- Constraints: No payment provider yet.
- Output: Usage tables, repository, API, tests.
- Strict Rule: Do not trust usage values from desktop clients.
- Verify: Backend tests.
- Commit: `Add server usage metering`

#### T1002 - Add Rate Limits

- Version: `v0.10.1`
- Status: `pending`
- Goal: Enforce per-account and per-session rate limits.
- Persona: Reliability engineer; protect provider spend.
- Success Criteria: API/gateway enforce limits and return typed retryable errors.
- Constraints: Server-side only.
- Output: Rate limit module and tests.
- Strict Rule: Fail closed if account plan cannot be loaded.
- Verify: Rate limit tests.
- Commit: `Add account rate limits`

#### T1003 - Add Billing Provider Contract

- Version: `v0.10.2`
- Status: `pending`
- Goal: Define payment provider integration for plans, invoices, trials, and cancellations.
- Persona: SaaS product engineer; keep billing provider replaceable.
- Success Criteria: Contract supports free trial, paid plans, usage limits, and account status.
- Constraints: Contract/docs/types only.
- Output: `docs/billing-contract.md`.
- Strict Rule: Desktop must only display billing status returned by server.
- Verify: Docs review.
- Commit: `Define billing provider contract`

#### T1004 - Add Billing Webhooks

- Version: `v0.10.3`
- Status: `pending`
- Goal: Implement billing webhook handling for subscription status changes.
- Persona: Payments engineer; keep entitlements synced.
- Success Criteria: Webhooks verify signature, update account plan, and record audit events.
- Constraints: Mock provider in tests.
- Output: Webhook routes and tests.
- Strict Rule: Invalid signatures must be rejected.
- Verify: Webhook tests.
- Commit: `Add billing webhook handling`

### Phase 11: Settings And Admin Controls

#### T1101 - Add Desktop Settings UI

- Version: `v0.11.0`
- Status: `pending`
- Goal: Add settings for account, projects, permissions, telemetry, updates, and diagnostics.
- Persona: Desktop UX engineer; make controls discoverable.
- Success Criteria: Settings UI reads/writes typed local and cloud-backed settings.
- Constraints: Do not expose provider internals.
- Output: Settings screens and tests.
- Strict Rule: Dangerous settings require confirmation.
- Verify: UI tests and smoke.
- Commit: `Add desktop settings UI`

#### T1102 - Add Permission Mode Settings

- Version: `v0.11.1`
- Status: `pending`
- Goal: Let users choose default approval mode per project.
- Persona: Safety UX engineer; give control without confusion.
- Success Criteria: UI explains modes briefly, stores project-level preference, and enforces through runner config.
- Constraints: No hidden full-auto bypass.
- Output: Permission settings and tests.
- Strict Rule: Mode change applies only to new sessions unless explicitly confirmed.
- Verify: Settings tests and runner config tests.
- Commit: `Add permission mode settings`

#### T1103 - Add Diagnostics Bundle

- Version: `v0.11.2`
- Status: `pending`
- Goal: Generate support diagnostics without secrets.
- Persona: Support engineer; make bug reports actionable.
- Success Criteria: Bundle includes app version, OS, runner version, config summary, recent errors, and masked logs.
- Constraints: User must explicitly export.
- Output: Diagnostics module and UI action.
- Strict Rule: Mask tokens, paths if user chooses privacy mode, and provider secrets.
- Verify: Masking tests.
- Commit: `Add diagnostics bundle`

### Phase 12: Updates, Packaging, And Release

#### T1201 - Define Release Channels

- Version: `v0.12.0`
- Status: `pending`
- Goal: Define dev, beta, stable release channels and update policy.
- Persona: Release manager; make app updates safe.
- Success Criteria: Docs define versioning, channels, signing, rollback, and release checklist.
- Constraints: Docs only.
- Output: `docs/release-process.md`.
- Strict Rule: Stable builds require full verification.
- Verify: Docs review.
- Commit: `Define release channels`

#### T1202 - Add Desktop Packaging

- Version: `v0.12.1`
- Status: `pending`
- Goal: Package the desktop app for Windows, macOS, and Linux where supported.
- Persona: Build engineer; create installable artifacts.
- Success Criteria: Build scripts produce platform packages with bundled sidecar strategy documented.
- Constraints: Signing can be placeholder until release keys exist.
- Output: Packaging config and docs.
- Strict Rule: Packages must not include dev secrets.
- Verify: Package build smoke.
- Commit: `Add desktop packaging`

#### T1203 - Add Auto Update Contract

- Version: `v0.12.2`
- Status: `pending`
- Goal: Define and implement signed update metadata flow.
- Persona: Desktop security engineer; keep updates trustworthy.
- Success Criteria: App can check update metadata and display available update without auto-install in MVP.
- Constraints: Download/install later if signing is not ready.
- Output: Update check module and API.
- Strict Rule: Never install unsigned updates.
- Verify: Update metadata tests.
- Commit: `Add signed update checks`

#### T1204 - Add End-To-End MVP Smoke

- Version: `v0.12.3`
- Status: `pending`
- Goal: Add an end-to-end smoke test covering login, project selection, prompt, runner event stream, patch preview, approval, and verification command.
- Persona: QA engineer; prove the MVP loop works.
- Success Criteria: Smoke test runs against mocked cloud/gateway and fixture workspace.
- Constraints: Must not require real provider keys.
- Output: E2E smoke test and docs.
- Strict Rule: Test must clean all temporary files.
- Verify: E2E smoke and standard verification.
- Commit: `Add MVP end-to-end smoke`

#### T1205 - Prepare Private Beta Release

- Version: `v0.12.4`
- Status: `pending`
- Goal: Prepare the first private beta build.
- Persona: Release manager; ship only verified product.
- Success Criteria: Full checks pass, installable artifact exists, release notes exist, known limitations are documented, and provider routing is server-side.
- Constraints: Publish only with explicit maintainer approval.
- Output: Release notes and beta checklist.
- Strict Rule: Do not release if gateway can expose provider keys or if shell approvals can be bypassed.
- Verify: Full standard verification, packaging smoke, manual beta checklist.
- Commit: `Prepare private beta release`
