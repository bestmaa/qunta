import type { GatewayChunk, GatewayRequest, UsageSummary } from "@qunta/shared-types";

import { providerUnavailable, type ProviderAdapter, zeroUsage } from "./adapter.js";

export interface DeepSeekAdapterOptions {
  readonly apiKey: string;
  readonly baseUrl?: string;
  readonly fetchImpl?: typeof fetch;
}

interface DeepSeekResponse {
  readonly choices?: Array<{
    readonly message?: {
      readonly content?: string;
    };
  }>;
  readonly usage?: {
    readonly completion_tokens?: number;
    readonly prompt_tokens?: number;
    readonly total_tokens?: number;
  };
}

export function createDeepSeekAdapter(options: DeepSeekAdapterOptions): ProviderAdapter {
  const baseUrl = options.baseUrl ?? "https://api.deepseek.com";
  const fetchImpl = options.fetchImpl ?? fetch;

  return {
    capabilities: {
      supportsStreaming: true,
      supportsToolCalls: false
    },
    id: "deepseek",
    mapError(error) {
      return providerUnavailable(error instanceof Error ? error.message : "Model request failed");
    },
    mapUsage(usage) {
      return mapDeepSeekUsage(usage);
    },
    async *stream(request) {
      yield* streamDeepSeekResponse(baseUrl, options.apiKey, fetchImpl, request);
    }
  };
}

async function* streamDeepSeekResponse(
  baseUrl: string,
  apiKey: string,
  fetchImpl: typeof fetch,
  request: GatewayRequest
): AsyncIterable<GatewayChunk> {
  const auditId = `audit_${request.agentSessionId}`;
  const response = await fetchImpl(`${baseUrl}/chat/completions`, {
    body: JSON.stringify({
      messages: request.messages,
      stream: false
    }),
    headers: {
      authorization: `Bearer ${apiKey}`,
      "content-type": "application/json"
    },
    method: "POST"
  });

  if (!response.ok) throw new Error(`Model request failed with ${response.status}`);

  const body = (await response.json()) as DeepSeekResponse;
  yield {
    auditId,
    delta: body.choices?.[0]?.message?.content ?? "",
    done: false,
    type: "text_delta"
  };
  yield {
    auditId,
    done: true,
    type: "done",
    usage: mapDeepSeekUsage(body.usage)
  };
}

function mapDeepSeekUsage(usage: unknown): UsageSummary {
  if (!usage || typeof usage !== "object") return zeroUsage();
  const value = usage as DeepSeekResponse["usage"];

  return {
    cachedInputTokens: 0,
    inputTokens: value?.prompt_tokens ?? 0,
    outputTokens: value?.completion_tokens ?? 0,
    totalTokens: value?.total_tokens ?? 0
  };
}
