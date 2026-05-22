import { readFileSync } from "node:fs";

const source = readFileSync(new URL("../src/index.ts", import.meta.url), "utf8");

const requiredExports = [
  "Button",
  "Panel",
  "StatusBadge",
  "WorkspaceLayout",
  "themeTokens"
];

const missing = requiredExports.filter((name) => !source.includes(name));

if (missing.length) {
  console.error(`Missing UI exports: ${missing.join(", ")}`);
  process.exit(1);
}
