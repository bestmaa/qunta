import { invoke } from "@tauri-apps/api/core";

export interface DesktopHealth {
  readonly name: string;
  readonly status: "ok";
  readonly version: string;
}

export function getDesktopHealth(): Promise<DesktopHealth> {
  return invoke<DesktopHealth>("desktop_health");
}
