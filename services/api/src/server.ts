import { createServer as createHttpServer } from "node:http";

import type { ApiConfig } from "./config.js";
import { createHealthResponse } from "./health.js";

export function createServer(config: ApiConfig) {
  return createHttpServer((request, response) => {
    if (request.method === "GET" && request.url === "/health") {
      writeJson(response, 200, createHealthResponse(config));
      return;
    }

    writeJson(response, 404, {
      error: {
        code: "not_found",
        message: "Route not found"
      },
      ok: false
    });
  });
}

function writeJson(response: NodeJS.WritableStream & { statusCode: number }, status: number, body: unknown) {
  response.statusCode = status;
  response.write(JSON.stringify(body));
  response.end();
}
