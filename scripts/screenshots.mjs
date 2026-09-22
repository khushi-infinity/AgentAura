// Capture README screenshots of the running app.
//
//   npm run dev            # in another terminal (port 4318)
//   node scripts/screenshots.mjs
//
// Uses the locally installed Chrome via puppeteer-core (no download).
import puppeteer from 'puppeteer-core';
import { existsSync, mkdirSync } from 'node:fs';

const BASE = process.env.SHOOT_BASE ?? 'http://localhost:4318';
const OUT = 'docs/screenshots';

const CHROME_CANDIDATES = [
  process.env.CHROME_PATH,
  '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
  '/Applications/Chromium.app/Contents/MacOS/Chromium',
  '/usr/bin/google-chrome',
  '/usr/bin/chromium',
  '/usr/bin/chromium-browser',
].filter(Boolean);

function findChrome() {
  for (const p of CHROME_CANDIDATES) {
    try {
      if (existsSync(p)) return p;
    } catch {}
  }
  return CHROME_CANDIDATES[0];
}

async function api(path) {
  try {
    const res = await fetch(BASE + path);
    if (!res.ok) return null;
    return await res.json();
  } catch {
    return null;
  }
}

mkdirSync(OUT, { recursive: true });

const company = await api('/api/companies');
const missionId = company?.missions?.[0]?.id;

const pages = [
  ['onboarding', 'onboarding'],
  ['create', 'create'],
  ['home', ''],
  ['missions', 'missions'],
  ...(missionId ? [['mission-detail', `missions/${missionId}`]] : []),
  ['agents', 'agents'],
  ['marketplace', 'marketplace'],
  ['memory', 'memory'],
  ['analytics', 'analytics'],
  ['wallet', 'wallet'],
  ['settings', 'settings'],
];

const browser = await puppeteer.launch({
  executablePath: findChrome(),
  headless: 'new',
  args: ['--disable-gpu', '--hide-scrollbars', '--force-device-scale-factor=1'],
  defaultViewport: { width: 1440, height: 900 },
});

const page = await browser.newPage();
for (const [name, route] of pages) {
  // NOTE: never wait for networkidle here — Live Activity keeps an SSE
  // stream open, so the page is deliberately never "idle".
  await page.goto(`${BASE}/${route}`, { waitUntil: 'load', timeout: 60000 });
  await new Promise((r) => setTimeout(r, 2500));
  await page.screenshot({ path: `${OUT}/${name}.png` });
  console.log('shot', name);
}

await browser.close();
