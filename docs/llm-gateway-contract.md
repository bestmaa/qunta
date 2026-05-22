# LLM Gateway Contract

## Purpose

The Qunta LLM Gateway is the only service that talks to model providers. Desktop clients and local Codex sessions authenticate to Qunta, request capabilities, and receive provider-neutral streams. The gateway decides provider routing, fallback, retry, and cost policy server-side.

## Public Rules

- Desktop clients never send provider API keys.
- Desktop clients never choose raw provider names.
- Gateway tokens are short-lived and scoped to one agent session.
- Streaming chunks are normalized.
- Usage summaries are computed by the gateway.
- Raw provider errors are mapped to provider-neutral errors.

## Request Shape

```json
{
  "agentSessionId": "agent_sess_123",
  "modelPolicy": {
    "intent": "balanced",
    "capabilities": ["code-edit", "streaming"],
    "maxOutputTokens": 4096,
    "timeoutMs": 120000
  },
  "messages": [
    {
      "role": "user",
      "content": "Fix the failing test"
    }
  ],
  "stream": true
}
```

## Streaming Chunk Shape

```json
{
  "auditId": "audit_123",
  "type": "text_delta",
  "delta": "I will inspect the failing test.",
  "done": false
}
```

Final chunk:

```json
{
  "auditId": "audit_123",
  "type": "done",
  "done": true,
  "usage": {
    "cachedInputTokens": 0,
    "inputTokens": 1200,
    "outputTokens": 300,
    "totalTokens": 1500
  }
}
```

## Tool Call Passthrough

The gateway may pass structured tool call requests through to Codex-compatible runtimes, but it does not execute desktop tools itself.

Tool call chunks include:

```json
{
  "auditId": "audit_123",
  "type": "tool_call",
  "toolName": "shell",
  "argumentsJson": "{\"command\":\"npm test\"}",
  "done": false
}
```

## Error Mapping

Gateway errors use the shared `AppError` shape.

Provider examples are mapped to:

- Provider auth failure: `gateway_unavailable`
- Provider timeout: `gateway_unavailable`
- Account over limit: `rate_limited`
- Invalid request: `invalid_request`
- Missing gateway token: `auth_required`

## Audit And Usage

- Every gateway request gets an `auditId`.
- Usage is recorded by account, agent session, request ID, and audit ID.
- Provider identity stays in internal logs only.
- Desktop-visible usage contains token and limit data, not provider cost internals.

## Non-Exposed Data

- Provider names.
- Provider request headers.
- Provider API keys.
- Raw provider response bodies.
- Routing policy.
- Cost-per-provider tables.
