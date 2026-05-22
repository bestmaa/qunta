import type { AppError, GatewayChunk, GatewayRequest, UsageSummary } from "@qunta/shared-types";

export interface ProviderCapabilities {
  readonly supportsStreaming: boolean;
  readonly supportsToolCalls: boolean;
}

export interface ProviderAdapter {
  readonly capabilities: ProviderCapabilities;
  readonly id: string;
  readonly mapError: (error: unknown) => AppError;
  readonly mapUsage: (usage: unknown) => UsageSummary;
  readonly stream: (request: GatewayRequest) => AsyncIterable<GatewayChunk>;
}

export function providerUnavailable(message: string): AppError {
  return {
    code: "gateway_unavailable",
    message
  };
}

export function zeroUsage(): UsageSummary {
  return {
    cachedInputTokens: 0,
    inputTokens: 0,
    outputTokens: 0,
    totalTokens: 0
  };
}
