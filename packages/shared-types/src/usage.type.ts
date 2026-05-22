import type { AccountId, SessionId } from "./auth.type.js";

export interface UsageSummary {
  readonly cachedInputTokens: number;
  readonly inputTokens: number;
  readonly outputTokens: number;
  readonly totalTokens: number;
}

export interface UsageRecord {
  readonly accountId: AccountId;
  readonly auditId: string;
  readonly createdAt: string;
  readonly errorCode?: string;
  readonly estimatedCostMicros: number;
  readonly latencyMs: number;
  readonly sessionId: SessionId;
  readonly summary: UsageSummary;
}
