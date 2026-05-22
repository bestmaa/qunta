import type { AppError } from "@qunta/shared-types";

export interface RateLimitPlan {
  readonly accountRequestsPerMinute: number;
  readonly sessionRequestsPerMinute: number;
}

export interface RateLimitInput {
  readonly accountId: string;
  readonly nowMs: number;
  readonly sessionId: string;
}

export interface RateLimitDecision {
  readonly error?: AppError;
  readonly ok: boolean;
}

export type AccountPlanLoader = (accountId: string) => RateLimitPlan | undefined;

const minuteMs = 60_000;

export const defaultRateLimitPlan: RateLimitPlan = {
  accountRequestsPerMinute: 20,
  sessionRequestsPerMinute: 8
};

export class RateLimiter {
  private readonly accountHits = new Map<string, number[]>();
  private readonly loadPlan: AccountPlanLoader;
  private readonly sessionHits = new Map<string, number[]>();

  constructor(loadPlan: AccountPlanLoader = () => defaultRateLimitPlan) {
    this.loadPlan = loadPlan;
  }

  checkAndRecord(input: RateLimitInput): RateLimitDecision {
    const plan = this.loadPlan(input.accountId);
    if (!plan) {
      return denied("Account plan could not be loaded.");
    }

    const accountKey = input.accountId;
    const sessionKey = `${input.accountId}:${input.sessionId}`;
    const accountHits = prune(this.accountHits.get(accountKey) ?? [], input.nowMs);
    const sessionHits = prune(this.sessionHits.get(sessionKey) ?? [], input.nowMs);

    if (accountHits.length >= plan.accountRequestsPerMinute) {
      return denied("Account rate limit exceeded.");
    }

    if (sessionHits.length >= plan.sessionRequestsPerMinute) {
      return denied("Session rate limit exceeded.");
    }

    this.accountHits.set(accountKey, [...accountHits, input.nowMs]);
    this.sessionHits.set(sessionKey, [...sessionHits, input.nowMs]);
    return { ok: true };
  }
}

function prune(values: readonly number[], nowMs: number): number[] {
  return values.filter((value) => nowMs - value < minuteMs);
}

function denied(message: string): RateLimitDecision {
  return {
    error: {
      code: "rate_limited",
      message,
      retryAfterMs: minuteMs
    },
    ok: false
  };
}
