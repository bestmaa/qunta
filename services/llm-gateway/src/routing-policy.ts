import type { ModelIntent, PlanId } from "@qunta/shared-types";

export type ProviderId = "deepseek" | "mock" | "openai";

export interface RoutingInput {
  readonly failedProviders: readonly ProviderId[];
  readonly intent: ModelIntent;
  readonly monthlyBudgetRemainingMicros: number;
  readonly planId: PlanId;
}

export interface RoutingDecision {
  readonly fallbackProviders: readonly ProviderId[];
  readonly providerId: ProviderId;
  readonly reason: string;
}

export function chooseProvider(input: RoutingInput): RoutingDecision {
  const candidates = rankedCandidates(input).filter(
    (provider) => !input.failedProviders.includes(provider)
  );

  const providerId = candidates[0] ?? "mock";
  return {
    fallbackProviders: candidates.slice(1),
    providerId,
    reason: reasonFor(input, providerId)
  };
}

function rankedCandidates(input: RoutingInput): ProviderId[] {
  if (input.monthlyBudgetRemainingMicros <= 0) return ["mock"];
  if (input.planId === "free") return ["deepseek", "mock"];
  if (input.intent === "strong-reasoning") return ["openai", "deepseek", "mock"];
  if (input.intent === "low-cost" || input.intent === "fast") {
    return ["deepseek", "openai", "mock"];
  }
  return ["openai", "deepseek", "mock"];
}

function reasonFor(input: RoutingInput, providerId: ProviderId): string {
  if (providerId === "mock") return "No paid provider is available for this request.";
  if (input.planId === "free") return "Free plan routes to the low-cost provider tier.";
  if (input.intent === "strong-reasoning") return "Strong reasoning intent selected.";
  return "Balanced server-side routing policy selected.";
}
