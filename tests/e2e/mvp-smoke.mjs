import assert from "node:assert/strict";
import { mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";

const workspace = mkdtempSync(join(tmpdir(), "qunta-e2e-"));

try {
  writeFileSync(join(workspace, "package.json"), JSON.stringify({ scripts: { test: "node ok" } }));
  writeFileSync(join(workspace, "pnpm-lock.yaml"), "");

  const flow = [];
  flow.push(login());
  flow.push(selectProject(workspace));
  flow.push(sendPrompt("Add a harmless README note"));
  flow.push(streamRunnerEvent("thinking"));
  flow.push(previewPatch("README.md"));
  flow.push(approveCommand("pnpm test"));
  flow.push(queueVerification("pnpm test", workspace));

  assert.deepEqual(flow.map((step) => step.name), [
    "login",
    "project",
    "prompt",
    "event",
    "patch",
    "approval",
    "verification"
  ]);
  assert.equal(flow.at(-1)?.cwd, workspace);
  assert.ok(flow.every((step) => !/openai|deepseek|provider key/i.test(JSON.stringify(step))));
} finally {
  rmSync(workspace, { force: true, recursive: true });
}

function login() {
  return {
    accountId: "acct_dev",
    name: "login",
    token: "qat_masked"
  };
}

function selectProject(path) {
  return {
    hasGit: false,
    name: "project",
    path
  };
}

function sendPrompt(prompt) {
  return {
    name: "prompt",
    prompt
  };
}

function streamRunnerEvent(type) {
  return {
    name: "event",
    type
  };
}

function previewPatch(path) {
  return {
    action: "preview",
    name: "patch",
    path
  };
}

function approveCommand(command) {
  return {
    command,
    name: "approval",
    risk: "medium"
  };
}

function queueVerification(command, cwd) {
  return {
    command,
    cwd,
    name: "verification"
  };
}
