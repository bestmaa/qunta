import type { GatewayChunk, GatewayRequest } from "@qunta/shared-types";

import { providerUnavailable, type ProviderAdapter, zeroUsage } from "./adapter.js";

export const mockProviderAdapter: ProviderAdapter = {
  capabilities: {
    supportsStreaming: true,
    supportsToolCalls: true
  },
  id: "mock",
  mapError(error) {
    return providerUnavailable(error instanceof Error ? error.message : "Provider failed");
  },
  mapUsage() {
    return zeroUsage();
  },
  async *stream(request: GatewayRequest): AsyncIterable<GatewayChunk> {
    const auditId = `audit_${request.agentSessionId}`;

    yield {
      auditId,
      delta: "Mock provider ready.",
      done: false,
      type: "text_delta"
    };

    yield {
      auditId,
      done: true,
      type: "done",
      usage: zeroUsage()
    };
  }
};
