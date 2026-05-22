import type { ApiConfig } from "./config.js";

export interface HealthResponse {
  readonly name: "qunta-api";
  readonly ok: true;
  readonly publicBaseUrl: string;
}

export function createHealthResponse(config: ApiConfig): HealthResponse {
  return {
    name: "qunta-api",
    ok: true,
    publicBaseUrl: config.publicBaseUrl
  };
}
