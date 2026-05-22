# Product Requirements - Qunta MVP

## Purpose

Build Qunta, a sellable desktop coding-agent app for developers who want a local, reviewable coding assistant with a custom UI. The product uses a Tauri desktop shell, a Rust native core, Codex as the local coding-agent runtime, and a private server-side LLM gateway. The gateway can route work to DeepSeek, OpenAI, or other providers without exposing provider details to users.

Hinglish summary: user app use karega, project select karega, prompt dega, agent local code par kaam karega, aur LLM routing hamare server ke through hidden rahegi.

## MVP Users

- Solo developers who want a desktop coding assistant.
- Small teams who need controlled local code edits.
- Internal beta users who can tolerate limited automation while core safety is proven.

## Supported Platforms

- MVP target: Windows 11 and Ubuntu Linux.
- Beta target: macOS after packaging and signing are ready.
- The app must clearly show unsupported platform or missing dependency diagnostics.

## Core User Flow

1. User installs and opens the desktop app.
2. User signs in with a product account.
3. User selects a local project folder.
4. App scans the workspace in read-only mode.
5. User asks the agent to explain, change, test, or create code.
6. App starts an isolated local agent session.
7. Codex runs as a controlled sidecar or worker.
8. LLM traffic goes through the private gateway.
9. UI streams session events, command logs, and proposed diffs.
10. User approves sensitive commands and patch application.
11. App applies accepted changes inside the selected project only.
12. App stores local audit history and server-side usage metadata.

## Local Workspace Requirements

- User must explicitly select a project folder.
- The app must not scan parent folders or unrelated directories.
- Workspace scanning is read-only until a session requests edits.
- Sensitive paths such as `.env`, SSH keys, cloud credentials, and package registry tokens are deny-read by default.
- File edits must stay inside the selected project root.
- Large folders such as `node_modules`, `.git`, build outputs, and caches must be ignored unless a task explicitly needs metadata from them.

## Cloud Dependency

- Sign-in, plan checks, usage metering, and LLM gateway access require the cloud API.
- Local project selection, recent projects, and limited diagnostics can work offline.
- Agent sessions that need LLM calls require a valid cloud session.
- The desktop app must fail clearly when the cloud API or gateway is unavailable.

## Provider Hiding

- Provider API keys live only in server-side infrastructure.
- Desktop clients never receive raw provider keys.
- Desktop clients send model intent or task class, not provider names.
- Server policy decides DeepSeek, OpenAI, fallback, cost limits, and retries.
- User-visible errors must be provider-neutral unless internal debug mode is enabled for support.

## Approval Modes

- Suggest: read project context and propose changes; user approval required for writes and shell commands.
- Auto Edit: allow safe file edits after diff preview; shell commands still require approval.
- Controlled Full: allow longer sessions with explicit high-risk approvals for shell, installs, git, network, and destructive actions.

MVP must default to Suggest. Full autonomous behavior is not enabled by default.

## Required MVP Screens

- Sign-in and account status.
- Project picker and recent projects.
- Main session view with chat, timeline, file tree, terminal logs, and diff viewer.
- Approval panel for commands and patch application.
- Settings for account, project permissions, diagnostics, and updates.

## Success Metrics

- A beta user can select a project and complete a small code change with review.
- Agent sessions stream enough detail for the user to trust what happened.
- Provider keys and internal routing never appear in desktop logs or UI.
- Failed sessions leave the workspace in a recoverable state.
- Usage is recorded server-side for billing and abuse control.

## Non-Goals For MVP

- No cloud autonomous repo agents.
- No browser IDE replacement.
- No mobile app.
- No marketplace for third-party agents.
- No direct user-provided provider keys in the desktop app.
- No automatic git commits or pushes.
- No unrestricted full-auto command execution.
- No team administration console beyond basic account and plan status.

## Release Gate

The private beta is ready only when login, project selection, session streaming, command approval, diff review, patch apply, and mocked gateway E2E smoke tests pass.
