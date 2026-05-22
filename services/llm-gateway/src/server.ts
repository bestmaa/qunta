import { createServer as createHttpServer } from "node:http";
import type { IncomingMessage, ServerResponse } from "node:http";

import { authenticateGatewayRequest } from "./auth.js";
import type { GatewayConfig } from "./config.js";
import { RateLimiter } from "./rate-limit.js";
import { createMockStream } from "./stream.js";
import { createUsageRepository, type UsageRepository } from "./usage-meter.js";

export interface GatewayServerOptions {
  readonly rateLimiter?: RateLimiter;
  readonly usageRepository?: UsageRepository;
}

export function createGatewayServer(config: GatewayConfig, options: GatewayServerOptions = {}) {
  const rateLimiter = options.rateLimiter ?? new RateLimiter();
  const usageRepository = options.usageRepository ?? createUsageRepository();

  return createHttpServer((request, response) => {
    if (request.method === "GET" && request.url === "/health") {
      writeJson(response, 200, { name: "qunta-llm-gateway", ok: true });
      return;
    }

    if (request.method === "POST" && request.url === "/v1/responses") {
      void handleResponses(config, usageRepository, rateLimiter, request, response);
      return;
    }

    if (request.method === "GET" && request.url === "/v1/usage") {
      const auth = authenticateGatewayRequest(request);
      if (!auth) return writeJson(response, 401, authRequired());

      writeJson(response, 200, {
        ok: true,
        records: usageRepository.listForAccount(auth.accountId),
        summary: usageRepository.summarizeAccount(auth.accountId)
      });
      return;
    }

    writeJson(response, 404, { error: { code: "not_found", message: "Route not found" }, ok: false });
  });
}

async function handleResponses(
  config: GatewayConfig,
  usageRepository: UsageRepository,
  rateLimiter: RateLimiter,
  request: IncomingMessage,
  response: ServerResponse
) {
  const auth = authenticateGatewayRequest(request);
  if (!auth) {
    writeJson(response, 401, authRequired());
    return;
  }

  const startedAt = Date.now();
  const body = await readJsonBody(request);
  const sessionId = body.agentSessionId;
  const rateLimit = rateLimiter.checkAndRecord({
    accountId: auth.accountId,
    nowMs: startedAt,
    sessionId
  });

  if (!rateLimit.ok) {
    writeJson(response, 429, { error: rateLimit.error, ok: false });
    return;
  }

  const chunks = createMockStream(config, auth.accountId, sessionId);

  response.setHeader("content-type", "application/x-ndjson");
  for (const chunk of chunks) {
    response.write(`${JSON.stringify(chunk)}\n`);
  }
  response.end();

  const finalChunk = chunks.find((chunk) => chunk.done);
  if (finalChunk?.usage) {
    usageRepository.record({
      accountId: auth.accountId,
      auditId: finalChunk.auditId,
      endedAt: Date.now(),
      providerId: "mock",
      sessionId,
      startedAt,
      usage: finalChunk.usage
    });
  }
}

async function readJsonBody(request: IncomingMessage): Promise<{ agentSessionId: string }> {
  const chunks: Buffer[] = [];
  for await (const chunk of request) {
    chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk));
  }

  const parsed = JSON.parse(Buffer.concat(chunks).toString("utf8")) as {
    readonly agentSessionId?: unknown;
  };

  return {
    agentSessionId:
      typeof parsed.agentSessionId === "string" && parsed.agentSessionId.trim()
        ? parsed.agentSessionId
        : "session_unknown"
  };
}

function authRequired() {
  return { error: { code: "auth_required", message: "Gateway token required" }, ok: false };
}

function writeJson(response: NodeJS.WritableStream & { statusCode: number; setHeader: Function }, status: number, body: unknown) {
  response.setHeader("content-type", "application/json");
  response.statusCode = status;
  response.write(JSON.stringify(body));
  response.end();
}
