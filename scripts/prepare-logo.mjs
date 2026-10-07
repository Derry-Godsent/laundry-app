/**
 * Turn the supplied artwork into the console logo.
 *
 *   node scripts/prepare-logo.mjs <path-to-supplied-image>
 *   node scripts/prepare-logo.mjs            # looks in common upload spots
 *
 * What it does, in order:
 *   1. removes a near-white background to transparency, keeping the mark's own
 *      colours untouched and keeping anti-aliased edges smooth
 *   2. trims the empty margin, then pads back to a square so the mark sits
 *      centred in every icon instead of stretched
 *   3. enlarges to 1024px if the supplied file is smaller, so the tab icon and
 *      the home screen icon stay sharp on a phone
 *   4. writes public/brand/logo.png
 *
 * Run scripts/make-brand-assets.mjs afterwards to push it through every icon.
 */
import { existsSync, readdirSync, statSync } from "node:fs";
import { resolve } from "node:path";

const sharp = (await import("sharp")).default;

const CANVAS = 1024; // square edges of the finished file
const PAD = 0.06; // breathing room around the mark, as a share of the canvas
const WHITE_HI = 246; // at or above this luminance a neutral pixel is background
const WHITE_LO = 224; // at or below this it is definitely part of the mark
const NEUTRAL = 26; // max - min channel spread still counted as "no colour"

const candidates = [
  process.argv[2],
  "/home/user/uploads/image-1.png",
  "/home/user/uploads/image.png",
  "/home/user/uploads/logo.png",
].filter(Boolean);

const source = candidates.find((p) => existsSync(p)) || findUpload();

function findUpload() {
  const dir = "/home/user/uploads";
  if (!existsSync(dir)) return undefined;
  const images = readdirSync(dir).filter((f) => /\.(png|jpe?g|webp)$/i.test(f));
  return images.length ? resolve(dir, images[0]) : undefined;
}

if (!source) {
  console.error("No image supplied. Point me at the file:");
  console.error("  node scripts/prepare-logo.mjs /path/to/logo.png");
  process.exit(1);
}

const meta = await sharp(source).metadata();
console.log(`Source: ${source} (${meta.width}x${meta.height}, ${meta.format})`);

const { data, info } = await sharp(source)
  .ensureAlpha()
  .raw()
  .toBuffer({ resolveWithObject: true });

const { width, height, channels } = info;
const out = Buffer.alloc(width * height * 4);

for (let i = 0; i < width * height; i++) {
  const r = data[i * channels];
  const g = data[i * channels + 1];
  const b = data[i * channels + 2];
  const srcA = channels === 4 ? data[i * channels + 3] : 255;

  const lum = 0.299 * r + 0.587 * g + 0.114 * b;
  const spread = Math.max(r, g, b) - Math.min(r, g, b);

  let alpha = srcA;
  if (spread <= NEUTRAL && lum >= WHITE_LO) {
    // Neutral and bright: this is paper, not paint. Ramp it out so the edge
    // of a letter keeps its smoothness instead of turning into a jagged step.
    const ramp = (WHITE_HI - lum) / (WHITE_HI - WHITE_LO);
    alpha = Math.round(srcA * Math.min(1, Math.max(0, ramp)));
  }

  // A half-transparent edge pixel still holds the white it was blended with.
  // Take that blend back out, or the mark ends up haloed on a dark surface.
  let rr = r;
  let gg = g;
  let bb = b;
  if (alpha > 0 && alpha < 255) {
    const a = alpha / 255;
    rr = clamp((r - 255 * (1 - a)) / a);
    gg = clamp((g - 255 * (1 - a)) / a);
    bb = clamp((b - 255 * (1 - a)) / a);
  }

  out[i * 4] = rr;
  out[i * 4 + 1] = gg;
  out[i * 4 + 2] = bb;
  out[i * 4 + 3] = alpha;
}

function clamp(v) {
  return Math.max(0, Math.min(255, Math.round(v)));
}

const cut = await sharp(out, { raw: { width, height, channels: 4 } })
  .trim({ threshold: 1 })
  .png()
  .toBuffer({ resolveWithObject: true });

const inner = Math.round(CANVAS * (1 - PAD * 2));
const scale = Math.min(inner / cut.info.width, inner / cut.info.height);

const resized = await sharp(cut.data)
  .resize({
    width: Math.max(1, Math.round(cut.info.width * scale)),
    height: Math.max(1, Math.round(cut.info.height * scale)),
    kernel: "lanczos3",
    fit: "fill",
  })
  .png({ compressionLevel: 9 })
  .toBuffer();

const target = process.env.LOGO_OUT || "public/brand/logo.png";
await sharp({
  create: {
    width: CANVAS,
    height: CANVAS,
    channels: 4,
    background: { r: 0, g: 0, b: 0, alpha: 0 },
  },
})
  .composite([{ input: resized, gravity: "center" }])
  .png({ compressionLevel: 9 })
  .toFile(target);

const done = await sharp(target).metadata();
const kb = (statSync(target).size / 1024).toFixed(1);
console.log(`Wrote ${target}: ${done.width}x${done.height}, alpha ${done.hasAlpha}, ${kb} kB`);
console.log("Now run: node scripts/make-brand-assets.mjs");
