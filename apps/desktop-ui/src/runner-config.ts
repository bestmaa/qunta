import type { DesktopProjectMetadata } from "./desktop-commands.js";

export type ApprovalMode = "auto_edit" | "controlled_full" | "suggest";

export interface RunnerConfig {
  readonly approvalMode: ApprovalMode;
  readonly projectId: string | null;
}

export function buildRunnerConfig(
  project: DesktopProjectMetadata | null,
  approvalMode: ApprovalMode
): RunnerConfig {
  return {
    approvalMode,
    projectId: project?.id ?? null
  };
}

export function approvalModeLabel(mode: ApprovalMode): string {
  if (mode === "auto_edit") return "Auto edit";
  if (mode === "controlled_full") return "Controlled full";
  return "Suggest";
}
