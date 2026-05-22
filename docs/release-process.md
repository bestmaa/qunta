# Release Process

## Purpose

Qunta releases use separate dev, beta, and stable channels so unfinished work can
be tested without putting paying users at risk. Stable releases require full
verification, signed artifacts, update metadata, and a rollback plan.

## Versioning

Qunta uses semantic versions:

- Patch: verified bug fixes with no workflow or contract break.
- Minor: new user-facing capabilities or compatible cloud contracts.
- Major: breaking desktop, API, billing, or gateway contract changes.

Every desktop build includes:

- App version from Tauri package metadata.
- Release channel.
- Git commit SHA.
- Codex sidecar version requirement.
- Update metadata schema version.

## Channels

### Dev

Dev builds are for maintainers and local QA only.

- May use unsigned local artifacts.
- May point at staging cloud services.
- Must not auto-update stable or beta users.
- Must show diagnostics clearly as a dev build.

### Beta

Beta builds are for private testers.

- Must be signed when distributed outside local machines.
- May include feature flags that are disabled for stable.
- Must use production-like cloud endpoints.
- Must include release notes and known limitations.
- Can be rolled back by publishing older beta metadata.

### Stable

Stable builds are for paying users.

- Must pass full TypeScript, Rust, build, and smoke verification.
- Must use signed desktop artifacts and signed update metadata.
- Must include release notes, migration notes, and rollback notes.
- Must not expose provider internals, secrets, or debug-only UI.
- Must use production billing, usage, rate-limit, and gateway policies.

## Required Verification

Stable builds require all checks below:

```text
pnpm lint
pnpm typecheck
pnpm test
pnpm --filter @qunta/desktop-ui build
cargo fmt --check
cargo clippy --all-targets --all-features -- -D warnings
cargo test
git diff --check
```

Beta builds require the same checks unless release management explicitly records
the skipped check and its risk in the beta notes. Dev builds should run the same
checks before sharing.

## Signing

Release signing is owned by maintainers:

- Signing keys are stored only in secure CI or maintainer secret storage.
- Signing keys are never stored in the repository or desktop app.
- Update metadata is signed separately from installers.
- CI logs must mask signing key paths, passwords, and token values.

Unsigned artifacts may be used only for local dev.

## Update Policy

The desktop app checks update metadata for its channel. MVP behavior is notify
only: the app can display an available update but does not auto-install.

Metadata includes:

- Version.
- Channel.
- Platform.
- Download URL.
- Artifact checksum.
- Signature.
- Minimum supported app version.
- Release notes URL.

The app rejects metadata when the signature, checksum, channel, or platform does
not match.

## Rollback

Rollback is channel scoped:

- Dev rollback means rebuilding from a previous commit.
- Beta rollback means publishing older beta metadata with a newer metadata
  timestamp.
- Stable rollback means publishing a new patch version that restores the last
  known good behavior.

Stable must not downgrade users silently. If a build is pulled, the update
service should mark it unavailable and publish the replacement version.

## Release Checklist

Before beta:

- Full checks pass or skipped checks are documented.
- Installer opens on target platform.
- Cloud API and gateway endpoints are correct.
- Billing and provider secrets are server-side only.
- Release notes include known limitations.

Before stable:

- Full checks pass with no skipped steps.
- Signed artifacts and signed metadata exist.
- Smoke test covers login, project selection, prompt, patch preview, approval,
  and verification command.
- Rollback plan names the last known good version.
- Support diagnostics bundle masks tokens, paths, and provider secrets.
