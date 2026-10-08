/* Real-browser audit of the staff console.
 *
 * This exists because the redesign's definition of done is full of statements
 * only a browser can answer: no horizontal overflow at 320px, nothing spilled
 * off its card, no unnamed sideways scrolling, tap targets that a thumb can
 * find. Static checks cannot answer any of them.
 *
 * The sandbox has no browser, but it does have the npm registry, so Chromium
 * arrives as the serverless build. It is Amazon Linux's, and this box is not,
 * so its shared libraries are unpacked by hand and the loader pointed at them.
 *
 *   npm i --no-save --legacy-peer-deps puppeteer-core @sparticuz/chromium
 *   git checkout -- package-lock.json            # keep the lockfile honest
 *   npx vite --host 0.0.0.0 --port 5173 &        # the app must be running
 *   node scripts/audit-console.cjs               # or ROUTES/WIDTHS as JSON
 *
 * Every page is opened with a locally seeded Supabase session, so the console
 * shell renders instead of bouncing to /login. The backend is not reachable, so
 * pages show their empty or skeleton states: this measures the layout, never
 * the data. Screenshots land in /home/user/audit.
 *
 * Chromium comes from the serverless build installed in node_modules; this box
 * is not Amazon Linux, so its shared libraries have to be unpacked by hand and
 * the loader pointed at them.
 *
 * Every page is opened with a locally seeded Supabase session so the console
 * shell renders instead of bouncing to /login. The backend is unreachable from
 * here, so pages show their offline or empty states: that is fine, because what
 * is being measured is the layout, not the data.
 *
 * Usage: ROUTES='["/staff"]' WIDTHS='[320]' node scripts/audit-console.cjs
 */
const chromium = require("@sparticuz/chromium").default;
const { inflate, setupLambdaEnvironment } = require("@sparticuz/chromium");
const puppeteer = require("puppeteer-core");
const { existsSync, mkdirSync } = require("node:fs");
const { join } = require("node:path");

const ORIGIN = "http://127.0.0.1:5173";
const OUT = "/home/user/audit";
const ROUTES = JSON.parse(process.env.ROUTES || '["/login"]');
const WIDTHS = JSON.parse(process.env.WIDTHS || "[320]");
const HEIGHT = 780;
const STORAGE_KEY = "sb-yqrxiadyqbueubzxwdmq-auth-token";

const b64 = (value) =>
  Buffer.from(JSON.stringify(value)).toString("base64").replace(/=/g, "").replace(/\+/g, "-").replace(/\//g, "_");

const session = (() => {
  const now = Math.floor(Date.now() / 1000);
  const payload = { sub: "00000000-0000-0000-0000-00000000c0de", aud: "authenticated", role: "authenticated",
    email: "operator@cpl.local", exp: now + 60 * 60 * 24 * 365, iat: now };
  const jwt = [b64({ alg: "HS256", typ: "JWT" }), b64(payload), "c2lnbmF0dXJl"].join(".");
  return {
    access_token: jwt,
    token_type: "bearer",
    expires_in: 60 * 60 * 24 * 365,
    expires_at: now + 60 * 60 * 24 * 365,
    refresh_token: "local-audit-refresh",
    user: { id: payload.sub, aud: "authenticated", role: "authenticated", email: payload.email,
      app_metadata: { provider: "email", providers: ["email"] }, user_metadata: {}, identities: [],
      created_at: new Date().toISOString() },
  };
})();

const slug = (route, width) => `${route.replace(/^\//, "").replace(/[^\w-]/g, "_") || "root"}-${width}`;

const measure = () => {
  const vw = window.innerWidth;
  const clips = (element) => {
    let node = element.parentElement;
    while (node) {
      const overflowX = getComputedStyle(node).overflowX;
      if (overflowX === "hidden" || overflowX === "clip" || overflowX === "auto" || overflowX === "scroll") return true;
      node = node.parentElement;
    }
    return false;
  };
  const path = (element) => {
    const parts = [];
    let node = element;
    while (node && node !== document.body && parts.length < 4) {
      const id = node.id ? `#${node.id}` : "";
      const cls = node.className && typeof node.className === "string"
        ? "." + node.className.trim().split(/\s+/).slice(0, 2).join(".")
        : "";
      parts.unshift(node.tagName.toLowerCase() + id + cls);
      node = node.parentElement;
    }
    return parts.join(" > ");
  };

  const spills = [];
  for (const element of document.querySelectorAll("*")) {
    const rect = element.getBoundingClientRect();
    if (rect.width === 0 || rect.height === 0) continue;
    if (rect.right <= vw + 1 && rect.left >= -1) continue;
    if (clips(element)) continue;
    spills.push({
      path: path(element),
      left: Math.round(rect.left),
      right: Math.round(rect.right),
      width: Math.round(rect.width),
      text: (element.textContent || "").trim().slice(0, 28),
    });
  }

  const taps = [];
  for (const element of document.querySelectorAll("button, a, input, select, textarea, [role='button']")) {
    const rect = element.getBoundingClientRect();
    const style = getComputedStyle(element);
    if (rect.width === 0 || rect.height === 0) continue;
    if (style.visibility === "hidden" || style.display === "none" || style.opacity === "0") continue;
    if (rect.height >= 36 && rect.width >= 36) continue;
    taps.push({
      path: path(element),
      width: Math.round(rect.width),
      height: Math.round(rect.height),
      text: (element.textContent || element.getAttribute("aria-label") || "").trim().slice(0, 24),
    });
  }

  /* Anything that scrolls sideways inside itself without a name is a scroll
     trap: the definition of done asks for none. */
  const sideways = [];
  for (const element of document.querySelectorAll("*")) {
    const style = getComputedStyle(element);
    if (style.overflowX !== "auto" && style.overflowX !== "scroll") continue;
    if (element.scrollWidth <= element.clientWidth + 1) continue;
    const named = element.getAttribute("aria-label") || element.getAttribute("role") === "region";
    if (!named) sideways.push({ path: path(element), scrollWidth: element.scrollWidth, clientWidth: element.clientWidth });
  }

  return {
    path: location.pathname + location.search,
    title: document.title,
    viewport: vw,
    docScrollWidth: document.documentElement.scrollWidth,
    bodyScrollWidth: document.body.scrollWidth,
    overflow: document.documentElement.scrollWidth - vw,
    spills: spills.slice(0, 8),
    spillCount: spills.length,
    taps: taps.slice(0, 8),
    tapCount: taps.length,
    sideways: sideways.slice(0, 5),
    sidewaysCount: sideways.length,
  };
};

(async () => {
  if (!existsSync("/tmp/al2023/lib")) {
    await inflate(join(process.cwd(), "node_modules/@sparticuz/chromium/bin/al2023.tar.br"));
  }
  setupLambdaEnvironment("/tmp/al2023/lib");
  mkdirSync(OUT, { recursive: true });

  const browser = await puppeteer.launch({
    args: [...chromium.args, "--no-sandbox", "--disable-setuid-sandbox", "--lang=en-GH"],
    executablePath: await chromium.executablePath(),
    headless: true,
  });

  for (const width of WIDTHS) {
    for (const route of ROUTES) {
      const page = await browser.newPage();
      await page.setViewport({ width, height: HEIGHT, deviceScaleFactor: 2, isMobile: width < 600, hasTouch: width < 600 });
      const errors = [];
      page.on("pageerror", (error) => errors.push(String(error).split("\n")[0].slice(0, 90)));
      await page.evaluateOnNewDocument((key, value) => localStorage.setItem(key, value), STORAGE_KEY, JSON.stringify(session));
      try {
        await page.goto(ORIGIN + route, { waitUntil: "domcontentloaded", timeout: 25000 });
        await new Promise((resolve) => setTimeout(resolve, 3000));
        const report = await page.evaluate(measure);
        console.log(JSON.stringify({ route, width, ...report, errors: errors.slice(0, 3) }));
        await page.screenshot({ path: join(OUT, `${slug(route, width)}.png`) });
      } catch (error) {
        console.log(JSON.stringify({ route, width, failed: error.message.slice(0, 100) }));
      }
      await page.close();
    }
  }

  await browser.close();
  console.log("AUDIT DONE");
})().catch((error) => { console.error("AUDIT FAILED:", error.message); process.exit(1); });
