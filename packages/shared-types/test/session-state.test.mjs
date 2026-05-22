import { mkdtempSync, readFileSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { pathToFileURL } from "node:url";
import ts from "typescript";

const source = readFileSync(new URL("../src/session-state.ts", import.meta.url), "utf8");
const output = ts.transpileModule(source, {
  compilerOptions: { module: ts.ModuleKind.ES2022, target: ts.ScriptTarget.ES2022 }
});
const temp = mkdtempSync(join(tmpdir(), "qunta-session-state-"));
const modulePath = join(temp, "session-state.mjs");
writeFileSync(modulePath, output.outputText);

const { canTransition, isTerminalSessionStatus, transitionSession } = await import(
  pathToFileURL(modulePath).href
);

if (!canTransition("idle", "start")) {
  throw new Error("idle must transition to starting");
}

if (transitionSession({ status: "running" }, "request_approval").status !== "waiting_approval") {
  throw new Error("running must enter waiting approval");
}

if (transitionSession({ status: "completed" }, "start").status !== "completed") {
  throw new Error("terminal states must not restart");
}

if (!isTerminalSessionStatus("failed")) {
  throw new Error("failed must be terminal");
}
