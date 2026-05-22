import type { AgentTimelineEvent } from "./AgentTimeline.js";
import type { DiffFile } from "./DiffViewer.js";
import type { FileTreeEntry } from "./FileTree.js";
import type { TerminalCommandGroup } from "./TerminalLogPanel.js";

export const mockEvents: readonly AgentTimelineEvent[] = [
  { id: "evt-1", title: "Prepared project context", type: "thinking" },
  { id: "evt-2", title: "Read package metadata", type: "file_read", detail: "package.json" },
  {
    id: "evt-3",
    title: "Requested verification command",
    type: "command_request",
    detail: "pnpm test"
  },
  { id: "evt-4", title: "Verification ready", type: "test_result", detail: "No command has run yet." }
];

export const mockFiles: readonly FileTreeEntry[] = [
  { path: "package.json", status: "modified" },
  { path: "src/App.tsx", status: "modified" },
  { path: "src/PromptComposer.tsx", status: "added" },
  { path: ".env", status: "unchanged" },
  { path: "node_modules/react/index.js", status: "unchanged" }
];

export const mockDiffs: readonly DiffFile[] = [
  {
    path: "src/PromptComposer.tsx",
    status: "added",
    hunks: ["+export function PromptComposer() {", "+  return <textarea />;", "+}"]
  },
  {
    path: "src/App.tsx",
    status: "modified",
    hunks: ["-<div className=\"session-placeholder\" />", "+<DiffViewer files={mockDiffs} />"]
  },
  {
    path: "old-agent-notes.md",
    status: "deleted",
    hunks: ["-temporary notes", "-remove before beta"]
  }
];

export const mockTerminalGroups: readonly TerminalCommandGroup[] = [
  {
    command: "pnpm test",
    cwd: "/workspace/qunta",
    lines: ["$ pnpm test", "packages/ui ok", "token=hidden-value", "desktop-ui ok"]
  }
];
