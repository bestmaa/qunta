# Codex Runtime Contract

## Purpose

Qunta runs Codex locally as a controlled sidecar or worker. The desktop app owns session lifecycle, workspace boundaries, approvals, and event rendering. Codex sends model traffic only to the Qunta LLM Gateway.

## Session Input

Each session starts with:

- `agentSessionId`
- selected project root
- user prompt
- approval mode
- model intent and capabilities
- gateway base URL
- short-lived gateway token
- sandbox policy summary

The session input must not include provider API keys.

## Workspace Path

- Workspace path must be selected by the user.
- Path must be canonicalized before use.
- Codex may only read/write inside the selected project root.
- Sensitive paths are denied unless a later approval task explicitly allows them.

## Gateway Configuration

Codex config points to:

```text
base_url = Qunta LLM Gateway
auth = short-lived gateway token
model = provider-neutral model intent
```

Codex must not be configured with direct OpenAI, DeepSeek, or other provider keys.

## Approval Mode

- `suggest`: no writes or shell commands without approval.
- `auto-edit`: safe file edits can be proposed, but patch apply remains user-visible.
- `controlled-full`: longer sessions allowed; high-risk shell, install, network, and git actions still require approval.

MVP default is `suggest`.

## Runtime Events

The runner emits typed events:

- `status`
- `summary`
- `file_read`
- `command_request`
- `command_output`
- `diff_ready`
- `error`
- `session_done`

Events must be safe to render after secret masking.

## Cancellation

Cancellation must:

- stop the Codex child process
- stop reading process streams
- mark the session cancelled
- preserve partial logs and proposed patches
- avoid applying unapproved changes

## Output Artifacts

A completed session may produce:

- event log
- changed file list
- patch set
- command log
- verification result
- usage summary from gateway

Artifacts are tied to a local session ID and never include provider keys.

## Failure Rules

- Missing Codex binary: fail before session starts.
- Gateway token expired: stop with auth error.
- Workspace denied: stop before process spawn.
- Command rejected: record rejection and continue when possible.
- Patch conflict: keep original files untouched where practical.
