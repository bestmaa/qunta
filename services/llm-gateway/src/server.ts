import { createServer as createHttpServer } from "node:http";

import { authenticateGatewayRequest } from "./auth.js";
import type { GatewayConfig } from "./config.js";
import { createMockStream } from "./stream.js";

export function createGatewayServer(config: GatewayConfig) {
  return createHttpServer((request, response) => {
    if (request.method === "GET" && request.url === "/health") {
      writeJson(response, 200, { name: "qunta-llm-gateway", ok: true });
      return;
    }

    if (request.method === "POST" && request.url === "/v1/responses") {
      const auth = authenticateGatewayRequest(request);
      if (!auth) {
        writeJson(response, 401, authRequired());
        return;
      }

      response.setHeader("content-type", "application/x-ndjson");
      for (const chunk of createMockStream(config, auth.accountId)) {
        response.write(`${JSON.stringify(chunk)}\n`);
      }
      response.end();
      return;
    }

    writeJson(response, 404, { error: { code: "not_found", message: "Route not found" }, ok: false });
  });
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
