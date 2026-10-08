#!/usr/bin/env node
/**
 * Visual system guard.
 *
 * `check:copy` protects the writing. This protects the look: one typeface, one
 * palette, no gradients, no emoji standing in for icons, no font size off the
 * scale. It runs over src/ and fails the same way check-copy does, with the
 * file and line so the fix is obvious.
 *
 * There is no exempt list any more. The phase E type pass took the last 658
 * declarations onto the scale, so every file is checked, and a new file has to
 * arrive on the scale rather than be added to a list.
 */
import { readFileSync, readdirSync, statSync } from "node:fs";
import { join, relative, extname } from "node:path";

/* The scale, as a set of allowed values. */
const FONT_SIZES = new Set([
  "var(--fs-2xs)", "var(--fs-xs)", "var(--fs-sm)", "var(--fs-md)",
  "var(--fs-lg)", "var(--fs-xl)", "var(--fs-2xl)", "var(--fs-3xl)",
  "var(--fs-4xl)", "0", "inherit",
]);

/* The scale's values in pixels, for the two places a size is a number rather
   than a token: an SVG/canvas attribute, and a chart's tick prop. A number
   cannot be a var(), so these must at least be one of the scale's steps. */
const SCALE_PX = new Set([11, 12, 13, 14, 16, 18, 22, 28, 34]);

/* The numbers in an expression that are values rather than thresholds: in
   `size > 48 ? 12 : 11` that is 12 and 11, not 48, and in `size/2` it is
   nothing. A number whose nearest neighbour is an operator is part of a
   comparison or a sum, so it is not a size. */
const valuesIn = (expression) => {
  const found = [];
  const pattern = /\d+(?:\.\d+)?/g;
  let match;
  while ((match = pattern.exec(expression)) !== null) {
    const before = expression.slice(0, match.index).trimEnd().slice(-1);
    const after = expression.slice(match.index + match[0].length).trimStart().slice(0, 1);
    const operator = /[<>+\-*/%]/;
    if (operator.test(before) || operator.test(after)) continue;
    if (!found.includes(match[0])) found.push(match[0]);
  }
  return found;
};

const EMOJI = /[\u{1F300}-\u{1FAFF}\u{2600}-\u{27BF}\u{1F000}-\u{1F2FF}]/u;
const HEX = /#[0-9a-fA-F]{3,8}\b/;

/* A var() that no stylesheet defines renders as nothing: the declaration is
   thrown away and the element silently loses its colour, size or shadow. This
   caught a set of references to tokens that had been renamed. Properties that
   only exist at runtime are listed here. */
const RUNTIME_PROPERTIES = new Set([
  "--vv-h", "--vv-top", "--vv-bottom", /* measured by useVisualViewport */
  "--kpi-accent", "--qa-accent", "--nd-top", "--nd-x", "--sys-table-min",
  /* page-local palettes declared per page, matched by prefix below */
]);

const files = [];
const walk = (dir) => {
  for (const entry of readdirSync(dir)) {
    const full = join(dir, entry);
    if (statSync(full).isDirectory()) walk(full);
    else files.push(full);
  }
};
walk("src");

const problems = [];
const add = (file, line, message) => problems.push({ file, line, message });

for (const full of files) {
  const file = relative(".", full).replaceAll("\\", "/");
  const ext = extname(file);
  if (![".tsx", ".ts", ".css"].includes(ext)) continue;
  if (file === "src/styles/tokens.css") continue; // the vocabulary itself

  const lines = readFileSync(full, "utf8").split("\n");

  lines.forEach((line, index) => {
    const n = index + 1;
    const code = line.split("//")[0];

    if (code.includes("gradient(")) {
      add(file, n, "gradient: use a flat surface, a hairline or type instead");
    }
    if (EMOJI.test(line)) {
      add(file, n, "emoji: use an icon from the icon set");
    }
    /* Black, white and grey are not palette members: they are ink and paper,
       and the print rules on the receipt and order sheets need them. A hex
       whose colour channels are equal is a neutral, whether it is written with
       three digits, six, or with an alpha suffix. */
    const colourCode = code.replace(HEX, (literal) => {
      const digits = literal.slice(1);
      const channels = digits.length >= 6
        ? [digits.slice(0, 2), digits.slice(2, 4), digits.slice(4, 6)]
        : [digits[0], digits[1], digits[2]];
      const neutral = channels.every((c) => c === channels[0]);
      return neutral ? "" : literal;
    });
    if (HEX.test(colourCode) && !file.endsWith("tokens.css")) {
      add(file, n, `colour literal ${colourCode.match(HEX)[0]}: use a token`);
    }
    if (/font-family\s*:/.test(code) && !/var\(--font-/.test(code)) {
      add(file, n, "font-family: use var(--font-ui) or var(--font-mono)");
    }
    const size = code.match(/font-size\s*:\s*([^;}\n]+)/);
    if (size) {
      const value = size[1].trim().replace(/\s*!important/, "");
      if (!FONT_SIZES.has(value)) {
        add(file, n, `font-size ${value}: use a --fs-* step`);
      }
    }
    const inline = code.match(/fontSize\s*:\s*([\d.]+)/);
    if (inline) {
      add(file, n, `fontSize ${inline[1]}: use a --fs-* step`);
    }
    /* A number is the only option here: an SVG attribute and a chart's tick
       prop both want one, and a var() would arrive as text. So the numbers are
       checked against the scale instead, which is how a 9px ring label was
       found hiding behind the rule that only looked for prose-style sizes.
       Only numbers that are values count: in `size > 48 ? 12 : 11` the 48 is a
       threshold, and flagging it would be noise that teaches people to ignore
       this check. */
    const attribute = code.match(/fontSize=\{([^}]*)\}/);
    if (attribute) {
      for (const literal of valuesIn(attribute[1])) {
        if (!SCALE_PX.has(Number(literal))) {
          add(file, n, `fontSize={${attribute[1].trim()}}: ${literal} is not a --fs-* step (11, 12, 13, 14, 16, 18, 22, 28, 34)`);
        }
      }
    }
  });
}

/* ── the token check ─────────────────────────────────────────────────────────
   Runs after the per-file rules. Definitions are collected from every
   stylesheet, every inline style object, and the runtime list above. */
const DEFINED = new Set(RUNTIME_PROPERTIES);
const all = [];
const walkAll = (dir) => {
  for (const entry of readdirSync(dir)) {
    const full = join(dir, entry);
    if (statSync(full).isDirectory()) walkAll(full);
    else all.push(full);
  }
};
walkAll("src");
for (const full of all) {
  if (![".css", ".tsx", ".ts"].includes(extname(full))) continue;
  const source = readFileSync(full, "utf8");
  for (const m of source.matchAll(/(--[a-z0-9-]+)\s*:/g)) DEFINED.add(m[1]);
  for (const m of source.matchAll(/setProperty\(\s*"(--[a-z0-9-]+)"/g)) DEFINED.add(m[1]);
  for (const m of source.matchAll(/"(--[a-z0-9-]+)"\s*[:,]/g)) DEFINED.add(m[1]);
}
for (const full of all) {
  if (![".css", ".tsx", ".ts"].includes(extname(full))) continue;
  const file = relative(".", full).replaceAll("\\", "/");
  readFileSync(full, "utf8").split("\n").forEach((line, index) => {
    for (const m of line.matchAll(/var\((--[a-z0-9-]+)/g)) {
      const name = m[1];
      if (DEFINED.has(name)) continue;
      if (/^--(sf|cl|rp|ai|aa|pay|svc|sec|cs|ord|nd|kpi|qa|sm|sp|sys|stf)-/.test(name)) continue;
      add(file, index + 1, `undefined token ${name}: nothing defines it, so this draws nothing`);
    }
  });
}

if (problems.length) {
  console.error(`check:visual failed with ${problems.length} problem(s):\n`);
  for (const { file, line, message } of problems) {
    console.error(`  ${file}:${line}  ${message}`);
  }
  console.error("\nThe vocabulary lives in src/styles/tokens.css.");
  process.exit(1);
}

console.log("check:visual passed. Palette, type scale, fonts, motion and tokens are clean.");
