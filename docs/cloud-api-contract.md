# Cloud API Contract

## Purpose

The Qunta cloud API owns account sessions, plans, usage summaries, billing state, gateway session access, and update metadata. The desktop app must treat this API as the source of truth for account and entitlement state.

Provider names, provider API keys, routing policy, fallback rules, and raw provider errors are not part of the public desktop contract.

## Base Rules

- All routes return JSON.
- Authenticated routes require `Authorization: Bearer <session-token>`.
- Errors use the shared `AppError` shape.
- Server responses may include `requestId` for support.
- Desktop clients do not send provider names or provider keys.

## Auth Routes

### `POST /v1/auth/device/start`

Starts desktop device sign-in.

Request:

```json
{
  "deviceName": "Aditya Windows",
  "platform": "windows"
}
```

Response:

```json
{
  "deviceCode": "ABCD-EFGH",
  "verificationUrl": "https://app.qunta.dev/device",
  "expiresAt": "2026-05-22T12:00:00Z"
}
```

### `POST /v1/auth/device/poll`

Polls for completed device sign-in.

Response when complete:

```json
{
  "accountId": "acct_123",
  "sessionId": "sess_123",
  "accessToken": "visible-once",
  "refreshToken": "visible-once",
  "expiresAt": "2026-05-22T13:00:00Z"
}
```

### `POST /v1/auth/session/refresh`

Refreshes a desktop session.

### `POST /v1/auth/session/revoke`

Revokes the current desktop session.

## Account Routes

### `GET /v1/account`

Returns account profile, plan, limits, and feature flags.

### `GET /v1/account/usage`

Returns monthly usage summary and remaining plan limits. Usage is computed server-side.

## Gateway Routes

### `POST /v1/gateway/session`

Creates a short-lived gateway session token for one agent session.

Request:

```json
{
  "agentSessionId": "agent_sess_123",
  "modelIntent": "balanced",
  "capabilities": ["code-edit", "streaming"]
}
```

Response:

```json
{
  "gatewayBaseUrl": "https://gateway.qunta.dev",
  "gatewayToken": "visible-once",
  "expiresAt": "2026-05-22T12:15:00Z"
}
```

The response does not include provider identity.

## Billing Routes

### `GET /v1/billing/status`

Returns current plan, trial status, renewal state, and billing portal availability.

### `POST /v1/billing/portal`

Returns a short-lived billing portal URL.

## Update Routes

### `GET /v1/updates/latest?channel=stable&platform=windows`

Returns signed update metadata for the requested channel and platform.

Response:

```json
{
  "channel": "stable",
  "version": "0.1.0",
  "notesUrl": "https://github.com/bestmaa/qunta/releases/tag/v0.1.0",
  "signature": "base64-signature",
  "artifactUrl": "https://updates.qunta.dev/stable/windows/0.1.0"
}
```

## Error Shape

```json
{
  "ok": false,
  "error": {
    "code": "auth_required",
    "message": "Sign in required",
    "requestId": "req_123"
  }
}
```

## Non-Exposed Data

- Provider API keys.
- Internal provider names.
- Cost-per-provider policy.
- Raw provider request headers.
- Raw provider error bodies.
- Billing webhook secrets.
