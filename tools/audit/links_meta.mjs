// Capture links (href/target/rel/text), meta/OG/twitter, favicons/manifest,
// counter element (computed font-variant-numeric / container sizing), testimonials text.
import { chromium } from 'playwright';
import { writeFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
const __dirname = dirname(fileURLToPath(import.meta.url));
const OUT = join(__dirname, 'out');
const SITE = 'https://uxuiuv.framer.website/';

const b = await chromium.launch({ headless: true });
const ctx = await b.newContext({ viewport: { width: 1440, height: 900 }, deviceScaleFactor: 1 });
// Block heavy media so the page settles fast; we only need DOM text/links/meta here.
await ctx.route('**/*', (route) => {
  const t = route.request().resourceType();
  if (t === 'image' || t === 'media' || t === 'font') return route.abort();
  return route.continue();
});
const p = await ctx.newPage();
await p.goto(SITE, { waitUntil: 'load', timeout: 60000 });
await p.waitForTimeout(2500);
// warm scroll to populate marquees/lazy
await p.evaluate(async () => { const m=document.body.scrollHeight; for(let y=0;y<m;y+=700){scrollTo(0,y); await new Promise(r=>setTimeout(r,220));} scrollTo(0,0); await new Promise(r=>setTimeout(r,700)); });

const data = await p.evaluate(() => {
  const abs = (h) => { try { return new URL(h, location.href).href; } catch { return h; } };
  // Links
  const links = [...document.querySelectorAll('a[href]')].map(a => ({
    text: (a.textContent || '').trim().replace(/\s+/g, ' ').slice(0, 60),
    href: a.getAttribute('href'),
    hrefAbs: abs(a.getAttribute('href')),
    target: a.getAttribute('target') || '',
    rel: a.getAttribute('rel') || '',
    framerName: a.getAttribute('data-framer-name') || a.closest('[data-framer-name]')?.getAttribute('data-framer-name') || '',
  }));
  // Meta
  const g = (sel, attr='content') => document.querySelector(sel)?.getAttribute(attr) || null;
  const meta = {
    title: document.title,
    description: g('meta[name="description"]'),
    canonical: g('link[rel="canonical"]', 'href'),
    ogTitle: g('meta[property="og:title"]'),
    ogDescription: g('meta[property="og:description"]'),
    ogImage: g('meta[property="og:image"]'),
    ogUrl: g('meta[property="og:url"]'),
    ogType: g('meta[property="og:type"]'),
    twitterCard: g('meta[name="twitter:card"]'),
    twitterTitle: g('meta[name="twitter:title"]'),
    twitterDescription: g('meta[name="twitter:description"]'),
    twitterImage: g('meta[name="twitter:image"]'),
    themeColor: g('meta[name="theme-color"]'),
    viewport: g('meta[name="viewport"]'),
    manifest: g('link[rel="manifest"]', 'href'),
    icons: [...document.querySelectorAll('link[rel*="icon"], link[rel="apple-touch-icon"]')].map(l => ({ rel: l.getAttribute('rel'), href: l.getAttribute('href'), sizes: l.getAttribute('sizes'), type: l.getAttribute('type') })),
  };
  // Counter element
  const counterEl = [...document.querySelectorAll('*')].find(e => e.children.length===0 && /^\d+y\s+\d+m\s+\d+d\s+\d+h\s+\d+m\s+\d+s$/.test(e.textContent.trim()));
  let counter = null;
  if (counterEl) {
    const cs = getComputedStyle(counterEl);
    const r = counterEl.getBoundingClientRect();
    counter = {
      text: counterEl.textContent.trim(),
      fontVariantNumeric: cs.fontVariantNumeric,
      fontFeatureSettings: cs.fontFeatureSettings,
      width: cs.width, minWidth: cs.minWidth, whiteSpace: cs.whiteSpace,
      letterSpacing: cs.letterSpacing, fontFamily: cs.fontFamily, fontWeight: cs.fontWeight,
      rectW: Math.round(r.width),
      parentClass: counterEl.parentElement?.className || '',
      outerHTML: counterEl.outerHTML.slice(0, 300),
    };
  }
  // Testimonials: dump every leaf text node in document order with its data-framer-name path,
  // so testimonial cards can be located and transcribed regardless of nesting/marquee.
  const leaves = [];
  const w = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT, null);
  let n;
  while ((n = w.nextNode())) {
    const t = n.textContent.replace(/ /g, ' ').trim();
    if (!t) continue;
    const el = n.parentElement;
    const fn = el?.closest('[data-framer-name]')?.getAttribute('data-framer-name') || '';
    leaves.push({ t, fn });
  }
  return { links, meta, counter, leaves };
});

await writeFile(join(OUT, 'links_meta.json'), JSON.stringify(data, null, 2));
console.log('links:', data.links.length);
console.log('counter found:', !!data.counter, data.counter && data.counter.text, data.counter && ('fvn='+data.counter.fontVariantNumeric+' ffs='+data.counter.fontFeatureSettings+' w='+data.counter.width));
console.log('leaves:', data.leaves.length);
await b.close();
