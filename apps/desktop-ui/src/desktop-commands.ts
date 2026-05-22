import { invoke } from "@tauri-apps/api/core";

export interface DesktopProjectMetadata {
  readonly id: string;
  readonly name: string;
  readonly path: string;
  readonly isGitRepository: boolean;
}

export interface DesktopWorkspaceSummary {
  readonly root: string;
  readonly name: string;
  readonly languages: readonly string[];
  readonly packageManagers: readonly string[];
  readonly testCommands: readonly string[];
  readonly gitState: "clean" | "dirty" | "notRepository" | "unknown";
  readonly ignoredEntries: readonly string[];
}

export function validateProjectPath(path: string): Promise<DesktopProjectMetadata> {
  return invoke<DesktopProjectMetadata>("desktop_validate_project_path", { path });
}

export function scanWorkspace(path: string): Promise<DesktopWorkspaceSummary> {
  return invoke<DesktopWorkspaceSummary>("desktop_scan_workspace", { path });
}
