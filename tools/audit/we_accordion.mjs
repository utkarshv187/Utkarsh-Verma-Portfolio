import { chromium } from 'playwright';
import sharp from 'sharp';
import { mkdir, writeFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
const __dirname = dirname(fileURLToPath(import.meta.url));
const OUT = join(__dirname, 'out', 'we');
await mkdir(OUT, { recursive: true });
const b = await chromium.launch({ headless: true });
const ctx = await b.newContext({ viewport: { width: 1440, height: 900 }, deviceScaleFactor: 1 });
const p = await ctx.newPage();
await p.route('**/*', (r) => (r.request().resourceType() === 'media' ? r.abort() : r.continue()));
await p.goto('https://uxuiuv.framer.website/', { waitUntil: 'load', timeout: 60000 }).catch(() => {});
await p.waitForTimeout(1500);
const Hh = await p.evaluate(() => document.body.scrollHeight);
for (let y = 0; y < 4000; y += 700) { await p.evaluate((yy) => window.scrollTo(0, yy), y); await p.waitForTimeout(120); }
await p.evaluate(() => window.scrollTo(0, 0)); await p.waitForTimeout(400);

// scroll the experience rows into view
await p.evaluate(() => {
  const el = [...document.querySelectorAll('*')].find((e) => e.children.length <= 3 && /^Spinny$/i.test((e.textContent || '').trim()));
  if (el) el.scrollIntoView({ block: 'center' });
});
await p.waitForTimeout(500);
await p.screenshot({ path: join(OUT, 'acc_collapsed.png') });

// helper: rows heights (to detect expansion)
const rowInfo = async () => p.evaluate(() => {
  const find = (name) => [...document.querySelectorAll('*')].find((e) => (e.textContent || '').trim() === name && e.getBoundingClientRect().height > 6);
  const out = {};
  for (const n of ['Spinny', 'TLC', 'GameZop']) {
    const el = find(n); if (!el) { out[n] = null; continue; }
    // climb to a row-ish ancestor (height grows when expanded)
    let row = el; for (let i = 0; i < 6; i++) { if (row.parentElement) row = row.parentElement; }
    out[n] = { rowH: Math.round(row.getBoundingClientRect().height) };
  }
  return out;
});
console.log('collapsed row heights', JSON.stringify(await rowInfo()));

// try clicking each company header and capture
for (const name of ['Spinny', 'TLC', 'GameZop']) {
  const loc = p.locator(`text=/^${name}$/`).first();
  try { await loc.scrollIntoViewIfNeeded(); await loc.click({ timeout: 3000 }); } catch (e) { console.log(name, 'click err', e.message.slice(0, 60)); }
  await p.waitForTimeout(600);
  await p.screenshot({ path: join(OUT, `acc_${name}.png`) });
  console.log('after click', name, JSON.stringify(await rowInfo()));
}

// also test hover on Spinny
await p.evaluate(() => window.scrollTo(0, 0));
await p.evaluate(() => { const el = [...document.querySelectorAll('*')].find((e) => (e.textContent || '').trim() === 'Spinny' && e.getBoundingClientRect().height > 6); if (el) el.scrollIntoView({ block: 'center' }); });
await p.waitForTimeout(400);
const spinny = p.locator('text=/^Spinny$/').first();
try { await spinny.hover(); await p.waitForTimeout(600); await p.screenshot({ path: join(OUT, 'acc_spinny_hover.png') }); } catch (e) {}
await b.close();
console.log('done — acc_collapsed / acc_Spinny / acc_TLC / acc_GameZop / acc_spinny_hover');
