export interface GatewayConfig {
  readonly host: string;
  readonly nodeEnv: "development" | "production" | "test";
  readonly port: number;
}

export function loadGatewayConfig(env: NodeJS.ProcessEnv): GatewayConfig {
  return {
    host: env.QUNTA_GATEWAY_HOST ?? "127.0.0.1",
    nodeEnv: parseNodeEnv(env.NODE_ENV),
    port: parsePort(env.QUNTA_GATEWAY_PORT ?? "4100")
  };
}

function parseNodeEnv(value: string | undefined): GatewayConfig["nodeEnv"] {
  if (value === "production" || value === "test") return value;
  return "development";
}

function parsePort(value: string): number {
  const port = Number(value);
  if (!Number.isInteger(port) || port < 1 || port > 65_535) {
    throw new Error("QUNTA_GATEWAY_PORT must be a valid TCP port");
  }
  return port;
}
