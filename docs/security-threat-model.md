# Security Threat Model

## Scope

This threat model covers the desktop coding-agent MVP: Tauri UI, Rust native core, local workspace access, Codex sidecar execution, private LLM gateway, cloud API, billing state, and app updates.

## Assets To Protect

- User source code and private project files.
- Local secrets such as `.env`, SSH keys, cloud credentials, package tokens, and git credentials.
- Product account sessions and refresh tokens.
- Provider API keys stored server-side.
- Billing state, usage records, and routing policy.
- App update signing keys and release artifacts.
- Audit logs and diagnostics bundles.

## Trust Boundaries

- User prompts are untrusted.
- Project files are untrusted because they can contain prompt injection.
- Agent output is untrusted until validated.
- Desktop clients are authenticated but not trusted for billing or provider routing.
- Provider responses are untrusted external data.
- Update metadata is untrusted unless signature checks pass.

## Local Workspace Risks

### Path Escape

Risk: agent or patch tries to read/write outside the selected project.

Controls:

- Canonicalize paths before access.
- Reject paths outside project root.
- Apply patches only through sandbox policy.
- Test path traversal cases.

### Secret Exposure

Risk: agent reads local secrets and sends them to an LLM provider.

Controls:

- Deny-read sensitive patterns by default.
- Mask secret-like strings before logs render.
- Require explicit user approval for denied files.
- Do not include raw secret files in generated context.

### Prompt Injection From Repo Files

Risk: README, comments, or docs instruct the agent to ignore safety rules.

Controls:

- Treat project content as data, not authority.
- Keep system/developer rules outside workspace context.
- Require approvals for high-risk actions.
- Log policy decisions for audit.

## Shell Command Risks

### Destructive Commands

Risk: command deletes files, resets git state, overwrites user work, or installs unsafe code.

Controls:

- Classify command risk before execution.
- Require approval for destructive commands.
- Require approval for package installs and network commands.
- Run commands only inside selected project cwd.
- Never run destructive git commands automatically.

### Orphan Processes

Risk: cancelled sessions leave running child processes.

Controls:

- Track child process IDs.
- Kill process group on cancellation where supported.
- Add timeout handling.
- Test cancellation cleanup.

## Provider And Gateway Risks

### Provider Key Leakage

Risk: provider API keys appear in desktop config, logs, or network responses.

Controls:

- Store provider keys only server-side.
- Gateway authenticates product sessions and calls providers directly.
- Desktop sends task intent, not provider credentials.
- Redact provider headers and keys from logs.

### Cost Abuse

Risk: compromised client or prompt loop spends excessive tokens.

Controls:

- Enforce server-side account limits.
- Enforce per-session rate limits.
- Record usage server-side.
- Add routing budget policy.
- Stop sessions on repeated gateway failures.

### Provider Identity Leakage

Risk: desktop UI reveals internal provider selection.

Controls:

- Return provider-neutral errors by default.
- Hide provider names from public contracts.
- Keep routing metadata server-side.
- Allow internal debug only through support diagnostics with masking.

## Auth And Token Risks

### Session Theft

Risk: desktop auth tokens are stolen from disk or logs.

Controls:

- Store tokens in OS-secure storage.
- Never log raw tokens.
- Support refresh and revoke.
- Bind sessions to device metadata where practical.

### Token Replay

Risk: stolen gateway token is reused.

Controls:

- Use short-lived gateway session tokens.
- Scope tokens to account, session, and workspace intent.
- Revoke tokens on logout or session end.

## Billing Risks

Risk: desktop client tampers with plan, usage, or entitlement state.

Controls:

- Billing state lives server-side.
- Desktop displays server-returned plan status only.
- Webhooks require signature verification.
- Usage values are computed by the gateway, not desktop clients.

## Update Risks

### Malicious Update

Risk: attacker serves a fake desktop update.

Controls:

- Require signed update metadata.
- Require signed binaries before install.
- Show channel and version clearly.
- Never install unsigned updates.

### Sidecar Mismatch

Risk: bundled Codex sidecar version is missing or unsafe.

Controls:

- Validate sidecar version at startup.
- Fail with diagnostics on mismatch.
- Keep sidecar path controlled by Tauri config.

## Diagnostics Risks

Risk: support bundle leaks paths, tokens, logs, prompts, or code.

Controls:

- User must explicitly export diagnostics.
- Mask tokens and secret-like values.
- Offer privacy mode for paths and project names.
- Exclude source file contents by default.

## Minimum Security Gates

- Provider keys never exist in desktop source or local config.
- Sensitive files are deny-read by default.
- High-risk commands require visible approval.
- Patches cannot write outside selected project root.
- Gateway enforces auth, usage, and routing server-side.
- Updates must be signed before automatic install is enabled.
- Cancellation cleans agent child processes.
