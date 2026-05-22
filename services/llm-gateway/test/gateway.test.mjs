import { readFileSync } from "node:fs";

const configSource = readFileSync(new URL("../src/config.ts", import.meta.url), "utf8");
const authSource = readFileSync(new URL("../src/auth.ts", import.meta.url), "utf8");
const streamSource = readFileSync(new URL("../src/stream.ts", import.meta.url), "utf8");
const adapterSource = readFileSync(new URL("../src/providers/adapter.ts", import.meta.url), "utf8");
const openAiSource = readFileSync(
  new URL("../src/providers/openai-adapter.ts", import.meta.url),
  "utf8"
);

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
