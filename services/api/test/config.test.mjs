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

const authRoutes = readFileSync(new URL("../src/auth-routes.ts", import.meta.url), "utf8");
if (!authRoutes.includes("/v1/auth/device/start")) {
  throw new Error("auth start route is missing");
}

const accountRoutes = readFileSync(new URL("../src/account-routes.ts", import.meta.url), "utf8");
if (!accountRoutes.includes("/v1/account/usage")) {
  throw new Error("account usage route is missing");
}

execFileSync("node", ["--version"], { stdio: "ignore" });
