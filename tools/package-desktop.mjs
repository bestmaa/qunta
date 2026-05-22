import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";

const tauriConfig = JSON.parse(readFileSync("apps/desktop/src-tauri/tauri.conf.json", "utf8"));
const outputDir = join("dist", "packages");
const manifestPath = join(outputDir, "desktop-package-manifest.json");
const targets = normalizeTargets(tauriConfig.bundle?.targets);

if (!tauriConfig.bundle?.active) {
  throw new Error("Desktop bundle must be active before packaging.");
}

if (!tauriConfig.identifier && !tauriConfig.productName) {
  throw new Error("Desktop package metadata is incomplete.");
}

const manifest = {
  app: tauriConfig.productName,
  identifier: tauriConfig.identifier,
  sidecar: "codex binary resolved by documented sidecar strategy",
  signing: "placeholder until release keys exist",
  targets,
  version: tauriConfig.version
};

const serialized = JSON.stringify(manifest, null, 2);
if (/sk-|qgt_|OPENAI_API_KEY|DEEPSEEK_API_KEY/i.test(serialized)) {
  throw new Error("Package manifest contains secret-like values.");
}

mkdirSync(outputDir, { recursive: true });
writeFileSync(manifestPath, `${serialized}\n`);
console.log(`desktop package smoke manifest: ${manifestPath}`);

function normalizeTargets(value) {
  if (Array.isArray(value)) return value;
  if (typeof value === "string" && value === "all") return ["windows", "macos", "linux"];
  if (typeof value === "string") return [value];
  return [];
}
