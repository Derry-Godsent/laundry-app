#!/usr/bin/env node
/*
 * Generates the app icons from one square source image.
 *
 *   node scripts/make-brand-assets.mjs
 *
 * Reads `public/brand/logo.png` when the company logo has been added there, and
 * otherwise falls back to `public/brand/monogram.svg`, which is the mark the
 * app itself shows in that case. Writes the sizes a browser tab, an Android
 * home screen and an iPhone home screen ask for, then they are all one file
 * swap away from the real logo.
 *
 * Run it after replacing the source and commit the result.
 */
import { readFile, writeFile, access } from "node:fs/promises";
import { join } from "node:path";

/* Sharp is needed only to run this script, so it is not a project dependency:
   the icons it produced are committed. Install it when you need to re-run. */
let sharp;
try {
  sharp = (await import("sharp")).default;
} catch {
  console.error("This script needs sharp. Install it with:\n\n  npm i -D sharp\n");
  process.exit(1);
}

const PUBLIC = "public";
const LOGO = join(PUBLIC, "brand", "logo.png");
const MONOGRAM = join(PUBLIC, "brand", "monogram.svg");

/* Sizes the manifest and iOS ask for. A PNG is not scalable, so each size is
   rendered rather than resized: the monogram stays crisp at 32px. */
const TARGETS = [
  { file: "logo192.png", size: 192 },
  { file: "logo512.png", size: 512 },
  { file: "apple-touch-icon.png", size: 180 },
  { file: "favicon-32.png", size: 32 },
  { file: "favicon-16.png", size: 16 },
];

const exists = async (path) => {
  try { await access(path); return true; } catch { return false; }
};

const usingLogo = await exists(LOGO);
const source = usingLogo ? LOGO : MONOGRAM;
const bytes = await readFile(source);

if (!usingLogo) {
  console.log("No public/brand/logo.png, so the monogram is the source.");
  console.log("Add the company logo there and run this again to replace every icon.");
}

for (const { file, size } of TARGETS) {
  const png = await sharp(bytes, { density: 512 })
    .resize(size, size, { fit: "contain", background: { r: 0, g: 0, b: 0, alpha: 0 } })
    .png({ compressionLevel: 9 })
    .toBuffer();
  await writeFile(join(PUBLIC, file), png);
  const kb = (png.length / 1024).toFixed(1);
  console.log(`  ${file.padEnd(24)} ${size}x${size}  ${kb} kB`);
}
console.log(`\nDone. Source: ${source}`);
