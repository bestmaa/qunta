# Workspace Safety Rules

Qunta must treat every selected project as user-owned data. The agent can help
inside that project only after the desktop app has validated paths, classified
risk, and applied the active permission profile.

## Workspace Boundary

- The selected project root is the default allow boundary.
- Every read, write, patch, command cwd, and artifact path must be canonicalized.
- A path is allowed only when the canonical path starts with the canonical
  project root.
- Symlinks are resolved before policy checks.
- Workspace scans skip large dependency and build folders by default.

Default ignored folders:

- `.git`
- `.hg`
- `.svn`
- `node_modules`
- `target`
- `dist`
- `build`
- `.next`
- `.turbo`
- `.cache`
- `vendor`

## Deny-Read Files

Sensitive files are deny-read by default unless the user explicitly approves a
single read request. Approval must name the path and explain why the read is
needed.

Default deny-read patterns:

- `.env`
- `.env.*`
- `*.pem`
- `*.key`
- `*.p12`
- `*.pfx`
- `id_rsa`
- `id_ed25519`
- `.npmrc`
- `.pypirc`
- `.netrc`
- `credentials`
- `credentials.json`
- `service-account*.json`
- `kubeconfig`
- `.aws/**`
- `.azure/**`
- `.gcloud/**`
- `.ssh/**`

If a denied file is approved, raw content must not be added to prompts, logs, or
diagnostic bundles without masking.

## Write Rules

Allowed writes:

- Files inside the selected project root.
- Generated session artifacts inside the session temp directory.
- Patch previews in Qunta-owned temp paths.

Denied writes:

- Any path outside the project root.
- Deny-read files unless the user explicitly approves that exact path.
- Git internals such as `.git/**`.
- Global config files such as shell profiles, package manager auth files, and
  cloud credential files.

Patch apply must be atomic where practical. If a patch cannot apply cleanly,
Qunta must stop and show the conflict instead of guessing.

## Shell Command Rules

Commands run only from the selected project or an approved temp session path.
The UI must show command, cwd, risk label, and reason before execution when a
profile requires approval.

Always require approval:

- `rm -rf`, `del /s`, `rmdir /s`, or equivalent recursive deletion.
- `git reset --hard`, `git clean`, force push, rebase, or destructive checkout.
- Package installs that modify lockfiles or execute install scripts.
- Network commands that upload files or send project archives.
- Commands using `sudo`, elevation, shell profile edits, or credential stores.

Always deny unless the user changes workspace policy:

- Commands with cwd outside the selected project.
- Commands that target home directory secrets.
- Commands that overwrite denied files.
- Commands that disable security tooling.

## Git Safety

Qunta must read git status before applying changes and before suggesting a
commit. Dirty user files are treated as protected context.

Rules:

- Never discard user changes automatically.
- Never run `git reset --hard` automatically.
- Never run `git clean` automatically.
- Never force push automatically.
- Show branch, staged files, unstaged files, and untracked files before patch
  apply.
- Prefer local checkpoints before large patch application.
- Commit only when the user explicitly asks.

## Logging And Diagnostics

Audit records should include policy decisions, denied paths, approved actions,
command metadata, and patch results. Logs must not include raw secret file
contents, gateway session tokens, refresh tokens, provider keys, or cloud
credentials.

Diagnostics may include:

- app version
- OS
- active permission profile
- selected project path
- runner version
- masked recent errors

Diagnostics must exclude:

- raw prompts containing secrets
- full source archives
- denied file contents
- raw tokens

## Policy Outcome

Every workspace action resolves to one of four outcomes:

- `allow`: proceed without prompting.
- `ask`: pause and request user approval.
- `deny`: block and show a clear reason.
- `mask`: allow only after sensitive values are redacted.

The safest matching rule wins when multiple rules apply.
