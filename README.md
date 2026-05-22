# Qunta

A desktop coding-agent app powered by a private LLM gateway and local Codex runtime.

## Workspace

- `apps/desktop`: Tauri shell.
- `apps/desktop-ui`: React desktop UI.
- `crates`: Rust native modules.
- `services/api`: cloud API.
- `services/llm-gateway`: provider-hidden LLM gateway.
- `packages`: shared TypeScript packages.
- `docs`: product and engineering documentation.

## Verification

```bash
pnpm lint
pnpm typecheck
pnpm test
cargo fmt --check
cargo clippy --all-targets --all-features -- -D warnings
cargo test
git diff --check
```

Some commands are lightweight until later tasks add real packages and crates.
