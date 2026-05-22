import type { AppError } from "@qunta/shared-types";

import { freeLimits } from "./account-model.js";

export interface ApiRateLimitDecision {
  readonly error?: AppError;
  readonly ok: boolean;
}

export class ApiRateLimiter {
  private readonly hits = new Map<string, number[]>();

  check(accountId: string, nowMs = Date.now()): ApiRateLimitDecision {
    const limit = freeLimits.sessionsPerMonth;
    if (!Number.isFinite(limit)) {
      return denied("Account plan could not be loaded.");
    }

    const recent = (this.hits.get(accountId) ?? []).filter((value) => nowMs - value < 60_000);
    if (recent.length >= limit) {
      return denied("Account API rate limit exceeded.");
    }

    this.hits.set(accountId, [...recent, nowMs]);
    return { ok: true };
  }
}

function denied(message: string): ApiRateLimitDecision {
  return {
    error: {
      code: "rate_limited",
      message,
      retryAfterMs: 60_000
    },
    ok: false
  };
}
