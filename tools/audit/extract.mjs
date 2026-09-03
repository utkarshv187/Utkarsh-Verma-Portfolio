// Structural + copy + computed-style + animation-sampling pass.
// Usage: node audit/extract.mjs
import { chromium } from 'playwright';
import { mkdir, writeFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const __dirname = dirname(fileURLToPath(import.meta.url));
const OUT = join(__dirname, 'out');
const SHOTS = join(OUT, 'shots');
const SITE = 'https://uxuiuv.framer.website/';
await mkdir(SHOTS, { recursive: true });

const browser = await chromium.launch({ headless: true });

async function fullScroll(page) {
  // Scroll to bottom in steps so lazy content + fonts load, then back to top.
  await page.evaluate(async () => {
    const step = window.innerHeight * 0.8;
    const max = document.body.scrollHeight;
    for (let y = 0; y < max; y += step) {
      window.scrollTo(0, y);
      await new Promise((r) => setTimeout(r, 250));
    }
    window.scrollTo(0, document.body.scrollHeight);
    await new Promise((r) => setTimeout(r, 600));
    window.scrollTo(0, 0);
    await new Promise((r) => setTimeout(r, 400));
  });
}

async function runBreakpoint(width, label) {
  const context = await browser.newContext({
    viewport: { width, height: 900 },
    deviceScaleFactor: 1,
    userAgent:
      'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
  });
  const page = await context.newPage();
  await page.goto(SITE, { waitUntil: 'networkidle', timeout: 120000 });
  await page.waitForTimeout(1500);
  await fullScroll(page);
  await page.waitForTimeout(800);

  // Only capture the DOM subtree that matches this breakpoint (Framer hides the others via display:none/contents).
  const data = await page.evaluate(() => {
    const isVisible = (el) => {
      const cs = getComputedStyle(el);
      if (cs.display === 'none' || cs.visibility === 'hidden') return false;
      const r = el.getBoundingClientRect();
      return r.width > 0 || r.height > 0;
    };
    // Walk sections (Framer top-level sections have data-framer-name)
    const sections = [];
    const roots = document.querySelectorAll('[data-framer-name]');
    const seen = new Set();
    // Get ordered visible text blocks
    const textNodes = [];
    const walker = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT, {
      acceptNode(n) {
        const t = n.textContent.trim();
        if (!t) return NodeFilter.FILTER_REJECT;
        const el = n.parentElement;
        if (!el || !isVisible(el)) return NodeFilter.FILTER_REJECT;
        return NodeFilter.FILTER_ACCEPT;
      },
    });
    let n;
    while ((n = walker.nextNode())) {
      const el = n.parentElement;
      const cs = getComputedStyle(el);
      textNodes.push({
        text: n.textContent.trim(),
        tag: el.tagName,
        framerName: el.closest('[data-framer-name]')?.getAttribute('data-framer-name') || '',
        fontFamily: cs.fontFamily,
        fontWeight: cs.fontWeight,
        fontSize: cs.fontSize,
        lineHeight: cs.lineHeight,
        letterSpacing: cs.letterSpacing,
        textTransform: cs.textTransform,
        color: cs.color,
        fontStyle: cs.fontStyle,
      });
    }
    // Section names in order (visible top-level named frames)
    const namedVisible = [];
    for (const el of roots) {
      if (!isVisible(el)) continue;
      const r = el.getBoundingClientRect();
      namedVisible.push({
        name: el.getAttribute('data-framer-name'),
        tag: el.tagName,
        top: Math.round(r.top + window.scrollY),
        h: Math.round(r.height),
        w: Math.round(r.width),
      });
    }
    return { textNodes, namedVisible, docHeight: document.body.scrollHeight, vw: window.innerWidth };
  });

  await writeFile(join(OUT, `content_${label}.json`), JSON.stringify(data, null, 2));

  // Full-page screenshot
  await page.screenshot({ path: join(SHOTS, `full_${label}.png`), fullPage: true });

  await context.close();
  return data;
}

// Animation sampling at desktop: sample computed transform of animated elements across scroll.
async function sampleAnimations() {
  const context = await browser.newContext({ viewport: { width: 1440, height: 900 }, deviceScaleFactor: 1 });
  const page = await context.newPage();
  await page.goto(SITE, { waitUntil: 'networkidle', timeout: 120000 });
  await page.waitForTimeout(1500);
  const total = await page.evaluate(() => document.body.scrollHeight);
  const samples = [];
  const positions = [0, 0.1, 0.2, 0.3, 0.4, 0.5, 0.6, 0.7, 0.8, 0.9, 1];
  for (const p of positions) {
    await page.evaluate((pp) => window.scrollTo(0, (document.body.scrollHeight - window.innerHeight) * pp), p);
    await page.waitForTimeout(500);
    const snap = await page.evaluate(() => {
      const out = [];
      // Elements with a non-identity transform or will-change/transform inline
      for (const el of Array.from(document.querySelectorAll('[style*="transform"], [style*="opacity"]'))) {
        const cs = getComputedStyle(el);
        if (cs.transform && cs.transform !== 'none') {
          out.push({
            name: el.getAttribute('data-framer-name') || el.className?.toString().slice(0, 40) || el.tagName,
            transform: cs.transform,
            opacity: cs.opacity,
          });
        }
      }
      return { scrollY: window.scrollY, count: out.length, items: out.slice(0, 60) };
    });
    samples.push({ p, ...snap });
  }
  await writeFile(join(OUT, 'anim_samples.json'), JSON.stringify(samples, null, 2));
  await context.close();
}

console.log('Desktop 1440...');
const d = await runBreakpoint(1440, 'desktop');
console.log('  sections:', d.namedVisible.length, 'textNodes:', d.textNodes.length, 'docH:', d.docHeight);
console.log('Tablet 900...');
const t = await runBreakpoint(900, 'tablet');
console.log('  sections:', t.namedVisible.length, 'docH:', t.docHeight);
console.log('Phone 390...');
const m = await runBreakpoint(390, 'phone');
console.log('  sections:', m.namedVisible.length, 'docH:', m.docHeight);
console.log('Sampling animations...');
await sampleAnimations();
console.log('Done.');
await browser.close();
