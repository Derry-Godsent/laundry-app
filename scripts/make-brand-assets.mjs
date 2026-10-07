#!/usr/bin/env node
/*
 * Generates every icon the product uses from one source image.
 *
 *   node scripts/make-brand-assets.mjs
 *
 * Reads `public/brand/logo.png` (put it there with scripts/prepare-logo.mjs) and
 * falls back to `public/brand/monogram.svg` when there is no logo, so the
 * script always produces a complete, correct set.
 *
 * Two rules, learned from the supplied artwork:
 *
 *   1. The supplied logo is 99 pixels wide and its three letters take about
 *      twelve of them. At 16 and 32 pixels the letters are under two pixels
 *      each and read as a smudge, so the small favicons use the drawn monogram,
 *      which is legible down to 16px.
 *   2. The logo is navy, and a launcher or a home screen can be any colour, so
 *      every icon that carries the artwork carries it on a light plate. A
 *      transparent navy mark would vanish on a dark home screen.
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

const FIELD = { r: 255, g: 255, b: 255 }; // the plate the logo was drawn on
const MONOGRAM_FIELD = { r: 36, g: 80, b: 110 }; // --brand-700, the tile navy
const INNER = 0.78; // the mark's share of the plate, leaving air around it

const exists = async (path) => {
  try { await access(path); return true; } catch { return false; }
};

const usingLogo = await exists(LOGO);
const logoBytes = usingLogo ? await readFile(LOGO) : null;
const monogramBytes = await readFile(MONOGRAM);

const mark = async (size) =>
  sharp(usingLogo ? logoBytes : monogramBytes, { density: 512 })
    .resize(Math.round(size * INNER), Math.round(size * INNER), { fit: "contain", background: { r: 0, g: 0, b: 0, alpha: 0 } })
    .png()
    .toBuffer();

/* A mark on a plate, or the monogram's own rounded tile with its transparent
   corners, which is what a favicon wants. */
const onPlate = async (size, field) => {
  const inner = await mark(size);
  return sharp({ create: { width: size, height: size, channels: 4, background: { ...field, alpha: 1 } } })
    .composite([{ input: inner, gravity: "center" }])
    .png({ compressionLevel: 9, effort: 10 })
    .toBuffer();
};

const tile = async (size) =>
  sharp(monogramBytes, { density: 512 })
    .resize(size, size, { fit: "contain", background: { r: 0, g: 0, b: 0, alpha: 0 } })
    .png({ compressionLevel: 9, effort: 10 })
    .toBuffer();

/* Small sizes: always the drawn monogram, whatever the source is. */
const SMALL = [
  { file: "public/favicon-16.png", size: 16 },
  { file: "public/favicon-32.png", size: 32 },
  { file: "mobile/assets/favicon.png", size: 48 },
];

/* Everything else: the artwork when there is one, on its light plate. */
const PLATED = [
  { file: "public/logo192.png", size: 192 },
  { file: "public/logo512.png", size: 512 },
  { file: "public/apple-touch-icon.png", size: 180 },
  { file: "mobile/assets/icon.png", size: 1024 },
  { file: "mobile/assets/adaptive-icon.png", size: 1024 },
  { file: "mobile/assets/splash-icon.png", size: 512 },
];

/* The app's in-app mark sits on its own light surface, so it stays transparent
   and is not boxed into a plate inside the app. */
const IN_APP = [{ file: "mobile/assets/logo.png", size: 512 }];

if (!usingLogo) {
  console.log("No public/brand/logo.png, so the monogram is the source for all of it.");
  console.log("Add the company logo there and run this again to replace every icon.");
}

for (const { file, size } of SMALL) {
  const png = await tile(size);
  await writeFile(file, png);
  console.log(`  ${file.padEnd(34)} ${size}x${size}  ${(png.length / 1024).toFixed(1)} kB   monogram`);
}

for (const { file, size } of PLATED) {
  const png = await onPlate(size, usingLogo ? FIELD : MONOGRAM_FIELD);
  await writeFile(file, png);
  console.log(`  ${file.padEnd(34)} ${size}x${size}  ${(png.length / 1024).toFixed(1)} kB   ${usingLogo ? "logo on light plate" : "monogram tile"}`);
}

for (const { file, size } of IN_APP) {
  const png = await sharp(usingLogo ? logoBytes : monogramBytes, { density: 512 })
    .resize(size, size, { fit: "contain", background: { r: 0, g: 0, b: 0, alpha: 0 } })
    .png({ compressionLevel: 9, effort: 10 })
    .toBuffer();
  await writeFile(file, png);
  console.log(`  ${file.padEnd(34)} ${size}x${size}  ${(png.length / 1024).toFixed(1)} kB   transparent`);
}

console.log(`\nDone. Source: ${usingLogo ? LOGO : MONOGRAM}`);
