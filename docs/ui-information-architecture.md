# Desktop UI Information Architecture

Qunta opens directly into the coding workspace. There is no marketing landing
page inside the app. The first screen should help the user choose a project,
see account/runtime status, and start a session.

## App Shell

The shell uses three persistent regions:

- Left rail: projects, file tree, search, changed files.
- Main work area: session timeline, prompt composer, diff viewer.
- Right rail: runtime status, approvals, terminal logs, settings shortcuts.

The status bar remains visible across screens and shows selected project, active
profile, gateway status, sidecar status, and account plan.

## First Screen

Purpose: select or reopen a local project.

Required content:

- recent projects list
- open folder action
- project validation errors
- shell and Codex sidecar readiness
- account sign-in state

Empty state copy must stay operational, not promotional.

## Project Screen

Purpose: inspect project context before starting the agent.

Required panels:

- project header with path, git state, package manager, and test commands
- file tree with ignored folder handling
- workspace summary with language and scripts
- permission profile selector
- new session action

The app must not scan parent folders outside the selected project.

## Session Screen

Purpose: watch and steer the agent.

Required panels:

- timeline of agent events
- prompt composer
- command approval queue
- terminal output
- changed files list
- diff viewer

Timeline event types:

- thinking summary
- file read
- command requested
- command output
- patch proposed
- verification result
- completion
- failure

## Diff Viewer

The diff viewer supports added, modified, and deleted files. It must show file
path, change summary, inline diff, and file-level accept/reject controls.

Accepted patches are staged for application only after the user confirms. Patch
conflicts must block apply and show a clear reason.

## Terminal Logs

Terminal logs are dense and readable:

- grouped by command
- searchable
- pausable
- clearable
- safe for long output

High-risk command logs must link back to the approval record.

## Approvals

Approval rows show:

- command
- cwd
- risk label
- reason
- profile decision
- approve and reject controls
- audit status

Rejected commands must remain visible long enough for the user to understand
what was blocked.

## Settings

Settings are grouped by task:

- account and plan
- projects
- permission defaults
- telemetry
- updates
- diagnostics

Settings should be compact and form-like, with clear save/error states.

## Account

Account view shows sign-in status, plan, limits, usage, renewal/trial state, and
gateway access health. It must never expose provider choice or provider keys.

## Error States

Common error states:

- project path unavailable
- sidecar missing or version mismatch
- gateway unavailable
- account limit exceeded
- command rejected
- patch conflict
- verification failed

Errors should include a short reason, recovery action, and diagnostics affordance
when useful.

## Layout Wireframes

```text
┌───────────────┬──────────────────────────────────────┬──────────────────┐
│ Projects      │ Session / Project Workspace          │ Status           │
│ File Tree     │ Timeline / Diff / Composer           │ Approvals        │
│ Changed Files │                                      │ Terminal Logs    │
└───────────────┴──────────────────────────────────────┴──────────────────┘
```

```text
First screen:
Projects rail -> Recent projects and Open
Main area     -> Select project empty state
Right rail    -> Shell, account, sidecar readiness
```

```text
Session screen:
Projects rail -> File tree and changed files
Main area     -> Timeline, diff viewer, composer
Right rail    -> Approval queue and terminal output
```
