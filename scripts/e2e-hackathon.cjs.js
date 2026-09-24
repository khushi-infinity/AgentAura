const puppeteer = require("puppeteer-core");
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

(async () => {
  const browser = await puppeteer.launch({
    headless: true,
    executablePath: "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome",
  });
  const page = await browser.newPage();
  await page.setViewport({ width: 1440, height: 900 });
  const errors = [];
  page.on("pageerror", (e) => errors.push("PAGEERROR: " + e.message));
  page.on("console", (m) => {
    if (m.type() === "error") errors.push("CONSOLE: " + m.text().slice(0, 160));
  });

  // 1. Fresh start → onboarding
  await page.goto("http://localhost:3000/", { waitUntil: "domcontentloaded" });
  await sleep(2500);
  console.log("1. URL after fresh start:", page.url());

  // 2. Type goal and continue
  await page.waitForSelector("input", { timeout: 15000 });
  await page.type("input", "Research AI agent startups and produce a market analysis report");
  const buttons = await page.$$("button");
  for (const b of buttons) {
    const t = await b.evaluate((el) => el.textContent);
    if (t && /build/i.test(t)) { await b.click(); break; }
  }
  await sleep(2500);
  console.log("2. URL after onboarding:", page.url());

  // 3. Create company
  await page.waitForSelector("input", { timeout: 15000 });
  const inputs = await page.$$("input");
  await inputs[0].type("Hackathon Demo Co");
  const ta = await page.$("textarea");
  if (ta) await ta.type("Research AI agent startups and produce a market analysis report");
  const btns2 = await page.$$("button");
  for (const b of btns2) {
    const t = await b.evaluate((el) => el.textContent);
    if (t && /assemble/i.test(t)) { await b.click(); break; }
  }
  await sleep(4500);
  console.log("3. URL after create:", page.url());

  // 4. Home renders with the OKX rail strip
  await page.goto("http://localhost:3000/", { waitUntil: "domcontentloaded" });
  await sleep(3000);
  const rail = await page.evaluate(() => {
    const el = document.querySelector('[data-purpose="okx-rail-strip"]');
    return el ? el.textContent.slice(0, 150) : null;
  });
  console.log("4. OKX rail strip:", rail ? rail.replace(/\s+/g, " ") : "MISSING");

  // 5. Marketplace: real hire through the modal
  await page.goto("http://localhost:3000/marketplace", { waitUntil: "domcontentloaded" });
  await sleep(3500);
  const hireBtn = await page.evaluateHandle(() => {
    const btns = [...document.querySelectorAll("button")];
    return btns.find((b) => /hire on okx ai/i.test(b.textContent || ""));
  });
  if (hireBtn && hireBtn.asElement()) {
    await hireBtn.asElement().click();
    await sleep(1200);
    const modalTitle = await page.evaluate(() => {
      const h3 = [...document.querySelectorAll("h3")].find((h) => /hiring on okx ai/i.test(h.textContent || ""));
      return h3 ? h3.textContent : null;
    });
    console.log("5. Modal opened:", modalTitle);

    // Start the hire
    const startBtn = await page.evaluateHandle(() => {
      const btns = [...document.querySelectorAll("button")];
      return btns.find((b) => /deposit to escrow/i.test(b.textContent || ""));
    });
    if (startBtn && startBtn.asElement()) {
      await startBtn.asElement().click();
      console.log("6. Hire started — waiting for engine…");
      // Poll modal state for up to 60s
      let settled = false;
      for (let i = 0; i < 30; i++) {
        await sleep(2000);
        const state = await page.evaluate(() => {
          const text = document.body.textContent || "";
          return {
            settled: /Settled to Provider/i.test(text),
            failed: /Failed — see log/i.test(text),
            engineLogs: (text.match(/Engine:/g) || []).length,
          };
        });
        if (state.settled || state.failed) {
          console.log(`7. Hire outcome after ~${(i + 1) * 2}s:`, state.settled ? "SETTLED ✓" : "FAILED ✗", "| engine log entries:", state.engineLogs);
          settled = true;
          break;
        }
      }
      if (!settled) console.log("7. Hire still running after 60s (may have timed out awaiting provider)");
    } else {
      console.log("6. START BUTTON NOT FOUND");
    }
  } else {
    console.log("5. HIRE BUTTON NOT FOUND");
  }

  console.log("errors:", errors.length ? errors.slice(0, 6) : "none");
  await browser.close();
})().catch((e) => { console.error("FATAL", e.message); process.exit(1); });
