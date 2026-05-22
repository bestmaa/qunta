import { readdirSync, readFileSync, statSync } from "node:fs";
import { join } from "node:path";

const roots = ["docs", "."];
const issues = [];

function checkFile(path) {
  const text = readFileSync(path, "utf8");
  if (text.includes("<<<<<<<") || text.includes(">>>>>>>")) {
    issues.push(`${path} contains conflict markers`);
  }
  for (const [index, line] of text.split(/\r?\n/).entries()) {
    if (/\s+$/.test(line)) issues.push(`${path}:${index + 1} trailing whitespace`);
  }
}

function walk(dir) {
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    if (["node_modules", "target", ".git"].includes(entry.name)) continue;
    const path = join(dir, entry.name);
    if (entry.isDirectory() && dir !== ".") walk(path);
    if (entry.isFile() && entry.name.endsWith(".md")) checkFile(path);
  }
}

for (const root of roots) {
  try {
    if (statSync(root).isDirectory()) walk(root);
  } catch {
    // Missing docs are allowed before documentation tasks run.
  }
}

if (issues.length) {
  console.error(issues.join("\n"));
  process.exit(1);
}
