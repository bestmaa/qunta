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

export interface DesktopGitChangedFile {
  readonly path: string;
  readonly status: "added" | "changed" | "deleted" | "modified" | "untracked";
}

export interface DesktopGitCheckpoint {
  readonly id: string;
  readonly label: string;
  readonly createdAtUnix: number;
}

export interface DesktopGitStatusSnapshot {
  readonly root: string;
  readonly branch: string;
  readonly isDirty: boolean;
  readonly changedFiles: readonly DesktopGitChangedFile[];
  readonly checkpoint: DesktopGitCheckpoint;
}

export interface DesktopDiagnosticsBundle {
  readonly appVersion: string;
  readonly configSummary: string;
  readonly maskedLogs: readonly string[];
  readonly os: string;
  readonly privacyMode: boolean;
  readonly recentErrors: readonly string[];
  readonly runnerVersion: string;
}

export function validateProjectPath(path: string): Promise<DesktopProjectMetadata> {
  return invoke<DesktopProjectMetadata>("desktop_validate_project_path", { path });
}

export function scanWorkspace(path: string): Promise<DesktopWorkspaceSummary> {
  return invoke<DesktopWorkspaceSummary>("desktop_scan_workspace", { path });
}

export function getGitStatus(path: string): Promise<DesktopGitStatusSnapshot> {
  return invoke<DesktopGitStatusSnapshot>("desktop_git_status", { path });
}

export function exportDiagnosticsBundle(privacyMode: boolean): Promise<DesktopDiagnosticsBundle> {
  return invoke<DesktopDiagnosticsBundle>("desktop_export_diagnostics_bundle", { privacyMode });
}
