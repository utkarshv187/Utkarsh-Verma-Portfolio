import { chromium } from 'playwright';
const b = await chromium.launch({ headless: true });
const ctx = await b.newContext({ viewport: { width: 1440, height: 900 }, deviceScaleFactor: 1 });
const p = await ctx.newPage();
await p.route('**/*', (r) => (r.request().resourceType() === 'media' ? r.abort() : r.continue()));
await p.goto('https://uxuiuv.framer.website/', { waitUntil: 'load', timeout: 60000 }).catch(() => {});
await p.waitForTimeout(1500);
for (let y = 0; y < 3200; y += 700) { await p.evaluate((yy) => window.scrollTo(0, yy), y); await p.waitForTimeout(120); }
await p.evaluate(() => window.scrollTo(0, 0)); await p.waitForTimeout(400);
const d = await p.evaluate(() => {
  const norm = (s) => (s || '').replace(/\s+/g, ' ').trim();
  const box = (el) => el ? (r=>({y:Math.round(r.y+window.scrollY),h:Math.round(r.height),x:Math.round(r.x),w:Math.round(r.width)}))(el.getBoundingClientRect()) : null;
  const find = (re, max=60) => [...document.querySelectorAll('*')].find(e=>{const own=[...e.childNodes].filter(n=>n.nodeType===3).map(n=>n.textContent).join('');return re.test(norm(own))&&norm(own).length<max;});
  const heading = find(/^WORK EXPERIENCE$/i);
  const yellow = (()=>{let n=heading;for(let i=0;i<9&&n;i++){const bg=getComputedStyle(n).backgroundColor;if(/255, 183, 5/.test(bg))return n;n=n.parentElement;}return null;})();
  const spinnyLogo = document.querySelector('.framer-7pcwn0');
  const tlc = find(/^TLC$/); const gamezop = find(/^GameZop$/);
  const card = [...document.querySelectorAll('div')].find(e=>/rgb\(83, 31, 154\)/.test(getComputedStyle(e).backgroundColor));
  // rows wrapper: common ancestor of spinnyLogo and gamezop
  return {
    yellowSection: box(yellow), yellowPad: yellow?getComputedStyle(yellow).padding:null,
    heading: box(heading), subtitle: box(find(/BASED IN DELHI NCR/i)),
    spinnyLogo: box(spinnyLogo),
    tlc: box(tlc), gamezop: box(gamezop),
    card1: box(card),
    // content wrapper width (the 1200 col)
    contentX: box(heading)?.x, contentW: box(heading)?.w,
  };
});
console.log(JSON.stringify(d, null, 2));
await b.close();
