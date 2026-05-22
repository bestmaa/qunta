import type { UsageRecord, UsageSummary } from "@qunta/shared-types";

export interface UsageMeterInput {
  readonly accountId: string;
  readonly auditId: string;
  readonly errorCode?: string;
  readonly endedAt: number;
  readonly providerId: "deepseek" | "mock" | "openai";
  readonly sessionId: string;
  readonly startedAt: number;
  readonly usage: UsageSummary;
}

export interface UsageAggregate {
  readonly estimatedCostMicros: number;
  readonly errorCount: number;
  readonly requestCount: number;
  readonly sessionCount: number;
  readonly totalTokens: number;
}

export interface UsageRepository {
  readonly listForAccount: (accountId: string) => readonly UsageRecord[];
  readonly record: (input: UsageMeterInput) => UsageRecord;
  readonly summarizeAccount: (accountId: string) => UsageAggregate;
}

const providerRatesPerTokenMicros: Record<UsageMeterInput["providerId"], number> = {
  deepseek: 2,
  mock: 0,
  openai: 8
};

export function createUsageRepository(): UsageRepository {
  const usageTable: UsageRecord[] = [];

  return {
    listForAccount(accountId) {
      return usageTable.filter((record) => record.accountId === accountId);
    },
    record(input) {
      const record = normalizeUsageRecord(input);
      usageTable.push(record);
      return record;
    },
    summarizeAccount(accountId) {
      return summarizeUsage(usageTable.filter((record) => record.accountId === accountId));
    }
  };
}

export function normalizeUsageRecord(input: UsageMeterInput): UsageRecord {
  const record: UsageRecord = {
    accountId: input.accountId as UsageRecord["accountId"],
    auditId: input.auditId,
    createdAt: new Date(input.endedAt).toISOString(),
    estimatedCostMicros: estimateCostMicros(input.providerId, input.usage),
    latencyMs: Math.max(0, input.endedAt - input.startedAt),
    sessionId: input.sessionId as UsageRecord["sessionId"],
    summary: input.usage
  };

  return input.errorCode ? { ...record, errorCode: input.errorCode } : record;
}

export function summarizeUsage(records: readonly UsageRecord[]): UsageAggregate {
  const sessions = new Set(records.map((record) => record.sessionId));

  return {
    errorCount: records.filter((record) => record.errorCode).length,
    estimatedCostMicros: records.reduce((total, record) => total + record.estimatedCostMicros, 0),
    requestCount: records.length,
    sessionCount: sessions.size,
    totalTokens: records.reduce((total, record) => total + record.summary.totalTokens, 0)
  };
}

function estimateCostMicros(
  providerId: UsageMeterInput["providerId"],
  usage: UsageSummary
): number {
  return usage.totalTokens * providerRatesPerTokenMicros[providerId];
}
