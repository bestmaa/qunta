import { readFileSync } from "node:fs";

const configSource = readFileSync(new URL("../src/config.ts", import.meta.url), "utf8");
const authSource = readFileSync(new URL("../src/auth.ts", import.meta.url), "utf8");
const streamSource = readFileSync(new URL("../src/stream.ts", import.meta.url), "utf8");
const adapterSource = readFileSync(new URL("../src/providers/adapter.ts", import.meta.url), "utf8");
const openAiSource = readFileSync(
  new URL("../src/providers/openai-adapter.ts", import.meta.url),
  "utf8"
);
const deepSeekSource = readFileSync(
  new URL("../src/providers/deepseek-adapter.ts", import.meta.url),
  "utf8"
);
const routingSource = readFileSync(new URL("../src/routing-policy.ts", import.meta.url), "utf8");

if (!configSource.includes("QUNTA_GATEWAY_PORT must be a valid TCP port")) {
  throw new Error("gateway config validation is missing");
}

if (authSource.includes("console.")) {
  throw new Error("auth module must not log tokens");
}

if (!streamSource.includes("usage")) {
  throw new Error("mock stream must include usage metadata");
}

if (!adapterSource.includes("ProviderAdapter")) {
  throw new Error("provider adapter interface is missing");
}

if (!openAiSource.includes("authorization: `Bearer ${apiKey}`")) {
  throw new Error("OpenAI adapter must read API key server-side");
}

if (!openAiSource.includes("mapOpenAiUsage")) {
  throw new Error("OpenAI adapter usage mapping is missing");
}

if (!deepSeekSource.includes("mapDeepSeekUsage")) {
  throw new Error("DeepSeek adapter usage mapping is missing");
}

if (deepSeekSource.includes("console.")) {
  throw new Error("DeepSeek adapter must not log provider details");
}

if (!routingSource.includes("chooseProvider")) {
  throw new Error("routing policy is missing");
}

if (routingSource.includes("desktopProvider")) {
  throw new Error("desktop must not choose providers");
}
