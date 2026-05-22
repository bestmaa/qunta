import type { AccountId } from "./auth.type.js";
import type { UsageSummary } from "./usage.type.js";

export type PlanId = "free" | "pro" | "team";

export type PlanStatus = "active" | "past_due" | "trialing";

export type FeatureFlag =
  | "agent_sessions"
  | "controlled_full_mode"
  | "gateway_access"
  | "project_history";

export interface UsageLimits {
  readonly monthlyTokens: number;
  readonly sessionsPerMonth: number;
}

export interface SubscriptionPlan {
  readonly features: readonly FeatureFlag[];
  readonly id: PlanId;
  readonly limits: UsageLimits;
  readonly name: string;
}

export interface AccountEntitlement {
  readonly accountId: AccountId;
  readonly plan: SubscriptionPlan;
  readonly status: PlanStatus;
  readonly usage: UsageSummary;
}
