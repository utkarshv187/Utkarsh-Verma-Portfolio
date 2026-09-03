# PHASE 2 — Plan (for approval before any production code)

Reflects PROMPT.md (fidelity first, bundle size second) and all ANSWERS.md decisions. Nothing here is built yet.

---

## 1. Stack & why

| Choice | Why | Notes |
|---|---|---|
| **Vite + React 18 + TypeScript** | The animated pieces (role ticker, odometer counters, sticky-stack cards, custom cursor, scroll-progress) are stateful; React keeps them maintainable, Vite ships a tiny tree-shaken bundle and deploys to Vercel with zero config. | Single-page static SPA. |
| **Motion (`motion` / framer-motion)** | Framer **is** Motion internally. Using it is the reliable way to reproduce the exact easing curves, springs, `useScroll`/`useTransform` scroll-linking and stagger. You pre-approved this; I agree. | Import only what's used (`motion`, `useScroll`, `useTransform`, `useSpring`, `AnimatePresence`) to keep it light. |
| **No Lenis / no smooth-scroll lib** | The live site uses native scroll (audit §0). Adding damping would be a deviation. | — |
| **sharp** (build-time) | Generate AVIF+WebP + `srcset`/`sizes` from the committed originals; set intrinsic width/height to kill CLS. | already installed in `tools/`. |
| **Vercel + @vercel/analytics** | Deploy target per R9; Framer analytics can't migrate. Nothing else third-party. | — |

**Projected JS:** React+ReactDOM (~45KB gz) + Motion (~40–55KB gz) + app (~15KB gz) ≈ **~110–140KB gzip**, versus Framer's ~1.9MB uncompressed runtime. GIF strategy (R4) is the other big win (~22MB → target low single-digit MB).

**Considered and rejected:** Astro/islands — the page is animated end-to-end (custom cursor + scroll-linking everywhere), so there's little static HTML to gain from partial hydration; it adds complexity for marginal JS savings. Happy to revisit if you'd prefer it.

---

## 2. File / folder structure

```
/
├─ index.html                 # meta/OG/twitter/canonical injected from config at build
├─ vite.config.ts  tsconfig.json  vercel.json  package.json
├─ assets/original/           # untouched downloaded originals (committed) — images, GIFs, og, favicons
├─ public/
│  ├─ fonts/                  # subset woff2 (Clash Display, Satoshi, Square Peg, Caveat Brush)
│  ├─ images/                 # generated avif/webp variants + favicons + og
│  └─ resume/ (if we mirror) 
├─ src/
│  ├─ main.tsx  App.tsx
│  ├─ config/site.ts          # << SITE_URL = "https://uxuiuv.vercel.app" and all external links live here (one-line domain switch)
│  ├─ data/                   # copy.ts, links.ts, metrics.ts, testimonials.ts (typed, per-breakpoint where copy differs)
│  ├─ styles/ tokens.css global.css
│  ├─ lib/  dateDiff.ts (counter algo)  motion.ts (shared easings/springs)  useScrollProgress.ts  usePointerFine.ts
│  └─ components/
│     ├─ Cursor.tsx  ScrollProgress.tsx
│     ├─ Header.tsx  DesigningForCounter.tsx
│     ├─ Hero.tsx  RoleTicker.tsx  RotatingBadge.tsx
│     ├─ WorkExperience.tsx
│     ├─ Stats.tsx  Odometer.tsx
│     ├─ RecentWork.tsx  ProjectCardStack.tsx  BeforeAfter.tsx  MetricTile.tsx
│     ├─ Testimonials.tsx
│     ├─ AboutMe.tsx  ScriptAnnotation.tsx
│     ├─ Hobbies.tsx  MediaLoop.tsx   (GIF/webp/video wrapper)
│     └─ CTA.tsx  Footer.tsx
└─ tools/  (audit tooling already here; add extract-assets.mjs + subset-fonts.mjs)
```

**The single config value:** `src/config/site.ts` exports `SITE_URL` (and the links table). `index.html`/meta build read from it, so switching `uxuiuv.vercel.app` → a custom domain later is a one-line change in that one file.

---

## 3. `prefers-reduced-motion` behaviour (need your OK before I implement — per R8)

| Element | Normal | Reduced-motion |
|---|---|---|
| **Custom cursor** | small custom cursor follows pointer with slight spring/lag; grows/changes over links, cards, buttons | **keep** the custom cursor but **remove follow-lag** (track pointer 1:1, no spring) and make hover changes **instant** (no scale tween). Native cursor still hidden; keyboard focus outlines stay visible. On touch / `pointer: coarse` → not rendered at all. |
| Rotating badge, role ticker, testimonial/tool marquees | infinite loops | **freeze**: badge at 0°, ticker shows the first word, marquees static |
| Odometer counters (stats + metrics) | roll up on in-view | show **final value** immediately |
| Scroll-linked transforms, sticky-stack, entrance fades | animate | render at **final/static** state, no transform; **layout unchanged** |
| Hobby GIFs / (if swapped) video | autoplay loop | show a **static poster frame**; video does not autoplay |

If you want the cursor fully disabled (native cursor shown) under reduced-motion instead, say so.

---

## 4. GIF strategy (R4) — will show you a comparison in Phase 3, commit nothing first
Build, for each of the 3 GIFs, **(a)** animated WebP and **(b)** muted `<video>` (`muted playsinline autoplay loop`), measure exact fps/duration/loop, and report byte sizes + recommendation. Keep originals in `/assets/original`. Preliminary lean: **animated WebP** (behaves like a GIF, autoplays in iOS Low Power Mode where `<video>` won't). You approve per-asset before anything ships.

---

## 5. Build order (Phase 3 — one section at a time, screenshot-diff + commit each)
Header/cursor/scroll-progress → Hero (PRODUCT + role ticker + badge + portrait + wordmark) → Work Experience → Stats → Recent Work (stack + before/after + odometers) → Testimonials → About Me → Hobbies (GIF swaps) → CTA/Footer → global passes (fonts, images, reduced-motion, Lighthouse, link/rel audit). Each section: build → run local → screenshot mine vs live at the 8 widths + scroll positions → list & fix diffs → commit.

---

## 6. What I need from you (single list)
1. **Answers to the 5 "Remaining Questions"** in AUDIT.md §7b — especially: (1) the Figma link discrepancy, (3) `rel` on `_blank`, (4) résumé `?usp=sharing` vs `/view`.
2. **Approve the reduced-motion behaviours** in §3 above (cursor especially).
3. **Approve proceeding to Phase 3.**

Everything else is settled: fonts (provided + Caveat Brush self-hosted), images/GIFs (I extract), résumé/links/OG/favicon/domain/analytics all given.

## 7. Things I'll match by measurement, not guarantee byte-identical (flagging now, per PROMPT)
- Exact **spring/easing constants** and **scroll input→output ranges** — I'll extract from Motion props where the minified bundle exposes them, otherwise tune frame-by-frame to visually match. I'll call out any that end up perceptual rather than provably identical.
- **Odometer** digit-roll timing/stagger — matched visually.
- **Custom cursor** exact size/blend-mode/spring — matched to live inspection.
- **Testimonials** kept as the original images → pixel-identical (with transcribed `alt`).
