import { chromium } from 'playwright';
const b = await chromium.launch({ headless: true });
const p = await (await b.newContext({ viewport: { width: 1440, height: 900 }, reducedMotion: 'no-preference' })).newPage();
const errs = []; p.on('pageerror', (e) => errs.push(e.message.slice(0, 100)));
await p.goto('http://localhost:5199/', { waitUntil: 'load' }).catch(() => {});
await p.waitForTimeout(900);

const scaleOf = (t) => { const m = (t || '').match(/matrix\(([^)]+)\)/); if (!m) return 1; const a = m[1].split(',').map(parseFloat); return +Math.hypot(a[0], a[1]).toFixed(3); };
const txOf = (t) => { const m = (t || '').match(/matrix\(([^)]+)\)/); if (!m) return 0; return Math.round(+m[1].split(',')[4]); };

// ---------- FIX 2: GoToTop visibility across scroll ----------
async function gtt(label, y) { await p.evaluate((y) => { document.documentElement.scrollTop = y; document.body.scrollTop = y; }, y); await p.waitForTimeout(700); return await p.evaluate(() => { const el = document.querySelector('.gtt'); if (!el) return null; const cs = getComputedStyle(el); const r = el.getBoundingClientRect(); const c = el.querySelector('.gtt__circle'); const ccs = c ? getComputedStyle(c) : null; return { show: el.classList.contains('gtt--show'), opacity: +cs.opacity, transform: cs.transform, rightPx: Math.round(innerWidth - r.right), bottomPx: Math.round(innerHeight - r.bottom), w: Math.round(r.width), circleBg: ccs && ccs.backgroundColor, radius: ccs && ccs.borderRadius }; }); }
const aboutY = await p.evaluate(() => { const el = document.getElementById('more-about-me'); return el ? Math.round(el.getBoundingClientRect().top + (window.scrollY || document.body.scrollTop)) : null; });
console.log('aboutY(more-about-me):', aboutY);
console.log('FIX2 [top]      ', JSON.stringify(await gtt('top', 0)));
console.log('FIX2 [about-200]', JSON.stringify(await gtt('a', aboutY - 200)));
console.log('FIX2 [about+900]', JSON.stringify(await gtt('b', aboutY + 900)));
console.log('FIX2 [back top] ', JSON.stringify(await gtt('c', 0)));

// ---------- FIX 1: About click smooth-scroll + offset ----------
await p.evaluate(() => { document.documentElement.scrollTop = 0; document.body.scrollTop = 0; });
await p.waitForTimeout(400);
await p.evaluate(() => { const a = [...document.querySelectorAll('.nav-link')].find((x) => /About/.test(x.textContent)); a && a.click(); });
await p.waitForTimeout(1200);
const afterClick = await p.evaluate(() => { const el = document.getElementById('more-about-me'); const heading = document.querySelector('.about__heading'); return { scroll: Math.round(window.scrollY || document.body.scrollTop), sectionTop: Math.round(el.getBoundingClientRect().top), headingTop: Math.round(heading.getBoundingClientRect().top) }; });
console.log('\nFIX1 after About click:', JSON.stringify(afterClick), '(heading should sit a bit below the 80px header)');

// ---------- FIX 3: contact underline grows L->R ----------
await p.evaluate(() => { document.documentElement.scrollTop = 0; document.body.scrollTop = 0; }); await p.waitForTimeout(400);
const contactBox = await p.evaluate(() => { const el = document.querySelector('.contact'); const r = el.getBoundingClientRect(); return { x: r.left + r.width / 2, y: r.top + r.height / 2 }; });
await p.mouse.move(contactBox.x, contactBox.y); await p.waitForTimeout(600);
const phoneBox = await p.evaluate(() => { const el = document.querySelector('.contact__item--wa'); const r = el.getBoundingClientRect(); return { x: r.left + r.width / 2, y: r.top + r.height / 2 }; });
const under = async () => p.evaluate(() => { const ph = getComputedStyle(document.querySelector('.contact__phone'), '::after'); const em = getComputedStyle(document.querySelector('.contact__email'), '::after'); return { phone: { sx: ph.transform, origin: ph.transformOrigin, bg: ph.backgroundColor }, email: { sx: em.transform, bg: em.backgroundColor } }; });
console.log('\nFIX3 underline before hover-number:', JSON.stringify(await under()));
await p.mouse.move(phoneBox.x, phoneBox.y); await p.waitForTimeout(500);
console.log('FIX3 underline while hover-number :', JSON.stringify(await under()), '(phone sx should go to identity; email stays scaleX0)');

// ---------- FIX 4: cursor press-shrink ----------
await p.mouse.move(700, 500); await p.waitForTimeout(300);
const beforePress = await p.evaluate(() => getComputedStyle(document.querySelector('.cursor')).transform);
await p.mouse.down(); await p.waitForTimeout(320);
const duringPress = await p.evaluate(() => ({ dot: getComputedStyle(document.querySelector('.cursor')).transform, txt: getComputedStyle(document.querySelector('.cursor-text')).transform }));
await p.mouse.up(); await p.waitForTimeout(320);
const afterPress = await p.evaluate(() => getComputedStyle(document.querySelector('.cursor')).transform);
console.log('\nFIX4 cursor scale  before:', scaleOf(beforePress), ' during-press:', scaleOf(duringPress.dot), '(text', scaleOf(duringPress.txt) + ')', ' after:', scaleOf(afterPress), '=> target ~0.75 while pressed');

// ---------- FIX 5: square peg delays + bounce ----------
const seq = await p.evaluate(() => { const out = {}; for (let i = 1; i <= 5; i++) { const el = document.querySelector('.about__anchor--' + i + ' .about__ins-text'); if (el) { const cs = getComputedStyle(el); out[i] = { delay: cs.transitionDelay, timing: cs.transitionTimingFunction }; } } return out; });
console.log('\nFIX5 phrase delays/easing:', JSON.stringify(seq, null, 0));

console.log('\nerrors:', errs.length, errs);
await b.close();
