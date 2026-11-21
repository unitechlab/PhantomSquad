// Debug helper: plays the game in headless Chromium like a careful player and saves screenshots to scripts/preview/.
// Usage: node scripts/shoot.mjs   (needs `next start -p 3124` running)
import { chromium } from 'playwright';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const OUT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), 'preview');
const BASE = 'http://localhost:3124';
const QUESTS = [
  'Haunted Mall WebAR Rally',
  'Cyber-Ghost VR Exhibition',
  'Specter Promo Video',
  'Phantom Museum AR Guide',
  'Moonlit Metaverse Concert',
  'Grave Shift App Launch',
];

const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 1440, height: 1000 } });
const errors = [];
page.on('pageerror', (e) => errors.push(`pageerror: ${e.message}`));
page.on('console', (m) => {
  if (m.type() === 'error') errors.push(`console: ${m.text()}`);
});
page.on('response', (r) => {
  if (r.status() >= 400) errors.push(`http ${r.status()}: ${r.url()}`);
});

const hudText = async () => (await page.locator('section[aria-label="Campaign status"]').innerText()).replace(/\n+/g, ' | ');
const day = async () => Number((await hudText()).match(/Day \| (\d+)/)?.[1] ?? -1);

/** Re-summons every quest that is open and has a stalled or empty squad. */
async function restaff() {
  for (const title of QUESTS) {
    const card = page.getByRole('button', { name: new RegExp(title) }).first();
    const text = await card.innerText();
    if (/Banished|Arrives/.test(text)) continue;
    if (/No one is working|Nobody is assigned/.test(text)) {
      await card.click();
      await page.getByRole('button', { name: /Summon Optimal Squad/ }).click();
      await page.waitForTimeout(80);
    }
  }
}

await page.goto(`${BASE}/simulator`, { waitUntil: 'networkidle' });
await page.getByRole('radio', { name: 'Speedrun' }).click();
await restaff();
await page.getByRole('radio', { name: '2x' }).click();
await page.getByRole('button', { name: /Play/ }).click();
await page.waitForTimeout(2200);
await page.screenshot({ path: path.join(OUT, 'sim-1-playing.png'), fullPage: false });

// Keep playing; re-staff every few days like a player who watches the warnings.
let lastShot = false;
const seen = new Set();
for (let i = 0; i < 80; i++) {
  await page.waitForTimeout(700);
  await page.getByRole('button', { name: /Pause/ }).click().catch(() => {});
  await restaff();
  const d = await day();
  if (!seen.has('bubble') && (await page.locator('span.whitespace-nowrap.border-specter').count()) > 0) {
    seen.add('bubble');
    await page.locator('section[aria-label="Studio floor"]').screenshot({ path: path.join(OUT, 'ev-bubble.png') });
  }
  for (const text of await page.locator('[role=status]').allInnerTexts()) {
    const kind = /Milestone/.test(text) ? 'milestone' : /Full Moon/.test(text) ? 'moon' : /sponsor/i.test(text) ? 'sponsor' : /glitch/i.test(text) ? 'glitch' : /COMBO/.test(text) ? 'combo' : null;
    if (kind && !seen.has(kind)) {
      seen.add(kind);
      await page.locator('section[aria-label="Studio floor"]').screenshot({ path: path.join(OUT, `ev-${kind}.png`) });
      console.log('saw', kind, '-', text.replace(/\n+/g, ' / ').slice(0, 90));
    }
  }
  if (!lastShot && d >= 28) {
    await page.screenshot({ path: path.join(OUT, 'sim-2-mid.png'), fullPage: true });
    lastShot = true;
  }
  const over = await page.getByRole('dialog').count();
  if (over) break;
  await page.getByRole('button', { name: /Play/ }).click().catch(() => {});
}
console.log('HUD:', await hudText());
await page.screenshot({ path: path.join(OUT, 'sim-3-end.png'), fullPage: false });

await page.goto(`${BASE}/guide`, { waitUntil: 'networkidle' });
await page.getByRole('radio', { name: '日本語' }).click();
await page.screenshot({ path: path.join(OUT, 'guide-ja.png') });
await page.goto(`${BASE}/grimoire`, { waitUntil: 'networkidle' });
await page.getByRole('button', { name: /Open Luna/ }).click();
await page.waitForTimeout(1000);
await page.screenshot({ path: path.join(OUT, 'grimoire-modal.png') });

console.log(errors.length ? `ERRORS:\n${errors.join('\n')}` : 'no browser errors');
await browser.close();


