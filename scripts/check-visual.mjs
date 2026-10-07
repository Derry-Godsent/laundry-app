#!/usr/bin/env node
/**
 * Visual system guard.
 *
 * `check:copy` protects the writing. This protects the look: one typeface, one
 * palette, no gradients, no emoji standing in for icons, no font size off the
 * scale. It runs over src/ and fails the same way check-copy does, with the
 * file and line so the fix is obvious.
 *
 * Files still being migrated in phase E are listed in PENDING. A file that is
 * not in that list must pass every rule; a file that is in it is skipped, and
 * the script prints how many are left, so the list can only ever shrink.
 */
import { readFileSync, readdirSync, statSync } from "node:fs";
import { join, relative, extname } from "node:path";

/* The last files awaiting their appearance pass. Delete entries as they land;
   never add one. */
const PENDING = new Set([
  /* Chrome and the shared sheet: primitives, phase E2. */
  "src/components/FAB/FAB.css",
  "src/components/sidebar/NavItem.css",
  "src/components/sidebar/Sidebar.css",
  "src/components/sidebar/WorkspaceSwitcher.css",
  "src/components/topbar/CommandPalette.css",
  "src/components/topbar/NotificationDropdown.css",
  "src/components/topbar/NotificationDropdown.tsx",
  "src/components/topbar/ProfileDropdown.css",
  "src/components/topbar/ProfileDropdown.tsx",
  "src/components/topbar/Topbar.css",
  "src/main.tsx",
  "src/styles/components.css",

  /* Pages: operations, then management, phase E3 and E4. */
  "src/pages/AppAccounts.css",
  "src/pages/AppAccounts.tsx",
  "src/pages/AppIdeas.css",
  "src/pages/AppIdeas.tsx",
  "src/pages/Clients.tsx",
  "src/pages/Dashboard.css",
  "src/pages/Dashboard.tsx",
  "src/pages/DesignPreview.css",
  "src/pages/DesignPreview.tsx",
  "src/pages/Help.tsx",
  "src/pages/MobileRequests.css",
  "src/pages/OrderBuilder.css",
  "src/pages/OrderBuilder.tsx",
  "src/pages/Orders.css",
  "src/pages/Orders.tsx",
  "src/pages/Payments.tsx",
  "src/pages/Profile.tsx",
  "src/pages/Receipt.tsx",
  "src/pages/Reports.tsx",
  "src/pages/Security.tsx",
  "src/pages/ServiceRequests.css",
  "src/pages/ServiceRequests.tsx",
  "src/pages/Services.tsx",
  "src/pages/Settings.tsx",
  "src/pages/Staff.tsx",
  "src/pages/SystemAdmin.tsx",
]);

/* The scale, as a set of allowed values. */
const FONT_SIZES = new Set([
  "var(--fs-2xs)", "var(--fs-xs)", "var(--fs-sm)", "var(--fs-md)",
  "var(--fs-lg)", "var(--fs-xl)", "var(--fs-2xl)", "var(--fs-3xl)",
  "var(--fs-4xl)", "0", "inherit",
]);

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
  const strict = !PENDING.has(file);
  if (!strict) continue;

  lines.forEach((line, index) => {
    const n = index + 1;
    const code = line.split("//")[0];

    if (code.includes("gradient(")) {
      add(file, n, "gradient: use a flat surface, a hairline or type instead");
    }
    if (EMOJI.test(line)) {
      add(file, n, "emoji: use an icon from the icon set");
    }
    /* Pure black and white are not palette members: they are ink and paper,
       and the print rules on the receipt and order sheets need them. */
    const colourCode = code.replace(/#(?:000|000000|fff|ffffff)\b/gi, "");
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

console.log(
  `check:visual passed. ${PENDING.size} file(s) still awaiting their phase E pass.`
);
