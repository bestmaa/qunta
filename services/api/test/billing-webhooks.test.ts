import assert from "node:assert/strict";

import type { AccountId } from "@qunta/shared-types";

import { BillingWebhookStore, signMockWebhook } from "../src/billing-webhooks.js";

const secret = "test_secret";
const body = JSON.stringify({
  accountId: "acct_1",
  eventId: "evt_1",
  eventType: "subscription.updated",
  planId: "pro",
  status: "active"
});

assert.equal(signMockWebhook(body, secret).length, 64);

const store = new BillingWebhookStore();
const entitlement = store.apply({
  accountId: "acct_1" as AccountId,
  eventId: "evt_1",
  eventType: "subscription.updated",
  planId: "pro",
  status: "active"
});

assert.equal(entitlement.plan.id, "pro");
assert.equal(entitlement.status, "active");
assert.equal(store.audits().length, 1);
assert.equal(store.audits()[0]?.providerEventId, "evt_1");
