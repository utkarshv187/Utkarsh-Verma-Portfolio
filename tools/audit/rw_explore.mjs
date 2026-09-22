import { chromium } from 'playwright';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import { writeFileSync, mkdirSync } from 'node:fs';
const __dirname = dirname(fileURLToPath(import.meta.url));
const OUT = join(__dirname, 'out', 'rw');
mkdirSync(OUT, { recursive: true });

const b = await chromium.launch({ headless: true });
const p = await (await b.newContext({ viewport: { width: 1440, height: 900 }, deviceScaleFactor: 1 })).newPage();
await p.goto('https://uxuiuv.framer.website/', { waitUntil: 'load', timeout: 90000 }).catch(() => {});
await p.waitForTimeout(2000);

// Scroll the whole page slowly to trigger lazy-load + in-view content
await p.evaluate(async () => {
  const step = window.innerHeight * 0.6;
  for (let y = 0; y < document.body.scrollHeight; y += step) { window.scrollTo(0, y); await new Promise(r => setTimeout(r, 250)); }
  window.scrollTo(0, 0);
  await new Promise(r => setTimeout(r, 400));
});

const data = await p.evaluate(() => {
  const out = {};
  // 1) locate headings
  const all = [...document.querySelectorAll('h1,h2,h3,h4,p,span,div')];
  const findText = (t) => all.filter((e) => e.textContent && e.textContent.trim().toUpperCase().includes(t) && e.children.length <= 3);
  out.recentWork = findText('RECENT WORK').slice(0, 4).map((e) => ({ tag: e.tagName, name: e.getAttribute('data-framer-name'), text: e.textContent.trim().slice(0, 60) }));
  out.blending = findText('BLENDING ART').slice(0, 4).map((e) => ({ tag: e.tagName, name: e.getAttribute('data-framer-name'), text: e.textContent.trim().slice(0, 80) }));

  // 2) all links + target/rel
  out.links = [...document.querySelectorAll('a[href]')].map((a) => ({ href: a.getAttribute('href'), target: a.getAttribute('target'), rel: a.getAttribute('rel'), text: (a.textContent || '').trim().slice(0, 70) })).filter((l) => /vercel|figma|auction|gamification/i.test(l.href));

  // 3) all images (src + srcset) with intrinsic sizes
  out.images = [...document.querySelectorAll('img')].map((img) => ({ src: img.currentSrc || img.src, srcset: img.getAttribute('srcset') || '', natW: img.naturalWidth, natH: img.naturalHeight, alt: img.alt || '' })).filter((i) => i.src && !/data:/.test(i.src));
  return out;
});

writeFileSync(join(OUT, 'explore.json'), JSON.stringify(data, null, 2));
console.log('RECENT WORK matches:', JSON.stringify(data.recentWork, null, 2));
console.log('\nBLENDING matches:', JSON.stringify(data.blending, null, 2));
console.log('\nLINKS (project):', JSON.stringify(data.links, null, 2));
console.log('\nIMAGES count:', data.images.length);
console.log(JSON.stringify(data.images, null, 2));
await b.close();
