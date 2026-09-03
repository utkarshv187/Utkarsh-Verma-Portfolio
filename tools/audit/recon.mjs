// Recon pass: load the live Framer site, capture network, fonts, assets, CSS/JS, HTML.
// Usage: node audit/recon.mjs
import { chromium } from 'playwright';
import { mkdir, writeFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const __dirname = dirname(fileURLToPath(import.meta.url));
const OUT = join(__dirname, 'out');
const SITE = 'https://uxuiuv.framer.website/';

await mkdir(OUT, { recursive: true });

const browser = await chromium.launch({ headless: true });
const context = await browser.newContext({
  viewport: { width: 1440, height: 900 },
  deviceScaleFactor: 2,
  userAgent:
    'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
});
const page = await context.newPage();

// ---- Network capture ----
const requests = [];
page.on('response', async (resp) => {
  try {
    const req = resp.request();
    const url = resp.url();
    const headers = resp.headers();
    let bodyLen = Number(headers['content-length'] || 0);
    if (!bodyLen) {
      try {
        const buf = await resp.body();
        bodyLen = buf.length;
      } catch {}
    }
    requests.push({
      url,
      method: req.method(),
      resourceType: req.resourceType(),
      status: resp.status(),
      mime: headers['content-type'] || '',
      bytes: bodyLen,
    });
  } catch {}
});

console.log('Loading', SITE);
await page.goto(SITE, { waitUntil: 'networkidle', timeout: 120000 });
await page.waitForTimeout(3000);

// ---- Collect stylesheets (text) + @font-face ----
const styleData = await page.evaluate(async () => {
  const sheets = [];
  const fontFaces = [];
  for (const ss of Array.from(document.styleSheets)) {
    let rules;
    try {
      rules = ss.cssRules;
    } catch {
      sheets.push({ href: ss.href, error: 'CORS - cannot read rules' });
      continue;
    }
    if (!rules) continue;
    let text = '';
    for (const rule of Array.from(rules)) {
      text += rule.cssText + '\n';
      if (rule.constructor.name === 'CSSFontFaceRule' || rule.type === 5) {
        fontFaces.push(rule.cssText);
      }
    }
    sheets.push({ href: ss.href, length: text.length, text });
  }
  return { sheets, fontFaces };
});

// ---- Collect all asset URLs ----
const assets = await page.evaluate(() => {
  const out = { images: [], backgrounds: [], svgUse: [], video: [], meta: {} };
  // <img>
  for (const img of Array.from(document.querySelectorAll('img'))) {
    out.images.push({
      src: img.currentSrc || img.src,
      srcset: img.srcset || '',
      naturalWidth: img.naturalWidth,
      naturalHeight: img.naturalHeight,
      displayW: img.width,
      displayH: img.height,
      alt: img.alt || '',
      loading: img.loading || '',
    });
  }
  // background-image / mask-image on all elements
  for (const el of Array.from(document.querySelectorAll('*'))) {
    const cs = getComputedStyle(el);
    for (const prop of ['backgroundImage', 'maskImage', 'webkitMaskImage']) {
      const v = cs[prop];
      if (v && v !== 'none' && v.includes('url(')) {
        const m = [...v.matchAll(/url\(["']?(.*?)["']?\)/g)].map((x) => x[1]);
        for (const u of m) out.backgrounds.push({ prop, url: u, tag: el.tagName });
      }
    }
  }
  // svg <use href>
  for (const u of Array.from(document.querySelectorAll('use'))) {
    out.svgUse.push(u.getAttribute('href') || u.getAttribute('xlink:href') || '');
  }
  // video/poster
  for (const v of Array.from(document.querySelectorAll('video'))) {
    out.video.push({ src: v.src || '', poster: v.poster || '', sources: Array.from(v.querySelectorAll('source')).map((s) => s.src) });
  }
  // meta / head
  const g = (sel, attr) => document.querySelector(sel)?.getAttribute(attr) || '';
  out.meta = {
    title: document.title,
    description: g('meta[name="description"]', 'content'),
    ogImage: g('meta[property="og:image"]', 'content'),
    ogTitle: g('meta[property="og:title"]', 'content'),
    favicons: Array.from(document.querySelectorAll('link[rel*="icon"]')).map((l) => ({ rel: l.rel, href: l.href, sizes: l.getAttribute('sizes') })),
    preloads: Array.from(document.querySelectorAll('link[rel="preload"]')).map((l) => ({ as: l.getAttribute('as'), href: l.href, type: l.getAttribute('type') })),
  };
  return out;
});

// ---- Full rendered HTML ----
const html = await page.content();

await writeFile(join(OUT, 'network.json'), JSON.stringify(requests, null, 2));
await writeFile(join(OUT, 'fontfaces.json'), JSON.stringify(styleData.fontFaces, null, 2));
await writeFile(join(OUT, 'stylesheets.json'), JSON.stringify(styleData.sheets.map(s => ({ href: s.href, length: s.length, error: s.error })), null, 2));
// Write each stylesheet text to its own file
let i = 0;
for (const s of styleData.sheets) {
  if (s.text) {
    await writeFile(join(OUT, `css_${i}.css`), `/* href: ${s.href} */\n` + s.text);
    i++;
  }
}
await writeFile(join(OUT, 'assets.json'), JSON.stringify(assets, null, 2));
await writeFile(join(OUT, 'rendered.html'), html);

console.log('Requests captured:', requests.length);
console.log('Font-face rules:', styleData.fontFaces.length);
console.log('Stylesheets:', styleData.sheets.length, '(readable:', i, ')');
console.log('Images:', assets.images.length, 'Backgrounds:', assets.backgrounds.length);
console.log('Done. Output in', OUT);

await browser.close();
