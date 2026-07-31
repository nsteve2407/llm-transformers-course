// scripts/build_chat_context.mjs
import { readdirSync, readFileSync, writeFileSync, mkdirSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const repoRoot = join(__dirname, "..");
const modulesDir = join(repoRoot, "modules");
const outDir = join(repoRoot, "worker", "src", "context");
const outFile = join(outDir, "modules.json");

function stripFrontMatterAndLiquid(raw) {
  const withoutFrontMatter = raw.replace(/^---[\s\S]*?---\n/, "");
  return withoutFrontMatter
    .replace(/{%[\s\S]*?%}/g, "")
    .replace(/{{[\s\S]*?}}/g, "")
    .trim();
}

function extractTitle(raw) {
  const match = raw.match(/^title:\s*"?(.*?)"?\s*$/m);
  return match ? match[1] : "Untitled Module";
}

function buildContext() {
  const context = {};
  const slugs = readdirSync(modulesDir, { withFileTypes: true })
    .filter((entry) => entry.isDirectory())
    .map((entry) => entry.name);

  for (const slug of slugs) {
    const indexPath = join(modulesDir, slug, "index.md");
    const raw = readFileSync(indexPath, "utf-8");
    context[slug] = {
      title: extractTitle(raw),
      content: stripFrontMatterAndLiquid(raw),
    };
  }

  mkdirSync(outDir, { recursive: true });
  writeFileSync(outFile, JSON.stringify(context, null, 2));
  console.log(`Wrote context for ${slugs.length} module(s) to ${outFile}`);
}

buildContext();
