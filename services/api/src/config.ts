export interface ApiConfig {
  readonly billingWebhookSecret: string;
  readonly host: string;
  readonly nodeEnv: "development" | "production" | "test";
  readonly port: number;
  readonly publicBaseUrl: string;
}

export function loadConfig(env: NodeJS.ProcessEnv): ApiConfig {
  const nodeEnv = parseNodeEnv(env.NODE_ENV);
  const port = parsePort(env.QUNTA_API_PORT ?? "4000");
  const host = env.QUNTA_API_HOST ?? "127.0.0.1";
  const publicBaseUrl = env.QUNTA_PUBLIC_BASE_URL ?? `http://${host}:${port}`;
  const billingWebhookSecret = env.QUNTA_BILLING_WEBHOOK_SECRET ?? "dev_webhook_secret";

  return { billingWebhookSecret, host, nodeEnv, port, publicBaseUrl };
}

function parseNodeEnv(value: string | undefined): ApiConfig["nodeEnv"] {
  if (value === "production" || value === "test") return value;
  return "development";
}

function parsePort(value: string): number {
  const port = Number(value);

  if (!Number.isInteger(port) || port < 1 || port > 65_535) {
    throw new Error("QUNTA_API_PORT must be a valid TCP port");
  }

  return port;
}
