# Modular Architecture

## Goal

Build the product as separate modules so the desktop UI, native runtime, cloud API, LLM gateway, billing, and provider adapters can evolve independently. The desktop app is a client of the cloud services; provider choice and provider keys stay server-side.

## Top-Level Modules

```text
apps/desktop
  Tauri shell, app configuration, native window, permissions.

apps/desktop-ui
  React UI for chat, timeline, file tree, diffs, approvals, settings.

crates/desktop-core
  Tauri commands, local state, diagnostics, path validation, app settings.

crates/agent-runner
  Codex sidecar discovery, process lifecycle, event streaming, cancellation.

crates/sandbox
  Workspace boundaries, deny patterns, command policies, patch application.

services/api
  Auth, account plans, usage summaries, billing webhooks, update metadata.

services/llm-gateway
  Gateway auth, routing policy, provider adapters, streaming normalization.

packages/shared-types
  TypeScript request, response, event, auth, billing, and session contracts.

packages/ui
  Reusable UI primitives with no business logic.
```

## Runtime Data Flow

1. UI sends a prompt to the Tauri command layer.
2. `desktop-core` validates selected project and session settings.
3. `agent-runner` creates a per-session Codex config.
4. Codex sidecar runs inside the selected workspace boundary.
5. Codex sends LLM calls to `services/llm-gateway`.
6. Gateway authenticates the product session and applies routing policy.
7. Gateway calls DeepSeek, OpenAI, or another provider adapter.
8. Provider stream is normalized and returned to Codex.
9. Runner converts process output into typed session events.
10. UI renders timeline, command approvals, logs, and patch previews.
11. `sandbox` applies approved patches only inside project root.
12. `services/api` records usage and plan state server-side.

## IPC Boundaries

- UI may call only typed Tauri commands.
- Tauri commands may return only typed objects or typed errors.
- UI must not spawn shell commands directly.
- UI must not read arbitrary files directly.
- Rust modules own filesystem, process, and local state access.
- Cloud services are accessed through typed API clients.

## Trust Boundaries

```text
User/UI boundary:
  Prompt text and clicks are untrusted input.

Workspace boundary:
  Project files are user data and may include prompt-injection content.

Desktop native boundary:
  Rust commands can touch filesystem and processes; keep this API small.

Gateway boundary:
  Desktop client is authenticated but not trusted for billing or routing.

Provider boundary:
  Provider responses are untrusted and must be normalized and audited.
```

## Module Ownership Rules

- UI renders state and collects approvals; it does not decide provider routing.
- `desktop-core` owns local settings and secure OS integration.
- `agent-runner` owns process lifecycle and session event streaming.
- `sandbox` owns path safety, deny patterns, command policy, and patch safety.
- `services/api` owns account, plan, usage summaries, and billing state.
- `services/llm-gateway` owns model/provider selection, retries, cost tracking, and provider secrets.
- Provider adapters own provider-specific request and response translation.

## Deployment Shape

- Desktop app ships as a signed Tauri application.
- Codex runtime is bundled as a sidecar or discovered with a strict version check.
- Cloud API and LLM gateway deploy as separate services.
- PostgreSQL stores accounts, usage, plans, audit events, and billing state.
- Provider keys are injected only into gateway server environments or secret stores.

## Failure Handling

- If auth fails, desktop shows sign-in recovery.
- If gateway fails, session stops with a provider-neutral error.
- If Codex sidecar is missing, diagnostics show version and install guidance.
- If a command is rejected, runner records the rejection and continues when possible.
- If patch application fails, original files remain untouched where practical.

## Non-Monolithic Guardrails

- No file may combine UI rendering with provider billing or routing.
- No service may directly mutate local workspace files.
- No desktop module may contain real provider API keys.
- No provider adapter may import desktop UI code.
- No shared package may depend on application runtime code.
