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

export const proPlan: SubscriptionPlan = {
  features: [...freeFeatures, "controlled_full_mode"],
  id: "pro",
  limits: {
    monthlyTokens: 2_000_000,
    sessionsPerMonth: 500
  },
  name: "Pro"
};

export const teamPlan: SubscriptionPlan = {
  features: proPlan.features,
  id: "team",
  limits: {
    monthlyTokens: 10_000_000,
    sessionsPerMonth: 2_500
  },
  name: "Team"
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
