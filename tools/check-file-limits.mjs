import { readdirSync, readFileSync, statSync } from "node:fs";
import { join } from "node:path";

const roots = ["apps", "crates", "docs", "packages", "services", "tools"];
const codeExts = new Set([".js", ".jsx", ".mjs", ".rs", ".ts", ".tsx"]);
const limit = 250;
const issues = [];

function walk(dir) {
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    if (["node_modules", "target", "dist", "build"].includes(entry.name)) continue;
    const path = join(dir, entry.name);
    if (entry.isDirectory()) {
      walk(path);
      continue;
    }
    const ext = entry.name.slice(entry.name.lastIndexOf("."));
    if (!codeExts.has(ext)) continue;
    const lines = readFileSync(path, "utf8").split(/\r?\n/).length;
    if (lines > limit) issues.push(`${path} has ${lines} lines`);
  }
}

for (const root of roots) {
  try {
    if (statSync(root).isDirectory()) walk(root);
  } catch {
    // Missing roots are expected early in the scaffold.
  }
}

if (issues.length) {
  console.error(issues.join("\n"));
  process.exit(1);
}
