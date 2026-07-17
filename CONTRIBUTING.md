# Contributing to Qunta

Thank you for helping improve Qunta. The project values focused changes, reviewable diffs, clear verification, and responsible handling of security-sensitive information.

## Before you start

- Search existing issues and pull requests to avoid duplicate work.
- Open or comment on an issue before starting a large architectural change.
- Keep secrets, provider keys, tokens, private prompts, and customer data out of issues, commits, logs, and screenshots.
- Report vulnerabilities privately as described in [SECURITY.md](SECURITY.md).

## Development setup

Qunta requires Node.js 22 or newer, pnpm 10 through Corepack, a compatible Rust toolchain, and the platform dependencies required by Tauri.

```bash
corepack enable
corepack pnpm install
```

## Working on a change

1. Create a focused branch from `main`.
2. Make the smallest coherent change that solves the issue.
3. Keep UI components presentational and put behavior in the appropriate hooks, services, or native modules.
4. Add or update tests and documentation when behavior changes.
5. Avoid drive-by formatting or unrelated dependency updates.

## Validation

Run the relevant checks before opening a pull request. The full repository gate is:

```bash
corepack pnpm check
cargo fmt --check
cargo clippy --all-targets --all-features -- -D warnings
cargo test
git diff --check
```

If a platform-specific check cannot run locally, explain why and document the checks that did run.

## Pull requests

A good pull request:

- links the issue it resolves;
- explains the user or developer impact;
- keeps the diff focused and reviewable;
- lists the exact validation commands and results;
- includes screenshots for visible UI changes;
- calls out security, migration, configuration, or compatibility impact.

Maintainers may ask for a smaller scope or additional verification before merging.

## Community expectations

Be respectful, provide reproducible evidence, and assume good intent. Harassment, spam, credential sharing, and low-quality automated contributions are not accepted.
