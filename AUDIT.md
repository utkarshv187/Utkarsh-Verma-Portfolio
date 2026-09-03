# AUDIT — uxuiuv.framer.website

**Target:** https://uxuiuv.framer.website/ — Utkarsh Verma, Product Designer portfolio (single page).
**Captured:** 2026-09-03, headless Chromium (Playwright), at 1440 / 900 / 390px widths, full scroll, with computed styles, network log, served CSS, and `@font-face` rules.
**Method:** All values below are read from the live site's **computed styles and served CSS bundles**, not eyeballed. Raw capture data lives in `tools/audit/out/` (network.json, fontfaces.json, css_*.css, content_*.json, assets.json, anim.json, and screenshots under `out/scroll_*` and `out/shots`).

> This is Phase 1. **No production code has been written.** Please read the **Open Questions** at the end — I need answers there before Phase 3, and confirmation of this audit before Phase 2.

---

## 0. Architecture at a glance (why it's slow, what we're replacing)

| Resource | Detail | Transfer |
|---|---|---|
| JS: `shared-lib.mjs` | Framer runtime | **954 KB** |
| JS: `framer.GvvTmx6b.mjs` | page/component code | **463 KB** |
| JS: `motion.mjs` | Motion (framer-motion core) | **152 KB** |
| JS: `react.mjs` | React | **145 KB** |
| JS: misc (script_main, rolldown, events, edit/init) | | ~30 KB |
| **JS total** | | **≈ 1.9 MB** |
| 3× hobby GIFs | 3.9 MB + 8.1 MB + 10.0 MB | **≈ 22 MB** |
| Other images (AVIF, as served/downscaled) | 27 stills | ≈ 2.5 MB |
| Fonts (woff2) | 8 files loaded initially | ≈ 0.29 MB |
| HTML document | | 57 KB |

**Scroll model:** native scroll. **No Lenis / no smooth-scroll / no scroll damping** (`scroll-behavior: auto`, no scroll-container transform). → We must **not** add smooth scrolling.
**Cursor:** `<body class="framer-cursor-none">` — the native cursor is hidden and a **custom cursor** is used. (See Animations §5.)
**Rendering:** Framer ships 3 breakpoint variants of the whole page in one DOM (Desktop/Tablet/Phone), toggled by `display`. Duplicated content in the DOM = breakpoint variants, not repeated sections.

---

## 1. Section inventory (top → bottom, in order)

Copy is transcribed exactly (including double-spaces, casing, punctuation, the `&`, and the em dashes). Where copy **differs by breakpoint**, both are given.

### S0 — Sticky Header / Nav (fixed, translucent on scroll)
- **Logo:** "ЩX" monogram mark (top-left), image `HNcMAlWLu…png`.
- **Desktop:** tiny script line "Thinking design / all the time" (Caveat Brush, white) + **"Designing for"** (gold) + a **live counter** `7y 8m 7d 15h 3m 47s` (gold) · nav: **About**, **Contact** · **Résumé** button (purple pill).
- **Mobile/Tablet:** logo + **mail icon** + **WhatsApp icon** + **Résumé** pill (the About/Contact text nav and the "Designing for" counter are hidden).
- Under the header sits a thin **scroll-progress bar** (element `progress`, animates `scaleX/scaleY` with scroll).

### S1 — Hero
- Giant **"PRODUCT"** (Clash Display 700) with the **"O"** rendered as a separate letter that the portrait shows through.
- Below/overlapping: a **role ticker** cycling **DESIGNER → STRATEGIST → RESEARCHER → STORYTELLER → COPY WRITER → ANIMATOR** (loops).
- **Rotating circular badge:** "LET'S • WORK • TOGETHER •" (spins continuously).
- **Hero portrait** (`IWdo08dy…png`, purple-duotone cut-out of Utkarsh).
- **"UTKARSH VERMA"** signature/graffiti wordmark at the bottom (image asset `7nuBCHYzW4t5…png`, purple graffiti style — appears to be an image, not a font).

### S2 — Work Experience (yellow `#FFB601` section)
- Heading **"WORK  EXPERIENCE"** (double space), sub **"BASED  IN  DELHI  NCR,  INDIA    •    AVAILABLE  WORLDWIDE"**.
- Experience rows (logo · role · dates), each expandable with bullet groups:
  - **Spinny** — *Senior Product Designer* — **May 2019 — Jun 2026**. Bullet groups labelled **CURRENTLY**, **A  WHILE  BACK**, **JOINED  AS  THE  FOUNDING  DESIGNER** (full bullet copy in §1-copy below).
  - **TLC** — *UX UI Designer* — **Jan 2019 — May 2019**.
  - **GameZop** — *UI Design Intern* — **Oct 2018 — Dec 2018**.

### S3 — Stats band (3 rolling counters)
- **7+** YEARS OF EXPERIENCE · **30+** SUCCESSFUL PRODUCTS · **1M+** DIVERSIFIED USERS. (Odometer roll-up on scroll-in.)

### S4 — Recent Work (heading `RECENT  WORK`, sub `I  LOVE  BLENDING  ART  &  TECHNOLOGY` in purple `#6C37B2`)
Horizontal **project cards** with **‹ ›** arrows; the cards use a **sticky-stack** scroll effect (each card pins, the next stacks over it). Each card = mockups + title + four metric tiles (odometer counters):

| # | Card title (desktop) | Metric tiles |
|---|---|---|
| 1 | **Spinny's car auction app PLP redesign** | 13% More user retention · 9% Revenue growth · 40% Drop in cars missed · 2x Shoot up in NPS |
| 2 | **Introduced a tier based gamification** | 18% More user retention · 7% Surge in revenue · 31% Rise in bids made · 14% Reduced T.A.T of car deliveries |
| 3 | **Established the Spinny design system** *(mobile: "Established Spinny consumer design system")* | 1000+ Variants designed & developed · 1/3 Design bandwidth saved · 1/4 Development time reduced · MAX Consistency achieved |
| 4 | **Other small & big projects with big & BIG impact** | 150+ Projects done · 0 to 10 And beyond |

- Card 1 contains a **before/after image-comparison slider** (draggable handle) with handwritten annotations "The former product listing page" (red script) and "The new and better product listing page" (teal script).
- Card metric tile colour theme changes per card (teal `#25C5B3` on dark; gold `#FFB601` on purple).

### S5 — Testimonials (purple section: `THINGS  THEY  SAY` / `REAL  WORK,  REAL  WORDS,  REAL WORTH`)
- Auto-scrolling **marquee of LinkedIn recommendation cards** (white rounded cards: avatar, name, "· 1st", role line, LinkedIn logo, quote). One reads: *Prakash Srivastava — Global Product Leader | Ex-Spinny, Paytm…* → "Worked with Utkarsh for 4+ years [on] consumer website, app, Hub App… thinks from first principles… great grasp of user needs… A strong asset to any product or design team." **(Full text of every card still to be transcribed — see Open Questions Q3.)**

### S6 — More About Me (dark section)
- **"MORE  ABOUT  ME"** (gold 80px) / **"ENGINEER  TURNED  ARTIST"** (white 40px).
- Portrait (`upit0LYD…jpg`, low-key photo).
- Bio (Satoshi 900, 40px): **"Result, impact & delight driven designer with 7+ years of expertise in building human experiences by thoughtful interfaces & ideas which work & thrive"** with floating **Square Peg** gold script annotations pointing (via a `^` caret) at specific words: "mentor, storyteller", "& improving", "products & businesses", "sometimes unconventional", "if not, then we correct & make it work".
- **Tool row** of app icons: Blender, After Effects, Jitter, Framer, an AI/ML mark, Figma, Illustrator, Spline, Photoshop (as seen; exact set to reconcile in build).

### S7 — Hobbies ("JUST  IN  CASE  WHEN  I  AM  NOT  DESIGNING")
- **LEARNING**, **GAMING** ("very very competitive!") , **SOCIALIZING** ("extrovert like a designer should be"), **ADVENTURING** ("whenever work allows"), **& PHOTOGRAPHING** — each with a fanned photo-card cluster and the **3 large GIFs** (gaming arcade, scuba/adventure, etc.). PHOTOGRAPHING has an image collage grid.

### S8 — CTA / Footer (yellow)
- **Desktop:** "**SCROLLED** THIS FAR? / LET'S WORK / TOGETHER" (140px; "SCROLLED" at 56% white, rest solid white). **Mobile:** "**CAME** THIS FAR? / LET'S TALK" — *different copy at the phone breakpoint.*
- Phone mockup graphic. Contact: **+91 8869808079** (green), **utkarshv187@gmail.com** (blue), **Connect** (LinkedIn, blue). "Made in Framer" badge (to be removed).

*(Full verbatim bullet copy for S2 experience is stored in `tools/audit/out/content_desktop.json`; included here in condensed form for length. I can paste the full block into this file if you want it inline.)*

---

## 2. Design tokens

### Colours
| Role | Value |
|---|---|
| Page dark background | `rgb(15, 12, 32)` `#0F0C20` (variants `rgb(14,12,32)`, `rgb(12,12,31)`) |
| Yellow section / accent | `#FFB601` `rgb(255,182,1)` and `#FFB705` `rgb(255,183,5)` |
| Primary purple | `#9B50FF` `rgb(155,80,255)` |
| Deep purples | `#531F9A` `rgb(83,31,154)`, `#56239A` `rgb(86,35,154)`, `#6C37B2` `rgb(108,55,178)`, `#483B99` |
| Teal (metric accent) | `#25C5B3` `rgb(37,197,179)` (tiles use `rgba(37,197,179,0.12)`) |
| Off-white display text | `#EEEEFF` `rgb(238,238,255)` |
| White / greys | `#FFFFFF`, `#E6E6E6`, `#D1DAE0`, `#BFBFBF`, `#B3C2CB`, `#BBB` |
| Contact: phone green | `rgb(62,193,79)` |
| Contact: email blue | `rgb(28,157,247)` |
| Contact: LinkedIn blue | `rgb(40,104,178)` |
| Pink accent | `#EECAC5` |
| Common alphas | `rgba(255,182,1,0.16/0.10)`, `rgba(12,12,31,0.4/0.8)`, `rgba(255,255,255,0.56/0.15)` |

### Type scale (family · weight · size · line-height · letter-spacing · colour)
| Element | Spec |
|---|---|
| Hero "PRODUCT" | Clash Display 700 · **282px** / 310.2px · **-11.28px** · `#EEEEFF` |
| Hero role words (auto-fit per word) | Clash Display 700 · DESIGNER 265 / STRATEGIST 207 / RESEARCHER 194 / STORYTELLER 182 / COPY WRITER 191 / ANIMATOR 240px · `#EEEEFF` |
| Circular badge text | Clash Display 700 · 16px · **3.36px** · `#000` |
| Section headings (WORK EXPERIENCE, THINGS THEY SAY, MORE ABOUT ME) | Clash Display 700 · **80px** / 96px · colour per section (`#0E0C20` / white / gold) |
| Sub-headings | Clash Display 700 · **40px** / 56px · white or `#6C37B2` purple |
| "Designing for" | Clash Display 500 · 14px · gold `#FFB705` |
| Live counter | Clash Display 600 · 16px · **1.28px** · gold |
| Nav labels / Résumé | Clash Display 600 · 16px · white (Résumé ls 0.64px) |
| Experience role (Senior Product Designer) | Clash Display 500 · 28px / 47.6px · `#0C0C1F` |
| Bullet group labels (CURRENTLY…) | Clash Display 600 · 18px · **0.72px** |
| Body bullets | Satoshi 500 · 20px / **40px** · `rgba(12,12,31,0.8)`; **emphasis words → Satoshi 900 italic** `#0E0C20` |
| Stat labels | Clash Display 600 · 20px / 32px · white |
| Card title | Satoshi 900 · 56px / 78.4px · white |
| Metric number | Clash Display 700 · ~40px · white |
| Metric label | Clash Display 600 · 16px / 22.4px · teal `#25C5B3` **or** gold `#FFB601` |
| Bio paragraph | Satoshi 900 · 40px / 88px · white |
| Script annotations / carets | Square Peg 400 · 32–56px · gold `#FFB705` |
| "Thinking design / all the time" | Caveat Brush 400 · white *(rendered scaled via transform)* |
| CTA headline | Clash Display 700 · **140px** / 140px · white (`SCROLLED` at `rgba(255,255,255,0.56)`) |
| Contact links | Clash Display 600 · 20px · per-link colour (green/blue) |

### Spacing / radii / effects
- Rhythm is on a 4px base (line-heights 16/22.4/40/47.6/56/96; letter-spacing ≈ −0.04em on display type).
- Card corner radius ≈ 24–32px (large rounded cards); pill buttons fully rounded.
- Header uses a translucent scrim + subtle backdrop when scrolled (see screenshots `s03…`).
- Decorative vector shapes (arrows, squiggles, star burst, checkmark, WhatsApp/mail/LinkedIn glyphs) are **inline SVG** data-URIs in the CSS (captured in `assets.json → backgrounds/svgUse`).
- Exact per-section paddings, gaps and radii will be read element-by-element during Phase 3 build (each is in the computed-style capture).

---

## 3. Font inventory

**Actually loaded on the live site (from `@font-face` + network):**

| Family | Weights/styles loaded | Source | In `/fonts`? |
|---|---|---|---|
| **Clash Display** | 500, 600, 700 used (200/300/400 also declared) | Fontshare, via framerusercontent | ✅ `ClashDisplay-Variable.ttf` |
| **Satoshi** | 500, 900, **900 italic** used (700 declared) | Fontshare, via framerusercontent | ✅ `Satoshi-Variable.ttf` |
| **Square Peg** | 400 | Google Fonts (gstatic) | ✅ `SquarePeg-Regular.ttf` |
| **Caveat Brush** | 400 | Google Fonts (gstatic) | ❌ **MISSING** |

- Placeholder faces `Clash Display Placeholder` / `Satoshi Placeholder` (Arial metric-override) are Framer's CLS trick; we'll replicate with our own metric-adjusted fallback.
- **Caveat Brush 400 is used** ("Thinking design / all the time" in the header) but is **not in `/fonts`**. It's an OFL Google font, so self-hosting is licit — but per your rule I'm flagging it rather than substituting. **See Open Questions Q1.**

---

## 4. Asset inventory

Framer serves images via its CDN with `?width/height/scale-down-to` params. Per your instructions I'll fetch **bare URLs** (query stripped) in Phase 3 and record true intrinsic dimensions; the table below is the **as-served** picture with the CDN's known source width×height.

**Stills (AVIF as served) — 27 files, ~2.5 MB.** Highlights:

| id | src w×h (CDN) | served | use |
|---|---|---|---|
| `IWdo08dy…png` | 1809×2091 | 138 KB avif | Hero portrait |
| `7nuBCHYz…png` | 284×608 | 22 KB | "UTKARSH VERMA" graffiti wordmark |
| `HNcMAlWL…png` | 107×126 | 5 KB | Logo mark |
| `upit0LYD…jpg` | 1440×1738 | 155 KB | "More about me" portrait |
| `LPldb… / OCxN… / 0xM0… / RgYf… / XFUk… / m0vq… / xCgm… / SeM8… / gxxP… / p6Sf… / ZnNa…` (Card 1–4 ×2) | ~1440×~2100 | 20–148 KB ea | Testimonial / project marquee cards |
| `PqGj8J2… / eKISVOiU… / BeRbTT6Z…jpg` | ~1500–1952² | 79–173 KB | Section background textures |
| 16× `fAjY… FaL0… Gfl1… lc9r… cU75… MCMC… QSmo… fam5… f5xG… QE4v… T6GU… 2cD9… lMUl… tqxO… E4i0…` | ~1870×~1350 | lazy | "Other projects" thumbnail grid |
| favicon set | `Jf2rQV…`, `jrFoxM…`, apple-touch `aY7J5i…` | | favicons |
| OG image | `sB6wpIS7XS4U6nhva4i10xBcI.png` | | social share |

**GIFs (the weight problem) — 3 files, ~22 MB:**

| id | src w×h | served | mime | use |
|---|---|---|---|---|
| `xkzkmWXB…gif` | 746×1628 | **3.9 MB** | webp | hobby GIF |
| `bAXnzVrK…gif` | 778×1702 | **8.1 MB** | gif | hobby GIF |
| `wJSpzHHW…gif` | 750×1200 | **10.0 MB** | webp | hobby GIF (`ScreenRecording…ezgif` optimised) |

- GIFs will be **preserved as animations**; I'd like to propose animated-WebP/short-video swaps to cut ~20 MB — **with a side-by-side comparison first** (Open Questions Q4).
- Decorative SVGs (arrows/squiggles/star/check/social glyphs) are inline in CSS — I'll re-author them as inline SVG (no extra requests).

---

## 5. Animation inventory

> Framer is built on **Motion** (framer-motion); `motion.mjs` is loaded here. Reproducing with Motion in the rebuild is the reliable way to match easing/springs. Exact per-tween easing/spring constants are being extracted from the Motion props in `framer.mjs`; where I don't yet have the exact constant I say so.

| # | Element | Trigger | Properties | Loop/once | Notes / values known |
|---|---|---|---|---|---|
| A | **"Designing for" counter** | load, time-based `setInterval` (1s) | text | infinite | Counts **up** from a fixed start ≈ **2018-12-27** (format `Xy Xm Xd Xh Xm Xs`). Exact seed timestamp **TBD** (Q2). |
| B | **Hero role ticker** | timed loop | vertical `translateY` slot-machine (all 6 words stacked + duplicate for seamless wrap) | infinite | Each word **auto-fits** to container width (hence differing font sizes). Interval/easing **being measured** (~2–3s dwell). |
| C | **Circular "LET'S WORK TOGETHER" badge** | load | continuous `rotate` | infinite | Constant angular velocity; period **TBD** from Motion props. |
| D | **Header scroll-progress bar** | scroll-linked | `scaleX` 0→1 across page scroll | — | element `progress`; input 0→pageScroll, output scale 0→1. |
| E | **Nav / header** | scroll | translucency + `translate` on marquee children | — | header becomes translucent scrim on scroll. |
| F | **Stat counters (7+/30+/1M+)** | in-view | odometer digit roll 0→target | once | plays on entering viewport. |
| G | **Recent Work cards** | scroll-linked | **sticky-stack**: each card pins then next `translateY`-stacks over | — | pin range ≈ one card height each; exact `useScroll` input/output ranges to be sampled per card in Phase 3. |
| H | **Card metric tiles** | in-view | odometer roll to target | once | per card. |
| I | **Card 1 before/after** | pointer drag | clip/`width` of overlay via handle x | interactive | draggable comparison slider. |
| J | **Testimonials marquee** | load | horizontal `translateX` auto-scroll | infinite | continuous; pauses on hover **TBD**. |
| K | **Bio script annotations** | in-view (likely) | opacity/`path`-draw reveal of Square Peg notes + caret | once | reveal easing TBD. |
| L | **Section entrance reveals** | in-view | `opacity`+`translateY` fade-up on headings/blocks | once | Framer default appear effect; distance/duration TBD per element. |
| M | **Custom cursor** | pointermove | follows pointer (`translate`), likely scales/labels on hover | continuous | `body.framer-cursor-none`; cursor component to be identified in `framer.mjs`. |
| N | **Hobby photo-card fans** | in-view / hover | `rotate`+`translate` fan-out | — | stacked cards spread; values TBD. |

Scroll-linked transform samples at 12 scroll positions are saved in `tools/audit/out/anim.json` (elements `navbar`, `progress`, `Graphic 1`, `Button Stroke`, card wrappers, etc.). Exact input→output numeric ranges and easing/spring constants are the main Phase-3 extraction task; I'll pull them from the Motion component props rather than guess.

**`prefers-reduced-motion`:** the Framer site does **not** appear to gate anything on it (to confirm). My proposed fallback (Phase 2) will freeze infinite loops (badge, marquee, role ticker at first word), show counters at final value, and replace scroll-linked/entrance motion with static end states — **no layout change**.

---

## 6. Breakpoint map

Framer's 3 breakpoints (from the served media queries):

| Variant | Width | Key layout |
|---|---|---|
| **Desktop** | `≥ 1280px` | full nav (About/Contact/Résumé + counter); hero type ~282px; multi-column cards; metric tiles 2×2. |
| **Tablet** | `810–1279.98px` | intermediate; reduced type; nav similar. |
| **Phone** | `≤ 809.98px` | header → logo + mail + WhatsApp + Résumé; hero type shrinks; stats stack vertically; cards single-column; metric tiles wrap; **CTA copy changes to "CAME THIS FAR? / LET'S TALK"**; design-system card title changes to "Established Spinny consumer design system". |

Document heights (1440 / 900 / 390): **18019 / 15353 / 8989 px**. Content order is identical across breakpoints; only layout/type/some copy differ. I'll map all three variants to **one responsive implementation** (not three copies).

---

## 7. Open questions (need your answers before Phase 3; please confirm the audit for Phase 2)

1. **Caveat Brush 400** is used ("Thinking design / all the time") but isn't in `/fonts`. It's an OFL Google font — **may I self-host it** (I'll subset it), or will you drop it into `/fonts`? (I will not substitute a lookalike.)
2. **"Designing for" counter seed:** what is the exact **start timestamp** it counts up from? My estimate is ~2018-12-27 00:00 IST. An exact datetime (and timezone) makes it match to the second.
3. **Testimonials:** the cards are real LinkedIn recommendation text. Do you want me to **transcribe every card verbatim from the live site** (I can), or will you give me the canonical text? Also: how many cards, and should the marquee pause on hover?
4. **GIFs (~22 MB):** OK to let me prepare **animated-WebP / muted-video** swaps and show you a side-by-side before committing? If you'd rather keep exact GIFs, I'll self-host them as-is (page stays heavy).
5. **Résumé button:** where should it link — a PDF you'll provide, or the current target? (Please share the résumé file / URL.)
6. **Favicon + OG image:** reuse the current ones (I'll pull `Jf2rQV…`, apple-touch `aY7J5i…`, OG `sB6wpIS7…`) or supply new files?
7. **Links:** confirm exact targets for **WhatsApp** (`+91 8869808079` → wa.me link?), **email** (`mailto:utkarshv187@gmail.com`), and **Connect/LinkedIn** URL.
8. **Custom cursor:** confirm you want the hide-native-cursor + custom-cursor behavior reproduced (it can hurt accessibility/mobile; it's currently on).
9. **Deploy target / domain:** where will this be hosted (affects font self-host paths, analytics)? Keep Framer analytics (`events.framer.com`) or drop it?
10. **Custom domain / analytics keys**, if any, and whether to keep the "Made in Framer" badge removed (assumed yes).

---

### Appendix — capture tooling
`tools/audit/` (committed): `recon.mjs` (network/fonts/CSS/assets), `extract.mjs` (per-breakpoint copy + computed styles + screenshots), `scrollshots.mjs` (viewport shots that survive pinned sections), `anim.mjs` (scroll/loop/cursor probes), `card3.mjs`, `montage.mjs`. Re-runnable with `node audit/<script>.mjs`.
