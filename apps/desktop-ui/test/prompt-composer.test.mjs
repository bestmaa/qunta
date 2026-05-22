import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

const here = dirname(fileURLToPath(import.meta.url));
const source = readFileSync(join(here, "../src/PromptComposer.tsx"), "utf8");
const timeline = readFileSync(join(here, "../src/AgentTimeline.tsx"), "utf8");

if (!source.includes("canSubmitPrompt")) {
  throw new Error("Prompt composer must export validation logic.");
}

if (!source.includes("metaKey || event.ctrlKey") || !source.includes("Enter")) {
  throw new Error("Prompt composer must support keyboard submit.");
}

if (/openai|deepseek|provider|model/i.test(source)) {
  throw new Error("Prompt composer must not expose provider or model names.");
}

if (!timeline.includes("maskSecretText") || !timeline.includes("Bearer ***")) {
  throw new Error("Timeline must mask secret-like event payloads.");
}
