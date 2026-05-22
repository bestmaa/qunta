# Billing Provider Contract

## Purpose

Qunta billing is owned by the cloud API, not the desktop app. The desktop app
only displays account, plan, invoice, trial, and cancellation status returned by
the server. It never receives provider secret keys, provider webhook payloads, or
provider-specific routing rules.

The first implementation can use Stripe, Paddle, or a manual internal provider.
The product code depends on the normalized contract below so the provider can be
changed without changing desktop behavior.

## Server Owned Data

The server stores these normalized fields:

- `accountId`: Qunta account id.
- `provider`: `stripe`, `paddle`, or `manual`.
- `providerCustomerId`: opaque id from the billing provider.
- `providerSubscriptionId`: opaque id, nullable for free/manual accounts.
- `planId`: Qunta plan id, such as `free`, `pro`, or `team`.
- `status`: Qunta account status, such as `trialing`, `active`, or `past_due`.
- `trialEndsAt`: ISO timestamp or `null`.
- `currentPeriodEndsAt`: ISO timestamp for limit reset and renewal display.
- `cancelAtPeriodEnd`: boolean cancellation marker.
- `usageLimits`: server-defined token and session limits for the current plan.

Provider-specific ids stay server-side. Desktop receives only the normalized
status and display-safe invoice links returned by the cloud API.

## Plan Mapping

Each provider price maps to one `BillingPlanContract`:

| Qunta plan | Provider plan id | Trial | Usage limit owner |
| --- | --- | --- | --- |
| `free` | `manual_free` | Optional | Qunta server |
| `pro` | Provider price id | 7 to 14 days | Qunta server |
| `team` | Provider price id | Sales controlled | Qunta server |

The billing provider may collect payment, but the Qunta server remains the source
of truth for feature flags and model usage limits. Desktop must not infer limits
from provider plan names or invoice text.

## Subscription Flow

1. Desktop requests the current account state from the cloud API.
2. Cloud API returns normalized plan, trial, account status, usage limits, and
   invoice summaries.
3. If upgrade is available, desktop opens a server-created checkout URL.
4. Provider redirects back to the cloud API completion endpoint.
5. Cloud API waits for verified webhook confirmation before changing entitlement.
6. Desktop refreshes account state and displays the server-returned status.

Checkout URLs are short lived and are created only by the server.

## Trial Rules

- Trial start and end timestamps are created by the server.
- Trial extension is an admin/server operation.
- Trial accounts use the same gateway and rate-limit checks as paid accounts.
- Expired trials become `past_due` or `free` according to server policy.

## Invoice Contract

The API returns invoice summaries:

- `id`: provider invoice id or internal invoice id.
- `status`: `draft`, `open`, `paid`, `void`, or `uncollectible`.
- `amountDueMicros`: integer amount in micros.
- `currency`: ISO currency code.
- `dueAt`: ISO timestamp or `null`.
- `hostedUrl`: provider hosted invoice URL or `null`.

Desktop may display this data and open `hostedUrl`. It must not parse provider
invoice pages to determine entitlement.

## Cancellation Contract

Cancellation requests are sent to the server with:

- `accountId`
- `requestedBy`
- `reason`

The server calls the provider, records an audit event, and returns the updated
normalized subscription status. MVP cancellation defaults to
`cancelAtPeriodEnd: true`; immediate cancellation is an admin-only operation.

## Webhook Requirements

Billing webhooks are accepted only by the cloud API:

- Verify provider signature before reading event data.
- Map provider customer id to Qunta account id server-side.
- Ignore unknown provider plan ids.
- Update entitlement only after verified subscription or invoice events.
- Record an audit event for plan changes, trial changes, payment failures, and
  cancellations.

If a webhook cannot be verified or mapped, the server must fail closed and leave
the existing entitlement unchanged.

## Desktop Boundary

Desktop can display:

- Current plan name and status.
- Trial end date.
- Current period end date.
- Usage limits returned by server.
- Invoice summaries and hosted invoice URLs.
- Cancellation pending state.

Desktop cannot:

- Choose the payment provider.
- Read provider customer or subscription secrets.
- Send provider webhook payloads.
- Calculate entitlement from invoice text.
- Override usage limits, trial dates, or account status.
