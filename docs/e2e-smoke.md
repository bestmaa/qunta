# MVP End-To-End Smoke

## Scope

The MVP smoke test proves the sellable loop without real provider keys:

- mocked login
- fixture project selection
- prompt submission
- runner event stream
- patch preview
- command approval
- verification command queued in the selected project cwd

## Command

```text
corepack pnpm test:e2e
```

The root `pnpm test` command runs the smoke test after package tests.

## Cleanup

The smoke test creates a temporary workspace under the OS temp directory and
removes it in a `finally` block. It must not write inside a user workspace or
require network access, provider keys, billing credentials, or desktop secrets.
