#!/usr/bin/env node
/**
 * Copy guard: no em dashes in this repository.
 *
 * An em dash is the long dash character (U+2014). House rule for this project:
 * use a full stop, a colon, a comma or a middot separator instead, and use a
 * plain hyphen for "no value" placeholders.
 *
 * Run: npm run check:copy
 */
import { readFileSync } from "node:fs";
import { readdirSync, statSync } from "node:fs";
import { join, relative } from "node:path";

const ROOT = process.cwd();
const EM_DASH = "\u2014";
const SKIP_DIRS = new Set([
  "node_modules", ".git", "dist", "build", "coverage", ".vite",
  "android", "ios", ".expo",
]);
const CHECK_EXT = new Set([
  ".ts", ".tsx", ".js", ".jsx", ".mjs", ".cjs", ".css", ".scss",
  ".md", ".mdx", ".html", ".json", ".sql", ".yml", ".yaml",
]);
const SKIP_FILES = new Set(["package-lock.json", "bun.lockb"]);

function walk(dir, found) {
  for (const entry of readdirSync(dir)) {
    if (SKIP_DIRS.has(entry)) continue;
    const full = join(dir, entry);
    const stats = statSync(full);
    if (stats.isDirectory()) {
      walk(full, found);
      continue;
    }
    if (SKIP_FILES.has(entry)) continue;
    const dot = entry.lastIndexOf(".");
    if (dot === -1 || !CHECK_EXT.has(entry.slice(dot))) continue;

    const text = readFileSync(full, "utf8");
    if (!text.includes(EM_DASH)) continue;

    text.split("\n").forEach((line, index) => {
      if (line.includes(EM_DASH)) {
        found.push(`${relative(ROOT, full)}:${index + 1}: ${line.trim().slice(0, 120)}`);
      }
    });
  }
}

const found = [];
walk(ROOT, found);

if (found.length === 0) {
  console.log("check:copy passed. No em dashes found.");
  process.exit(0);
}

console.error(`check:copy failed. ${found.length} line(s) contain an em dash (U+2014):\n`);
for (const line of found) console.error(`  ${line}`);
console.error("\nUse a full stop, colon, comma or middot instead.");
process.exit(1);
