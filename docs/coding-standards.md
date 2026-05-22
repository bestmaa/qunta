# Coding Standards

## Purpose

These standards keep the desktop coding-agent codebase easy for humans and agents to change safely. Every implementation must prefer small, typed, verified modules over large mixed-responsibility files.

## Universal Rules

- No source code file may exceed 250 lines.
- Split before a file reaches the limit.
- Keep docs concise but complete enough for task execution.
- Use ASCII unless a file already has a clear non-ASCII reason.
- Prefer explicit names over abbreviations.
- Do not mix UI rendering, provider routing, billing, and filesystem mutation in one module.
- Do not commit generated secrets, provider keys, user project files, or local databases.

## TypeScript Rules

- Use strict TypeScript.
- Put shared pure types in `*.type.ts`.
- Use `type` or `interface` for request, response, event, and error contracts.
- Avoid `any`; use `unknown` plus validation at boundaries.
- Validate all environment variables at service startup.
- Public API responses must use typed error objects.
- UI state must use typed discriminated unions for session states.
- Provider names must not appear in desktop user-facing contracts unless explicitly internal.

## React UI Rules

- Keep components focused and small.
- Keep business logic in hooks or state modules, not large component bodies.
- UI package components must not import Tauri, cloud API clients, or service code.
- Use accessible labels for controls.
- Keep dense developer-tool layouts stable across desktop window sizes.
- Render loading, empty, error, disabled, and streaming states.
- Mask secret-like strings before rendering logs or event payloads.

## Rust Rules

- Keep modules small and strongly typed.
- Prefer explicit error enums over string errors.
- Use `Result<T, E>` for fallible operations.
- Do not let UI call shell commands directly.
- Validate paths before filesystem access.
- Canonicalize workspace paths before applying policies.
- Clean up child processes on cancellation or app exit.
- Tests must cover path escape, denied file, command policy, and patch safety logic.

## Service Rules

- Services must fail closed when config is invalid.
- Provider keys live only in server environments or secret stores.
- Billing and usage decisions are server-side.
- Gateway responses must normalize provider errors.
- Logs must include audit IDs but must not include raw tokens or provider keys.
- Rate limits must be enforced server-side.

## Naming Rules

- React components: `PascalCase.tsx`.
- React hooks: `use-name.ts`.
- TypeScript modules: lowercase kebab when exported as packages, otherwise local convention.
- Type files: `name.type.ts`.
- Rust modules: `snake_case.rs`.
- Docs: `kebab-case.md`.
- Test files should clearly mirror the unit under test.

## Comments

- Add comments only when they explain non-obvious decisions.
- Do not narrate obvious assignments.
- Add short safety comments around path validation, process spawning, provider routing, and token handling.

## Testing Rules

- Every code task must include focused tests unless the task is docs-only.
- UI changes need component or state tests.
- Rust safety logic needs unit tests with fixtures.
- Service route changes need request-level tests.
- Provider adapters must use mocked HTTP responses.
- E2E tests must use mocked gateway/provider calls unless a release task explicitly requires real credentials.

## Verification Commands

Run the relevant task verification plus the standard verification:

```bash
pnpm lint
pnpm typecheck
pnpm test
cargo fmt --check
cargo clippy --all-targets --all-features -- -D warnings
cargo test
git diff --check
```

If a command cannot run because the project is not scaffolded yet, record the reason in the task summary and use direct docs/file checks.

## Review Checklist

- Files stay under 250 lines.
- No provider secrets are present.
- Types are explicit at boundaries.
- Errors are typed and actionable.
- Workspace access is scoped to selected project roots.
- Tests or docs prove the task output.
- Task status is updated only after verification.
