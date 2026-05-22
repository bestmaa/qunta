import assert from "node:assert/strict";

import { createUsageRepository, normalizeUsageRecord } from "../src/usage-meter.js";

const usage = {
  cachedInputTokens: 2,
  inputTokens: 20,
  outputTokens: 10,
  totalTokens: 30
};

const record = normalizeUsageRecord({
  accountId: "acct_1",
  auditId: "audit_1",
  endedAt: 1_700_000_010_000,
  providerId: "openai",
  sessionId: "sess_1",
  startedAt: 1_700_000_000_000,
  usage
});

assert.equal(record.estimatedCostMicros, 240);
assert.equal(record.latencyMs, 10_000);

const repository = createUsageRepository();
repository.record({
  accountId: "acct_1",
  auditId: "audit_1",
  endedAt: 2,
  providerId: "deepseek",
  sessionId: "sess_1",
  startedAt: 1,
  usage
});
repository.record({
  accountId: "acct_2",
  auditId: "audit_2",
  endedAt: 2,
  errorCode: "provider_timeout",
  providerId: "mock",
  sessionId: "sess_2",
  startedAt: 1,
  usage
});

assert.equal(repository.listForAccount("acct_1").length, 1);
assert.deepEqual(repository.summarizeAccount("acct_1"), {
  errorCount: 0,
  estimatedCostMicros: 60,
  requestCount: 1,
  sessionCount: 1,
  totalTokens: 30
});
assert.equal(repository.summarizeAccount("acct_2").errorCount, 1);
