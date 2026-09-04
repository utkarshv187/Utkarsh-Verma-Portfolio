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
**3 cards**, rendered as **baked LinkedIn-screenshot images** (not HTML text — confirmed: no matching text in the DOM), each wrapped in a link to `https://www.linkedin.com/in/uxuiuv/` (`target=_blank`). Source images (originals downloaded): `gpjodx2yMjShNO7g2ZqcCr2hkHk.jpg`, `kdSA7tSSazkTsQg4wDo6lUezPU.jpg`, `lCNpjsEvk6trKntPntPBcbFpy8Q.jpg` (each ~333×416 displayed). Order left→right = Ujjwal, Anurag, Prakash. Verbatim transcriptions (for `alt` text / accessibility — see Resolution R3):

1. **Ujjwal Kumar · 1st** — *Head of Product Design @ Spinny | 4x TEDx | 250+ Stages* — "Ujjwal managed Utkarsh directly"
   > I have had the pleasure of working with Utkarsh for the past four years, during which he has been deeply involved in multiple projects. It is fair to say that Utkarsh is one of the most hardworking and passionate individuals I have worked with. He consistently strives for excellence and pays close attention to the finer details.
   >
   > Utkarsh has a strong sense of design taste and is always keen on exploring fresh and novel directions when required. He takes complete ownership of his work and has been a reliable mentor to other members of the team. Well-versed across multiple design disciplines, he particularly enjoys diving deep into the user psyche and has led several impactful research initiatives for the products he owns.
2. **Anurag Gaggar · 1st** — *SVP, Product at MakeMyTrip* — "Anurag managed Utkarsh directly"
   > Utkarsh brings a great deal of positive energy to any team he works with. He is not afraid to challenge conventional design patterns with fresh ideas, and executes them with speed and discipline. His collaborative approach helps him build strong rapport across levels, and he balances innovation with respect for existing systems and context.
3. **Prakash Srivastava · 1st** — *Global Product Leader | Ex-Spinny, Paytm, PayU | IIT Delhi* — "Prakash was senior to Utkarsh but didn't manage Utkarsh directly"
   > Worked with Utkarsh for 4+ years across the consumer website, app, Hub App, and CRMs.
   > He consistently showed strong leadership and clear ownership.
   > Utkarsh thinks from first principles and brings solid critical thinking to design decisions.
   > He has a great grasp of user needs and is deeply invested in UXR.
   > Always pushes for depth and multiple iterations, not shortcuts.
   > Balances quality with speed and executes reliably under pressure.
   > A strong asset to any product or design team.

Marquee/scroll behaviour (autoplay, direction, speed, pause-on-hover, wrap) **still to be confirmed by live observation in Phase 3** (headless frames were static) — see Remaining Questions.

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
- **Caveat Brush** — used only at **weight 400, normal style**, only for the header script line "Thinking design / all the time". **Resolved (ANSWERS R1):** self-host it (OFL) — download, subset, convert to woff2, commit; **not** loaded from Google's CDN in the final build. Subset will cover full Basic-Latin + punctuation to be safe (the visible glyphs are `Thinkgdesalime` + space; the ampersand/caret/accented characters in "MORE ABOUT ME" are **Square Peg**, already in `/fonts`, and its subset will cover `& , ^` and the annotation glyphs).

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
| **Hero (measured round 3)** | Scroll-linked skew on PRODUCT+role parent: **skewX 0→~9.4°** and **translateX 0→~−24px**, linear with scroll (~0.0094°/px, ~−0.0245px/px). Pill cursor on badge hover: **"That's me"**, ~72×54, bg `rgba(255,255,255,0.4)`, black 12px, pill radius, z13. Counter hover = **scale+fade crossfade** (timer scales down/out, hover content scales up/in). Badge hover (directed): lifts `translateY(-80px)`, card body single-line. Role+badge group shifted **+64px** (directed). O ring circle radius ≈118px concentric on the O box centre (521,350). | | | | |
| **Hero (measured round 2)** | badge = **continuous spin ~25s/rev clockwise** (paused when tab hidden); role cycler = **1.5s per word**, order DESIGNER→STRATEGIST→RESEARCHER→STORYTELLER→COPY WRITER→ANIMATOR; aurora = **`<canvas>` WebGL mesh-gradient** (reproduced as animated CSS-gradient approximation, flagged); PRODUCT "O" = **link to WhatsApp**, hover reveals green WhatsApp icon + expanding ripple; graffiti hover = bottom info card ("ENGINEER TURNED ARTIST" + bio) + "That's me"; portrait bottom + bg **ramp to near-black** (mask + gradient); emphasis italic = **synthetic oblique** (`font-style:italic` on upright Satoshi), no per-word scroll skew measured. | | | | |
| A | **"Designing for" counter** | load, time-based (1s tick) | text | infinite | `<div role="timer" aria-label="Forward timer">`, Clash Display 600, 16px, ls 0.08em, gold `#FFB705`, `text-align:center`, `line-height:1em`. **No-reflow** via `font-variant-numeric: tabular-nums` + `white-space: nowrap` + fixed container width (~188px). Format `Xy Xm Xd Xh Xm Xs`, **no zero-padding**. Algorithm = **calendar-aware borrow** (y/m/d/h/m/s from origin using getFullYear/Month/Date/Hours/Min/Sec, borrowing days-from-previous-month). **Origin = authorized deviation** → `new Date(2019,0,7,0,0,0,0)` viewer-local (see Authorized Deviations). |
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

**Per-breakpoint copy differences found (must be reproduced exactly, including the original's typos):**
| Desktop | Phone |
|---|---|
| CTA "SCROLLED THIS FAR? / LET'S WORK TOGETHER" | "CAME THIS FAR? / LET'S TALK" |
| "Established the Spinny design system" | "Established Spinny consumer design system" |
| "DESIGN BANDWIDTH SAVED" | "DESIGN TIME SAVED" |
| "DEVELOPMENT TIME REDUCED" | "DEVELOP-MENT TIME REDUCED" (hyphenated) |
| "CONSISTENCY ACHIEVED" | "CONSISTANCY ACHIVED" *(sic)* |
| "PROJECTS DONE" | "PROJECT DONE" |
| "Other small & big projects with big & BIG impact" | "Other small & big project with big & BIG impact" |
| "REDUCED T.A.T OF CAR DELIVERIES" | "REDUCED TAT OF CAR DELIVERIES" |
Exact per-breakpoint strings for **every** section will be re-verified section-by-section during Phase 3 (tablet variant strings still to be diffed).

---

## 7. Resolutions (from ANSWERS.md) — supersedes the original open questions

- **R1 — Caveat Brush:** self-host (OFL), 400 normal only, subset to woff2, no Google CDN. See §3.
- **R2 — Counter:** origin `new Date(2019,0,7,0,0,0,0)` **viewer-local** (authorized deviation, below). Reproduce the original's algorithm/format/no-reflow/aria exactly (see §5 row A). Sanity: on 2026-09-03 → ~`7y 7m 27d` ✓ with calendar-borrow.
- **R3 — Testimonials:** 3 image cards, transcribed verbatim in §S5; all link to `linkedin.com/in/uxuiuv/` `_blank`. Kept as images to match the original exactly; transcription used as `alt`. Marquee behaviour to confirm live (Phase 3).
- **R4 — GIFs:** build animated-WebP **and** muted-video variants, present byte sizes + a side-by-side before committing anything; keep untouched originals in `/assets/original`. Acceptance = playback fidelity (fps, duration, loop, autoplay, no first-frame freeze), not size. Will report iOS Low-Power-Mode behaviour for the video route (`muted`+`playsinline`+`autoplay` mandatory).
- **R5 — Résumé:** use `https://drive.google.com/file/d/1g0gHmhit20T1NDhhfXOdSiKGgI2SqxU3/view` in **both** header and footer. Live site currently only exposes the header link (with `?usp=sharing`); the footer link `1Ks4l8…` you mentioned is **not present** in the live DOM (flagged in Remaining Questions).
- **R6 — Favicon/OG:** reuse + self-host. Live has **no web manifest**; favicon set = `icon` `Jf2rQV…`, `icon` `jrFoxM…`, `apple-touch-icon` `aY7J5i…` (no `sizes`). OG/Twitter meta captured below. Canonical + OG/Twitter absolute URLs → new domain.
- **R7 — Links:** confirmed table below. WhatsApp `http`→`https` (only authorized link change; query byte-identical). `#home` anchor + "GO TO TOP" present — behaviour to match live (Phase 3).
- **R8 — Custom cursor:** reproduce; gate on `@media (hover:hover) and (pointer:fine)`; keep keyboard focus visible; reduced-motion behaviour proposed in the Phase 2 plan (drop follow-lag, keep 1:1 tracking) — awaiting your OK before implementing.
- **R9 — Deploy:** Vercel + **Vercel Analytics** (replaces Framer analytics, which can't migrate). No other third-party scripts.
- **R10 — Domain:** `uxuiuv.vercel.app`, stored as a single `SITE_URL` config value (location named in the Phase 2 plan).

### Confirmed external links (from live DOM)
| Where | Live target | target | rel |
|---|---|---|---|
| Logo + "GO TO TOP" | `/#home` | — | — |
| Résumé (header) | `drive.google.com/file/d/1g0gHmhit20T1NDhhfXOdSiKGgI2SqxU3/view?usp=sharing` | `_blank` | *(empty)* |
| Card 1 — Auction PLP | `https://auction-plp-redesign-by-uv.vercel.app/` | `_blank` | *(empty)* |
| Card 2 — Gamification | `https://gamification-by-uv.vercel.app/` | `_blank` | *(empty)* |
| Card 3 — Design system | `https://www.figma.com/design/iBOEPZFnnHc4BZ3FtVsQZ7/Spinny-Design-System---Styles---Components?node-id=2-4101` | `_blank` | *(empty)* |
| Card 4 — Other projects | **not a link** on the live site | — | — |
| Testimonials ×3 | `https://www.linkedin.com/in/uxuiuv/` | `_blank` | *(empty)* |
| Footer "Made in Framer" | `https://www.framer.com/` | — | `noopener` |
| WhatsApp / Email / Connect | per ANSWERS §7 table (WhatsApp → `https://`) | `_blank` | *(to set)* |

### Meta (to carry over, canonical/OG/twitter → new domain)
`title` "Utkarsh Verma" · `description` / `og:description` / `twitter:description` = "Let's work together. Call/WhatsApp at +918869808079" · `og:title`/`twitter:title` "Utkarsh Verma" · `og:type` website · `twitter:card` summary_large_image · `og:image`/`twitter:image` = self-hosted `sB6wpIS7XS4U6nhva4i10xBcI.png` · `viewport` `width=device-width` · no `theme-color`, no manifest.

## 7a. Authorized deviations from the live site (will appear in the Phase 4 deviations report)
1. **Counter origin** `2019-01-07` viewer-local → reads ~10 days lower than Framer; **do not "fix"** (ANSWERS §2). Bundle origin, if seen, reported as info only.
2. **WhatsApp link** `http`→`https` (ANSWERS §7), query byte-identical.
3. **Analytics**: Framer analytics → Vercel Analytics (can't migrate).
4. **"Made in Framer" badge** removed.
5. **Hotlinked Framer assets** → self-hosted, AVIF/WebP re-encoded from originals.
6. **Approved:** add `rel="noopener noreferrer"` to all `_blank` links (original leaves `rel` empty).
7. **Approved:** GIF→animated-WebP/video swap (R4) — present comparison before shipping each.
8. **Footer résumé link (1c):** original DOM has **no** footer résumé link; we deliberately add one pointing to the same header file `1g0gHmhit…` (`/view`, no `?usp=sharing`).
9. **Résumé URL:** use bare `…/view` (drop live `?usp=sharing`).

**Not deviations (final):** design-system card → live `iBOEPZ…Spinny-Design-System` (ANSWERS §7 table was wrong; live is correct). Card 4 "Other projects" → non-clickable, as on live.

## 7b. Remaining questions (do not block Phase 2; needed before/within Phase 3)
1. **Two-cards-same-Figma discrepancy:** ANSWERS §7 says the design-system and "Other projects" cards both point to `E3jWyZ8…/Auction-new-listing-B2B`. **The live site shows neither** — design-system → `iBOEPZ…` and card 4 is **not linked**. I'll reproduce the **live** state (design-system→`iBOEPZ…`, card 4 unlinked) and list it as a deviation. Confirm, or give the intended targets.
2. **Résumé footer link:** the `1Ks4l8…` file isn't in the live DOM. Confirm the footer should link the same `1g0gHmhit…` file (I'll do that per R5).
3. **`rel` on `_blank` links:** OK to add `rel="noopener noreferrer"` (7a-6), or reproduce the empty `rel` exactly?
4. **Résumé URL form:** live uses `?usp=sharing`; you gave the bare `/view`. I'll use `/view` unless you want the suffix preserved.
5. **Testimonial marquee behaviour** (autoplay/direction/speed/pause-on-hover/wrap): I'll capture the live behaviour precisely in Phase 3 and match it; will flag if ambiguous.

---

## 9. Interaction states (hover / focus-visible / active) — page-wide

Captured by programmatically driving pointer states on the live site (`tools/audit/interactions.mjs`, `header_states_full.mjs`, `header_hover_shots.mjs`). Framer drives these with JS (Motion), so most expose no CSS `transition` value — timings are matched visually and flagged **~approx** where the exact spring/tween isn't recoverable from the minified bundle. (The scroll-only Phase-1 audit missed this whole category.)

### Header (desktop)
| Element | Default | Hover | Active / focus | Notes |
|---|---|---|---|---|
| **Logo** (`#home`) | UX mark | **no change** | UA active only; keyboard outline | intentionally static |
| **Designing-for block** | "Designing for" (gold) + live counter (gold) | **variant swap** → Utkarsh **memoji** (`HNcMAlWL…png`, thumbs-up) + **"Thinking design / all the time"** in **Caveat Brush** (white, 2 lines); counter `letter-spacing` collapses 1.28px→~0.08px during the swap | not a link | crossfade ~0.25s ~approx |
| **About** | "About" (Clash 600 16px white) | **"↓" arrow** fades/slides in to the right of the label | outline | scroll-to-section affordance |
| **Contact** | outline pill "Contact" | **expands into a panel** revealing ✉ `utkarshv187@gmail.com` + WhatsApp `+91 8869808079` (underlined); "About" shifts left to make room | mailto + wa.me links | width-expand reveal ~approx |
| **Résumé** | purple pill with a **continuous orbiting gold glow** (border-beam: "Glow" + "Stroke" gold `rgb(255,182,1)` radial-gradients travel the perimeter — a JS loop, ~2–3s ~approx) | **"↗" arrow** appears + **full gold border** lights + button `scaleX≈0.93` + tiny `translateX` squish + bg darkens `#6C37B2`→`~#5D3097` | outline | glow runs continuously incl. on touch |

### Rest of page
Interaction states for project cards, testimonial cards, "GO TO TOP", footer/social links and carousel arrows are captured **per-section as each is built** (same tooling). **No-hover (intentional):** logo, body copy, section headings.

### Reproduction rules (all sections)
- Hover effects gated behind `@media (hover: hover) and (pointer: fine)` so they never stick on touch.
- On touch: match the live `:active`/tap (or nothing) — captured, not assumed. **Continuous** animations (Résumé glow) run on touch too, as on live.
- `prefers-reduced-motion`: per PLAN §3 (freeze loops, instant state changes, keep focus visible).

### Appendix — capture tooling
`tools/audit/` (committed): `recon.mjs` (network/fonts/CSS/assets), `extract.mjs` (per-breakpoint copy + computed styles + screenshots), `scrollshots.mjs` (viewport shots that survive pinned sections), `anim.mjs` (scroll/loop/cursor probes), `card3.mjs`, `montage.mjs`. Re-runnable with `node audit/<script>.mjs`.
