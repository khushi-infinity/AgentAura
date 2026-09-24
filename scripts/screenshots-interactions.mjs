// Capture interaction screenshots for the README: the hire-approval banner
// and the real OKX AI marketplace hire modal mid-run.
//   SHOOT_BASE=http://localhost:3000 node scripts/screenshots-interactions.mjs
import puppeteer from "puppeteer-core";
import { existsSync, mkdirSync } from "node:fs";

const BASE = process.env.SHOOT_BASE ?? "http://localhost:3000";
const OUT = "docs/screenshots";

const CHROME_CANDIDATES = [
  process.env.CHROME_PATH,
  "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome",
  "/Applications/Chromium.app/Contents/MacOS/Chromium",
  "/usr/bin/google-chrome",
  "/usr/bin/chromium",
].filter(Boolean);

function findChrome() {
  for (const p of CHROME_CANDIDATES) if (existsSync(p)) return p;
  return CHROME_CANDIDATES[0];
}

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
mkdirSync(OUT, { recursive: true });

const browser = await puppeteer.launch({
  executablePath: findChrome(),
  headless: "new",
  args: ["--disable-gpu", "--hide-scrollbars", "--force-device-scale-factor=1"],
  defaultViewport: { width: 1440, height: 900 },
});
const page = await browser.newPage();

// 1. Hire-approval banner: run an ASK_BEFORE_HIRING mission and catch the banner.
await page.goto(`${BASE}/`, { waitUntil: "load", timeout: 60000 });
await sleep(2500);
const company = await (await fetch(`${BASE}/api/companies`)).json();
if (company?.company?.id) {
  await fetch(`${BASE}/api/companies/${company.company.id}/goals/execute`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ autoApprove: false }),
  });
  // The banner polls every ~4s; wait for it to appear.
  let caught = false;
  for (let i = 0; i < 20; i++) {
    await sleep(2000);
    const has = await page.evaluate(() => /hire needs your approval/i.test(document.body.textContent || ""));
    if (has) { caught = true; break; }
  }
  await sleep(800);
  await page.screenshot({ path: `${OUT}/hire-approval.png` });
  console.log("shot hire-approval", caught ? "(banner visible)" : "(banner NOT visible — captured anyway)");

  // Approve via the UI button so the run completes cleanly afterwards.
  const approve = await page.evaluateHandle(() => {
    const btns = [...document.querySelectorAll("button")];
    return btns.find((b) => /approve/i.test(b.textContent || ""));
  });
  if (approve?.asElement()) await approve.asElement().click();
} else {
  console.log("no company — skipping hire-approval shot");
}

// 2. Marketplace hire modal, mid-run.
await page.goto(`${BASE}/marketplace`, { waitUntil: "load", timeout: 60000 });
await sleep(3500);
const hireBtn = await page.evaluateHandle(() => {
  const btns = [...document.querySelectorAll("button")];
  return btns.find((b) => /hire on okx ai/i.test(b.textContent || ""));
});
if (hireBtn?.asElement()) {
  await hireBtn.asElement().click();
  await sleep(1000);
  const startBtn = await page.evaluateHandle(() => {
    const btns = [...document.querySelectorAll("button")];
    return btns.find((b) => /deposit to escrow/i.test(b.textContent || ""));
  });
  if (startBtn?.asElement()) {
    await startBtn.asElement().click();
    // Capture while the engine is streaming events.
    await sleep(4000);
    await page.screenshot({ path: `${OUT}/hire-modal.png` });
    console.log("shot hire-modal (mid-run)");
    // Wait for settle so the run leaves clean state.
    for (let i = 0; i < 25; i++) {
      await sleep(2000);
      const done = await page.evaluate(() => /Settled to Provider|Failed/i.test(document.body.textContent || ""));
      if (done) break;
    }
  } else {
    await page.screenshot({ path: `${OUT}/hire-modal.png` });
    console.log("shot hire-modal (idle)");
  }
} else {
  console.log("hire button not found — skipping hire-modal shot");
}

await browser.close();
