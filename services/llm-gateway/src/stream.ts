import type { GatewayChunk, UsageSummary } from "@qunta/shared-types";

import type { GatewayConfig } from "./config.js";

export function createMockStream(config: GatewayConfig, accountId: string): readonly GatewayChunk[] {
  const auditId = `audit_${accountId}_${config.nodeEnv}`;

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
      usage: emptyUsage()
    }
  ];
}

function emptyUsage(): UsageSummary {
  return {
    cachedInputTokens: 0,
    inputTokens: 0,
    outputTokens: 0,
    totalTokens: 0
  };
}
