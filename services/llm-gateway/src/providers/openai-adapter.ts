import type { GatewayChunk, GatewayRequest, UsageSummary } from "@qunta/shared-types";

import { providerUnavailable, type ProviderAdapter, zeroUsage } from "./adapter.js";

export interface OpenAiAdapterOptions {
  readonly apiKey: string;
  readonly baseUrl?: string;
  readonly fetchImpl?: typeof fetch;
}

interface OpenAiResponse {
  readonly output_text?: string;
  readonly usage?: {
    readonly input_tokens?: number;
    readonly output_tokens?: number;
    readonly total_tokens?: number;
  };
}

export function createOpenAiAdapter(options: OpenAiAdapterOptions): ProviderAdapter {
  const baseUrl = options.baseUrl ?? "https://api.openai.com/v1";
  const fetchImpl = options.fetchImpl ?? fetch;

  return {
    capabilities: {
      supportsStreaming: true,
      supportsToolCalls: true
    },
    id: "openai",
    mapError(error) {
      return providerUnavailable(error instanceof Error ? error.message : "OpenAI request failed");
    },
    mapUsage(usage) {
      return mapOpenAiUsage(usage);
    },
    async *stream(request) {
      yield* streamOpenAiResponse(baseUrl, options.apiKey, fetchImpl, request);
    }
  };
}

async function* streamOpenAiResponse(
  baseUrl: string,
  apiKey: string,
  fetchImpl: typeof fetch,
  request: GatewayRequest
): AsyncIterable<GatewayChunk> {
  const auditId = `audit_${request.agentSessionId}`;
  const response = await fetchImpl(`${baseUrl}/responses`, {
    body: JSON.stringify({
      input: request.messages.map((message) => message.content).join("\n"),
      stream: false
    }),
    headers: {
      authorization: `Bearer ${apiKey}`,
      "content-type": "application/json"
    },
    method: "POST"
  });

  if (!response.ok) throw new Error(`OpenAI request failed with ${response.status}`);

  const body = (await response.json()) as OpenAiResponse;
  yield {
    auditId,
    delta: body.output_text ?? "",
    done: false,
    type: "text_delta"
  };
  yield {
    auditId,
    done: true,
    type: "done",
    usage: mapOpenAiUsage(body.usage)
  };
}

function mapOpenAiUsage(usage: unknown): UsageSummary {
  if (!usage || typeof usage !== "object") return zeroUsage();
  const value = usage as OpenAiResponse["usage"];

  return {
    cachedInputTokens: 0,
    inputTokens: value?.input_tokens ?? 0,
    outputTokens: value?.output_tokens ?? 0,
    totalTokens: value?.total_tokens ?? 0
  };
}
