import { existsSync } from "node:fs";

const required = [
  "Cargo.toml",
  "package.json",
  "pnpm-workspace.yaml",
  "tsconfig.base.json",
  "docs/product-requirements.md",
  "docs/architecture.md",
  "docs/repo-layout.md",
  "docs/coding-standards.md",
  "docs/security-threat-model.md"
];

const missing = required.filter((path) => !existsSync(path));

if (missing.length) {
  console.error(`Missing workspace files:\n${missing.join("\n")}`);
  process.exit(1);
}
