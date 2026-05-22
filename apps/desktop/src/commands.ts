import { invoke } from "@tauri-apps/api/core";

export interface DesktopHealth {
  readonly name: string;
  readonly status: "ok";
  readonly version: string;
}

export interface DesktopAppInfo {
  readonly identifier: string;
  readonly name: string;
  readonly version: string;
}

export interface DesktopPaths {
  readonly currentDir: string;
  readonly tempDir: string;
}

export interface DesktopDiagnostics {
  readonly app: DesktopAppInfo;
  readonly codex: DesktopCodexSidecarDiagnostics;
  readonly os: string;
  readonly paths: DesktopPaths;
}

export interface DesktopCodexSidecarDiagnostics {
  readonly ready: boolean;
  readonly message: string;
  readonly requiredVersion: string;
  readonly detectedVersion: string | null;
  readonly path: string | null;
  readonly source: "devOverride" | "bundled" | null;
}

export interface DesktopProjectMetadata {
  readonly id: string;
  readonly name: string;
  readonly path: string;
  readonly isGitRepository: boolean;
}

export function getDesktopAppInfo(): Promise<DesktopAppInfo> {
  return invoke<DesktopAppInfo>("desktop_app_info");
}

export function getDesktopHealth(): Promise<DesktopHealth> {
  return invoke<DesktopHealth>("desktop_health");
}

export function getDesktopPaths(): Promise<DesktopPaths> {
  return invoke<DesktopPaths>("desktop_paths");
}

export function getDesktopDiagnostics(): Promise<DesktopDiagnostics> {
  return invoke<DesktopDiagnostics>("desktop_diagnostics");
}

export function getCodexSidecarDiagnostics(): Promise<DesktopCodexSidecarDiagnostics> {
  return invoke<DesktopCodexSidecarDiagnostics>("desktop_codex_sidecar_diagnostics");
}

export function validateProjectPath(path: string): Promise<DesktopProjectMetadata> {
  return invoke<DesktopProjectMetadata>("desktop_validate_project_path", { path });
}
