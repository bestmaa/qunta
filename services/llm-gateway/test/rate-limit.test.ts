import assert from "node:assert/strict";

import { RateLimiter } from "../src/rate-limit.js";

const limiter = new RateLimiter(() => ({
  accountRequestsPerMinute: 2,
  sessionRequestsPerMinute: 1
}));

assert.equal(
  limiter.checkAndRecord({
    accountId: "acct_1",
    nowMs: 1_000,
    sessionId: "sess_1"
  }).ok,
  true
);

const sessionBlocked = limiter.checkAndRecord({
  accountId: "acct_1",
  nowMs: 1_100,
  sessionId: "sess_1"
});
assert.equal(sessionBlocked.ok, false);
assert.equal(sessionBlocked.error?.code, "rate_limited");
assert.equal(sessionBlocked.error?.retryAfterMs, 60_000);

assert.equal(
  limiter.checkAndRecord({
    accountId: "acct_1",
    nowMs: 1_200,
    sessionId: "sess_2"
  }).ok,
  true
);

const accountBlocked = limiter.checkAndRecord({
  accountId: "acct_1",
  nowMs: 1_300,
  sessionId: "sess_3"
});
assert.equal(accountBlocked.ok, false);
assert.match(accountBlocked.error?.message ?? "", /Account rate limit/);

const failClosed = new RateLimiter(() => undefined).checkAndRecord({
  accountId: "acct_missing",
  nowMs: 1_000,
  sessionId: "sess_1"
});
assert.equal(failClosed.ok, false);
assert.match(failClosed.error?.message ?? "", /could not be loaded/);
