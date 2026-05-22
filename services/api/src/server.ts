import { createServer as createHttpServer } from "node:http";

import { handleAccountRoute } from "./account-routes.js";
import { AuthStore } from "./auth-store.js";
import { handleAuthRoute } from "./auth-routes.js";
import type { ApiConfig } from "./config.js";
import { createHealthResponse } from "./health.js";
import { writeJson } from "./http-json.js";
import { ApiRateLimiter } from "./rate-limit.js";

export function createServer(config: ApiConfig) {
  const authStore = new AuthStore();
  const rateLimiter = new ApiRateLimiter();

  return createHttpServer(async (request, response) => {
    const accountId = getAccountId(request);
    const rateLimit = rateLimiter.check(accountId);
    if (!rateLimit.ok) {
      writeJson(response, { body: { error: rateLimit.error, ok: false }, status: 429 });
      return;
    }

    const authResult = await handleAuthRoute(authStore, request);
    if (authResult) {
      writeJson(response, authResult);
      return;
    }

    const accountResult = handleAccountRoute(request);
    if (accountResult) {
      writeJson(response, accountResult);
      return;
    }

    if (request.method === "GET" && request.url === "/health") {
      writeJson(response, { body: createHealthResponse(config), status: 200 });
      return;
    }

    writeJson(response, {
      body: {
        error: {
          code: "not_found",
          message: "Route not found"
        },
        ok: false
      },
      status: 404
    });
  });
}

function getAccountId(request: { headers: Record<string, string | string[] | undefined> }): string {
  const value = request.headers["x-qunta-account-id"];
  return Array.isArray(value) ? (value[0] ?? "acct_dev") : (value ?? "acct_dev");
}
