import { chromium } from 'playwright';
const b = await chromium.launch({ headless: true });
const ctx = await b.newContext({ viewport: { width: 1440, height: 900 }, deviceScaleFactor: 1 });
const p = await ctx.newPage();
await p.goto('http://localhost:5199/', { waitUntil: 'load', timeout: 60000 }).catch(() => {});
await p.waitForTimeout(800);
const val = () => p.evaluate(() => [...document.querySelectorAll('.we-card__value')].map((e) => e.textContent));
// 1) first entry
await p.evaluate(() => document.querySelector('.we__stats').scrollIntoView({ block: 'center' }));
await p.waitForTimeout(200);
console.log('entry1 @200ms:', JSON.stringify(await val()));
await p.waitForTimeout(1200);
console.log('entry1 settled:', JSON.stringify(await val()));
// 2) scroll away
await p.evaluate(() => window.scrollTo(0, 0));
await p.waitForTimeout(500);
console.log('scrolled away:', JSON.stringify(await val()));
// 3) re-enter — should scramble again
await p.evaluate(() => document.querySelector('.we__stats').scrollIntoView({ block: 'center' }));
await p.waitForTimeout(220);
console.log('entry2 @220ms:', JSON.stringify(await val()));
await p.waitForTimeout(1200);
console.log('entry2 settled:', JSON.stringify(await val()));
await b.close();
