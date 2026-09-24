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
  page.on("console", (m) => { if (m.type() === "error") errors.push("CONSOLE: " + m.text().slice(0, 140)); });

  // 1. Home: greeting + sidebar name + treasury chip
  await page.goto("http://localhost:3000/", { waitUntil: "domcontentloaded", timeout: 45000 });
  await sleep(1500);
  const body = await page.evaluate(() => document.body.innerText);
  const hasGreeting = /Good (morning|afternoon|evening), Alex Rivera/.test(body);
  const sidebarName = await page.evaluate(() => document.body.innerText.includes("Alex Rivera"));
  const chip = (body.match(/([\d.]+) USDT/) || [])[1];
  console.log("home greeting 'Alex Rivera':", hasGreeting ? "PASS" : "FAIL");
  console.log("home/sidebar shows name:", sidebarName ? "PASS" : "FAIL");
  console.log("home treasury chip:", chip + " USDT", Number(chip) === 35 ? "PASS" : "FAIL");

  // 2. Settings: input carries the persisted name
  await page.goto("http://localhost:3000/settings", { waitUntil: "domcontentloaded", timeout: 45000 });
  await sleep(1200);
  const inputVal = await page.$eval('input[type="text"]', (el) => el.value).catch(() => "(no input)");
  console.log("settings input:", inputVal, inputVal === "Alex Rivera" ? "PASS" : "FAIL");

  // 3. Rename in settings via the UI, check sidebar updates without reload
  await page.evaluate(() => {
    const el = document.querySelector('input[type="text"]');
    const setter = Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype, "value").set;
    setter.call(el, "Jane Doe");
    el.dispatchEvent(new Event("input", { bubbles: true }));
  });
  await page.evaluate(() => {
    const btns = [...document.querySelectorAll("button")];
    btns.find((b) => /Save Changes/.test(b.textContent))?.click();
  });
  await sleep(1200);
  const afterRename = await page.evaluate(() => document.body.innerText);
  console.log("settings save 'Jane Doe':", /Changes Saved ✓/.test(afterRename) ? "PASS" : "FAIL");

  await page.goto("http://localhost:3000/", { waitUntil: "domcontentloaded", timeout: 45000 });
  await sleep(1200);
  const homeAfter = await page.evaluate(() => document.body.innerText);
  console.log("home now greets 'Jane Doe':", /, Jane Doe/.test(homeAfter) ? "PASS" : "FAIL");

  console.log("page errors:", errors.length ? errors.slice(0, 5) : "none");
  await browser.close();
  process.exit(errors.length ? 1 : 0);
})();
