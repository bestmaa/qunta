# Qunta Private Beta Release Notes

## Build

- Version: `0.1.0`
- Channel: `beta`
- Audience: private testers only
- Publish rule: do not distribute without explicit maintainer approval

## What Is Included

- Tauri desktop shell with React workspace UI.
- Project selection and workspace scanning.
- Prompt composer, runner timeline, patch preview, approvals, terminal logs, and
  verification command suggestions.
- Codex sidecar discovery and per-session gateway-backed config generation.
- Provider-hidden LLM gateway with OpenAI, DeepSeek, and mock adapter contracts.
- Server-side usage metering, rate limits, billing contract, and webhook mock.
- Settings for permissions, telemetry, updates, diagnostics, and project mode.
- Masked diagnostics bundle and signed update metadata check.
- MVP smoke test covering login through verification command.

## Provider routing is server-side

Desktop does not choose OpenAI, DeepSeek, or any other provider. Desktop sends a
gateway session request and the server chooses providers according to account,
budget, task intent, and fallback policy. Provider keys stay only in server
secret storage or server environment variables.

## Known Limitations

- Installer signing keys are placeholders until maintainer release keys exist.
- Auto-update is notify-only; the app does not download or install updates.
- Billing provider is a mock/manual contract for beta.
- Agent execution uses mocked UI runner paths for smoke coverage.
- Browser visual checks may be blocked by local client policy in this workspace.
- Native platform packages must be produced on native CI runners before external
  tester distribution.

## Verification

The beta candidate must pass:

- `corepack pnpm lint`
- `corepack pnpm typecheck`
- `corepack pnpm test`
- `corepack pnpm --filter @qunta/desktop-ui build`
- `corepack pnpm package:desktop:smoke`
- `corepack pnpm release:beta:check`
- `cargo fmt --check`
- `cargo clippy --all-targets --all-features -- -D warnings`
- `cargo test`
- `git diff --check`
