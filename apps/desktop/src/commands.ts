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
  readonly os: string;
  readonly paths: DesktopPaths;
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
