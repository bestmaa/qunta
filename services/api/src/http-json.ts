import type { IncomingMessage, ServerResponse } from "node:http";

export interface JsonResponse {
  readonly body: unknown;
  readonly status: number;
}

export async function readJson<T>(request: IncomingMessage): Promise<T> {
  const chunks: Buffer[] = [];

  for await (const chunk of request) {
    chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk));
  }

  const text = Buffer.concat(chunks).toString("utf8");
  return (text ? JSON.parse(text) : {}) as T;
}

export function writeJson(response: ServerResponse, result: JsonResponse): void {
  response.setHeader("content-type", "application/json");
  response.statusCode = result.status;
  response.write(JSON.stringify(result.body));
  response.end();
}
