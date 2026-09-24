const puppeteer = require("puppeteer-core");
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const BASE = process.env.BASE || "http://localhost:3000";

(async () => {
  // Fresh state via API (server must be running at BASE)
  await fetch(`${BASE}/api/reset`, { method: "POST" });
  await sleep(1200);

  const browser = await puppeteer.launch({
    headless: true,
    executablePath: "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome",
  });
  const page = await browser.newPage();
  await page.setViewport({ width: 1440, height: 900 });
  const errors = [];
  page.on("pageerror", (e) => errors.push("PAGEERROR: " + e.message.slice(0, 100)));

  // 1. Land on onboarding
  await page.goto(`${BASE}/`, { waitUntil: "domcontentloaded", timeout: 45000 });
  for (let i = 0; i < 12; i++) { await sleep(1000); if (page.url().includes("/onboarding")) break; }
  console.log("step1 onboarding:", page.url().includes("/onboarding") ? "PASS" : "FAIL " + page.url());

  // 2. Type the goal and continue to /create
  await page.waitForSelector("#building-input", { timeout: 20000 });
  await page.type("#building-input", "Launch an AI newsletter for indie hackers");
  await page.evaluate(() => {
    const btns = [...document.querySelectorAll("button")];
    btns.find((b) => !b.disabled && /start|next|build|continue|create/i.test(b.textContent || ""))?.click();
  });
  await sleep(2500);
  console.log("step2 create page:", page.url().includes("/create") ? "PASS" : "FAIL " + page.url());

  // 3. Fill the company form (whatever inputs exist) and submit
  const filled = await page.evaluate(() => {
    const inputs = [...document.querySelectorAll("input[type='text'], textarea")].filter(
      (el) => el.id !== "building-input"
    );
    const setter = Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype, "value").set;
    const taSetter = Object.getOwnPropertyDescriptor(window.HTMLTextAreaElement.prototype, "value").set;
    inputs.forEach((el, i) => {
      const val = i === 0 ? "Nova Labs" : `Field ${i}: sample value for the demo`;
      (el.tagName === "TEXTAREA" ? taSetter : setter).call(el, val);
      el.dispatchEvent(new Event("input", { bubbles: true }));
    });
    return inputs.length;
  });
  console.log("form fields filled:", filled);

  // Reproduce the reported bug exactly: explicitly choose "Ask before hiring"
  // (used to send the invalid MANUAL_APPROVAL enum → 400 → onboarding bounce).
  await page.evaluate(() => {
    const btns = [...document.querySelectorAll("button")];
    const ask = btns.find((b) => /ask before hiring/i.test(b.textContent || ""));
    if (ask) ask.click();
    return Boolean(ask);
  }).then((clicked) => console.log("policy 'Ask before hiring' selected:", clicked));

  // Capture the POST /api/companies status so an API rejection can't hide.
  let resolveStatus;
  const postStatus = new Promise((res) => { resolveStatus = res; });
  page.on("response", (r) => {
    if (r.url().endsWith("/api/companies") && r.request().method() === "POST") resolveStatus(r.status());
  });

  await page.evaluate(() => {
    const btns = [...document.querySelectorAll("button")];
    const submit = btns.find((b) => !b.disabled && /assemble|create|launch|build/i.test(b.textContent || ""));
    if (submit) submit.click();
    return Boolean(submit);
  }).then((clicked) => console.log("submit clicked:", clicked));
  const status = await Promise.race([postStatus, sleep(12000).then(() => "no-post")]);
  console.log("POST /api/companies status:", status === 200 ? "200 OK" : String(status));

  // 4. The fix under test: must land on HOME, not bounce to onboarding.
  let landed = "timeout";
  for (let i = 0; i < 25; i++) {
    await sleep(1000);
    const u = page.url();
    if (u.includes("/onboarding")) { landed = "BOUNCED-TO-ONBOARDING"; break; }
    if (u.replace(/\/$/, "") === BASE.replace(/\/$/, "") || /[?&]fresh=1/.test(u)) {
      // home — confirm the dashboard actually rendered with company data
      const txt = await page.evaluate(() => document.body.innerText);
      if (/Nova Labs/.test(txt)) { landed = "HOME-WITH-DASHBOARD"; break; }
    }
  }
  console.log("step4 result:", landed);
  if (landed !== "HOME-WITH-DASHBOARD") process.exitCode = 1;
  const finalTxt = await page.evaluate(() => document.body.innerText);
  console.log("dashboard has greeting:", /Good (morning|afternoon|evening), Jane Doe/.test(finalTxt) ? "PASS" : "—");
  console.log("dashboard has OKX strip:", /OKX AI/.test(finalTxt) ? "PASS" : "—");
  console.log("page errors:", errors.length ? errors : "none");

  await browser.close();
  process.exit(landed === "HOME-WITH-DASHBOARD" && errors.length === 0 ? 0 : 1);
})();
