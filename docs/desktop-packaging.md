# Desktop Packaging

## Purpose

Qunta desktop packages are produced from `apps/desktop` with the React UI built
from `apps/desktop-ui`. Packaging must never include development secrets, raw
provider keys, local user workspaces, or `.env` files.

## Commands

Use these commands:

```text
corepack pnpm --filter @qunta/desktop-ui build
corepack pnpm --filter @qunta/desktop package
corepack pnpm package:desktop:smoke
```

The smoke command writes `dist/packages/desktop-package-manifest.json`. It checks
Tauri package metadata, target platforms, sidecar policy, signing placeholder,
and secret-like strings.

## Platform Targets

The Tauri bundle target is `all` and maps to:

- Windows installer artifacts.
- macOS app or disk image artifacts where the runner supports macOS packaging.
- Linux package artifacts where the runner supports Linux packaging.

CI should build each platform on its native runner. Cross-platform packaging is
not assumed for MVP.

## Sidecar Strategy

The package includes or locates the Codex sidecar according to
`docs/codex-sidecar.md`. The manifest records only the strategy. It does not
store provider secrets, session tokens, gateway tokens, or user workspace paths.

## Signing

Signing is a placeholder until release keys exist:

- Dev packages may be unsigned.
- Beta and stable packages must be signed before external distribution.
- Signing keys live only in secure CI or maintainer secret storage.
- CI logs must mask signing key paths and passwords.

## Secret Exclusion

Packaging must exclude:

- `.env` and `.env.*`
- provider API keys
- gateway session tokens
- local SQLite databases
- user workspace files
- generated logs containing tokens

The smoke manifest is intentionally small so it can be reviewed before release.
