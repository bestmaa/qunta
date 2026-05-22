import type {
  AccountEntitlement,
  AccountId,
  FeatureFlag,
  SubscriptionPlan,
  UsageLimits,
  UsageSummary
} from "@qunta/shared-types";

export const freeLimits: UsageLimits = {
  monthlyTokens: 100_000,
  sessionsPerMonth: 50
};

export const freeFeatures: readonly FeatureFlag[] = [
  "agent_sessions",
  "gateway_access",
  "project_history"
];

export const freePlan: SubscriptionPlan = {
  features: freeFeatures,
  id: "free",
  limits: freeLimits,
  name: "Free"
};

export function createDefaultEntitlement(accountId: AccountId): AccountEntitlement {
  return {
    accountId,
    plan: freePlan,
    status: "trialing",
    usage: emptyUsage()
  };
}

function emptyUsage(): UsageSummary {
  return {
    cachedInputTokens: 0,
    inputTokens: 0,
    outputTokens: 0,
    totalTokens: 0
  };
}
