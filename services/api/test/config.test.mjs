import { execFileSync } from "node:child_process";
import { readFileSync } from "node:fs";

const configSource = readFileSync(new URL("../src/config.ts", import.meta.url), "utf8");
const serverSource = readFileSync(new URL("../src/server.ts", import.meta.url), "utf8");

if (!configSource.includes("QUNTA_API_PORT must be a valid TCP port")) {
  throw new Error("config validation message is missing");
}

if (!serverSource.includes("/health")) {
  throw new Error("health route is missing");
}

execFileSync("node", ["--version"], { stdio: "ignore" });
