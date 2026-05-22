export type ModelIntent =
  | "balanced"
  | "fast"
  | "large-context"
  | "low-cost"
  | "strong-reasoning";

export type ModelCapability =
  | "code-edit"
  | "code-review"
  | "function-calling"
  | "long-context"
  | "streaming"
  | "vision";

export interface ModelRequestPolicy {
  readonly capabilities: readonly ModelCapability[];
  readonly intent: ModelIntent;
  readonly maxOutputTokens?: number;
  readonly timeoutMs?: number;
}

export interface GatewayStreamChunk {
  readonly auditId: string;
  readonly delta?: string;
  readonly done: boolean;
  readonly usage?: UsageSummary;
}

import type { UsageSummary } from "./usage.type.js";
