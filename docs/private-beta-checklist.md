# Private Beta Checklist

## Release Gate

- Full checks have passed with no skipped stable-critical step.
- Packaging smoke manifest exists under `dist/packages`.
- Release notes include known limitations.
- Provider routing is server-side and provider keys are not exposed to desktop.
- Shell approvals cannot be bypassed by permission mode settings.
- Signed update metadata is checked before update display.
- Diagnostics mask tokens, provider secrets, and paths in privacy mode.
- Maintainer approval is recorded before publishing to testers.

## Manual Checks

- Open the desktop app in a local dev or packaged build.
- Select a fixture project.
- Submit a prompt.
- Confirm runner timeline events stream.
- Confirm patch preview is visible.
- Reject one command and approve one safe verification command.
- Confirm verification command uses the selected project cwd.
- Export diagnostics with privacy mode on.
- Check update metadata and confirm no auto-install occurs.

## Stop Release If

- Any provider key appears in desktop logs, UI, package metadata, or diagnostics.
- Shell command approval can be bypassed.
- Package smoke manifest contains secret-like values.
- Billing webhook accepts an invalid signature.
- Gateway routing can be controlled by desktop provider names.
- Update metadata is unsigned or checksum is missing.
