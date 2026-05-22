import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

const here = dirname(fileURLToPath(import.meta.url));
const source = readFileSync(join(here, "../src/PromptComposer.tsx"), "utf8");
const timeline = readFileSync(join(here, "../src/AgentTimeline.tsx"), "utf8");
const fileTree = readFileSync(join(here, "../src/FileTree.tsx"), "utf8");
const diffViewer = readFileSync(join(here, "../src/DiffViewer.tsx"), "utf8");
const terminal = readFileSync(join(here, "../src/TerminalLogPanel.tsx"), "utf8");
const runner = readFileSync(join(here, "../src/useMockRunner.ts"), "utf8");
const verification = readFileSync(join(here, "../src/VerificationCommands.tsx"), "utf8");
const gitCheckpoint = readFileSync(join(here, "../src/GitCheckpointView.tsx"), "utf8");
const settings = readFileSync(join(here, "../src/SettingsPanel.tsx"), "utf8");
const runnerConfig = readFileSync(join(here, "../src/runner-config.ts"), "utf8");

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

if (!fileTree.includes("deniedPatterns") || !fileTree.includes("filterVisibleEntries")) {
  throw new Error("File tree must filter denied paths.");
}

for (const token of ["truncateDiff", "Copy Path", "Apply Accepted", "Accept", "Reject"]) {
  if (!diffViewer.includes(token)) {
    throw new Error(`Diff viewer is missing ${token}.`);
  }
}

for (const token of ["maskTerminalLine", "Pause", "Clear", "Search logs"]) {
  if (!terminal.includes(token)) {
    throw new Error(`Terminal panel is missing ${token}.`);
  }
}

for (const token of ["clearTimeout", "transitionSession", "cancel"]) {
  if (!runner.includes(token)) {
    throw new Error(`Mock runner is missing ${token}.`);
  }
}

if (!verification.includes("Approve Run") || !verification.includes("cwd")) {
  throw new Error("Verification commands must require project cwd approval.");
}

for (const token of ["Mark Checkpoint", "changedFiles", "branch"]) {
  if (!gitCheckpoint.includes(token)) {
    throw new Error(`Git checkpoint view is missing ${token}.`);
  }
}

for (const token of ["projectPermissionModes", "Telemetry", "Privacy mode", "Reset Trusted Commands"]) {
  if (!settings.includes(token)) {
    throw new Error(`Settings panel is missing ${token}.`);
  }
}

for (const token of ["buildRunnerConfig", "approvalMode", "projectId"]) {
  if (!runnerConfig.includes(token)) {
    throw new Error(`Runner config is missing ${token}.`);
  }
}

if (/openai|deepseek|provider/i.test(settings)) {
  throw new Error("Settings panel must not expose provider internals.");
}
