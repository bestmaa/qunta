import type { GatewayChunk, UsageSummary } from "@qunta/shared-types";

import type { GatewayConfig } from "./config.js";

export function createMockStream(
  config: GatewayConfig,
  accountId: string,
  sessionId: string
): readonly GatewayChunk[] {
  const auditId = `audit_${accountId}_${sessionId}_${config.nodeEnv}`;

  return [
    {
      auditId,
      delta: "Gateway ready.",
      done: false,
      type: "text_delta"
    },
    {
      auditId,
      done: true,
      type: "done",
      usage: mockUsage()
    }
  ];
}

function mockUsage(): UsageSummary {
  return {
    cachedInputTokens: 4,
    inputTokens: 32,
    outputTokens: 18,
    totalTokens: 50
  };
}
