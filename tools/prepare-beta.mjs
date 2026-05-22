import { existsSync, readFileSync } from "node:fs";

const requiredFiles = [
  "dist/packages/desktop-package-manifest.json",
  "docs/private-beta-release-notes.md",
  "docs/private-beta-checklist.md",
  "docs/llm-gateway-contract.md",
  "docs/workspace-safety.md"
];

const missing = requiredFiles.filter((path) => !existsSync(path));
if (missing.length) {
  throw new Error(`Private beta is missing files:\n${missing.join("\n")}`);
}

const notes = readFileSync("docs/private-beta-release-notes.md", "utf8");
const checklist = readFileSync("docs/private-beta-checklist.md", "utf8");
const gateway = readFileSync("docs/llm-gateway-contract.md", "utf8");

for (const token of ["Known Limitations", "Provider routing is server-side"]) {
  if (!notes.includes(token)) {
    throw new Error(`Release notes must include ${token}.`);
  }
}

for (const token of ["Full checks", "Shell approvals", "Maintainer approval"]) {
  if (!checklist.includes(token)) {
    throw new Error(`Beta checklist must include ${token}.`);
  }
}

if (/desktop.*provider key/i.test(gateway)) {
  throw new Error("Gateway docs suggest desktop provider key exposure.");
}

console.log("private beta readiness checks passed");
