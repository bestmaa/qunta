export type ProjectId = string & { readonly __brand: "ProjectId" };

export type ProjectLanguage =
  | "go"
  | "javascript"
  | "python"
  | "rust"
  | "typescript"
  | "unknown";

export interface RecentProject {
  readonly id: ProjectId;
  readonly lastOpenedAt: string;
  readonly name: string;
  readonly path: string;
}

export interface ProjectSummary {
  readonly deniedPathCount: number;
  readonly detectedLanguage: ProjectLanguage;
  readonly hasGit: boolean;
  readonly name: string;
  readonly packageManager?: "bun" | "cargo" | "npm" | "pnpm" | "yarn";
  readonly path: string;
  readonly testCommands: readonly string[];
}
