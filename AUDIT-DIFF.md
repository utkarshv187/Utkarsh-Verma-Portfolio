# Full-site diff audit — my build vs live (uxuiuv.framer.website)

**Method (honest scope):** headless Chromium, both sites loaded at 1920 / 1440 / 1280 / 1024 / 768 / 430 / 390 / 360. Elements anchored by text (largest-font match to avoid Framer's hidden 12px placeholder duplicates). Computed values read off **both** sites (font-family/size/weight/letter-spacing/line-height/color, positions, section bg). Full-page section screenshots composited side-by-side at 1440 and 1024. Overflow + console-error sweep at all 8 widths. Production build for performance (transferred bytes / requests / DOM / timing).

**What this pass did NOT do (limitations, stated up front):**
- **Animations were not numerically re-sampled this pass.** Skew angles, translate ranges, durations, easing, loop periods, stagger were originally built from live measurements (see prior section commits) but I did **not** re-capture live-vs-mine transform/opacity curves in this audit. Treat every animation row below as "believed matching, not re-verified this pass" and schedule an animation-only follow-up.
- Hover/focus states were checked only where noted (footer pills, header, RW cursor from prior work); not exhaustively re-triggered on every element this pass.
- **Lighthouse was not run** (not installed in the tooling env). Performance is reported via transferred bytes / request count / DOM nodes / load timing instead — the substantive parts of the same picture.

---

## Summary counts by severity

| Severity | Count |
|---|---|
| **Blocker** | 2 |
| **Obvious** | 6 |
| **Minor** | 7 |
| **Nitpick** | 2 |
| **Investigate** | 1 |
| **Perf (separate)** | 1 blocker + notes |

The single biggest theme: **desktop (1440) matches live closely across every section, but my tablet breakpoint (~768–1279) diverges** — I scale several headings with fluid `clamp/vw` or shrink them at 1280, while live holds desktop sizes down to ~810 and then steps hard to phone size. The About section even changes layout at tablet on live (portrait hidden) and mine does not.

---

## Top 10 to fix first (most visible)

1. **About @tablet layout** — live hides the portrait, bio goes full-width, heading stays **80px**; mine keeps portrait + narrow bio at **48px**. (Blocker)
2. **GIF payload** — my card-2/card-4 GIFs total **31 MB** (`rw-c4-c` 14.8, `rw-gamify-a` 7.7, `rw-gamify-b` 7.5) vs live's ~7.9 MB. Convert to `webm`/`mp4` or optimize. (Perf blocker)
3. **Hero PRODUCT / role size @tablet** — live steps to 160px @1024 / 72px @768; mine fluid-scales to **200px @1024 / 142px @768** (up to 2× too big).
4. **PHOTOGRAPHING @tablet+mobile** — live 80px/600 @1024, 40px/600 @mobile; mine **56px @1024, 34px/500 @mobile** (too small + too light).
5. **ENGINEER TURNED ARTIST @1024** — live 40px, mine **24px**.
6. **Footer pale heading @mobile** — live 100px, mine **84px** (I added a `<400px` rule live doesn't have).
7. **Footer pill text @mobile** — live 20px, mine **18px**.
8. **Footer pale heading @desktop** — live `letter-spacing: normal`, `line-height: 1.0`; mine `-0.02em`, `line-height: 0.92`.
9. **Hero PRODUCT line-height** — live 1.1 (310px), mine 1.0 (282px); hero content sits ~40px lower in mine.
10. **GAMING title/caption line-heights** — live title lh 1.7 / caption very tight; mine title lh 1.2 / caption 1.1.

---

## Section-by-section differences

### 1. Header / nav
| Element | Live | Mine | Severity | Viewports |
|---|---|---|---|---|
| Résumé button | `letter-spacing: 0.04em` (0.64px @desktop, 0.56px @mobile) | `letter-spacing: normal` | Nitpick | all |
| About / Contact labels | 16px/600 #fff | 16px/600 #fff — **match** | — | — |
| Time counter, hover intro swap | present | present (built) | — | — |

Header nav otherwise matches (fonts, colors, layout).

### 2. Hero
| Element | Live | Mine | Severity | Viewports |
|---|---|---|---|---|
| PRODUCT line-height | 1.1 (310px) | 1.0 (282px); hero content ~40px lower | Minor | ≥1280 |
| PRODUCT/role **size @tablet** | 160px @1024, 72px @768 (stepped) | **200px @1024, 142px @768** (fluid) | **Obvious** | 768–1279 |
| Role cycler @desktop | 265px, ls −0.02em, lh 1.1 | 275.6px, ls −0.04em, lh 1.0 | Minor | ≥1280 |
| Role element renders **transparent** (`rgba(0,0,0,0)`) @390 in mine | filled | transparent — **investigate** which node | Investigate | 390/360 |
| Portrait / graffiti / face images | 631×770 / 231×140 / 112×240 | **same sizes & x** (40px lower y) | Minor (y offset) | — |
| O ring, WhatsApp hover ripple/fill, aurora, UTKARSH hover pill, scroll skew + X-shift | present | present (built from live) — **not re-sampled this pass** | (unverified) | — |

Hero portrait was a **false alarm** in the first capture (live image hadn't loaded → showed a wireframe); measured sizes match exactly.

### 3. Work Experience
| Element | Live | Mine | Severity | Viewports |
|---|---|---|---|---|
| Heading, subheading, rows (Spinny/TLC/GameZop), dates | as live | **match** | — | — |
| WORK EXPERIENCE heading @1024 | 48px | 48px — match | — | — |
| Spinny image reveal, pill cursor, 3 purple stat blocks + hover, number scramble, sticky/skew | present | present (built) — **not re-sampled** | (unverified) | — |

### 4. Recent Work
| Element | Live | Mine | Severity | Viewports |
|---|---|---|---|---|
| Heading, subheading, 4 cards, order, copy, annotations, stat boxes, links, media | as live | **match** (side-by-side) | — | — |
| Mid-page scroll length (RW→Testimonials) | shorter | ~600px **taller** in mine | Minor | ≥1024 |
| card-1 sweeper+ripple, card-2 rotate/slide, sticky-shrink stack, View cursor | present | present (built) — **not re-sampled** | (unverified) | — |

### 5. Things They Say
| Element | Live | Mine | Severity | Viewports |
|---|---|---|---|---|
| Heading, subheading, 3 cards, text, avatars, purple bg | as live | **match** | — | — |
| drag, auto-scroll speed, hover cursor | present | present (built) — **not re-sampled** | (unverified) | — |

### 6. More About Me
| Element | Live | Mine | Severity | Viewports |
|---|---|---|---|---|
| **Layout @tablet** | portrait **hidden**, bio **full-width**, heading 80px | portrait shown + narrow bio, heading 48px | **Blocker** | 810–1279 |
| Heading @1024 | 80px | **48px** | Obvious | 810–1279 |
| ENGINEER TURNED ARTIST @1024 | 40px | **24px** | Obvious | 810–1279 |
| Desktop bio, anchored script phrases, carets, tool ticker + LEARNING + Framer icon | as live | **match** @1440 | — | — |

### 7. When I Am Not Designing (Hobbies)
| Element | Live | Mine | Severity | Viewports |
|---|---|---|---|---|
| GAMING title line-height | 1.7 (47.6px) | 1.2 (33.6px) | Minor | ≥1280 |
| GAMING title @1024 / @390 | 28px / 20px, lh 1.7 | 26px / 22px, lh 1.2 | Minor | 1024/390 |
| Hobby caption (Square Peg) line-height | very tight (~10px @32) | ~1.1× (35px) | Minor | all |
| PHOTOGRAPHING letter-spacing @desktop | normal | 0.01em (0.8px) | Nitpick | ≥1280 |
| PHOTOGRAPHING @1024 / @mobile | 80px / 40px, weight 600 | **56px / 34px, weight 500** | Obvious | ≤1279 |
| Stacks + swipe, grid scale-in + lightbox, hobby popup | present | present (built) | — | — |

### 8. Footer
| Element | Live | Mine | Severity | Viewports |
|---|---|---|---|---|
| Pale heading letter-spacing / line-height @desktop | normal / 1.0 | −0.02em / 0.92 | Minor | ≥1280 |
| Pale heading size @mobile | 100px | **84px** (my `<400px` rule) | Obvious | ≤400 |
| Pill text size @mobile | 20px | **18px** | Obvious | ≤809 |
| Headings (SCROLLED/CAME/WORK/TALK) @desktop, pills, badge, colors, pill hover arrow | as live | **match** | — | — |
| GO TO TOP visibility + right-slide | present | present — match | — | — |
| Pinned entrance | ~8000px pinned gold | shortened to ~1 screen (**your choice**) | (authorized) | — |

### 9. Global
| Element | Live | Mine | Severity | Viewports |
|---|---|---|---|---|
| Custom cursor + difference blend + click-shrink | present | present | — | — |
| Smooth scroll | present | present | — | — |
| Horizontal overflow | none | **none @ all 8 widths** | — | — |
| Console errors | none | **none @ all 8 widths** | — | — |
| Reduced-motion | honored | honored (built) — not re-verified this pass | (unverified) | — |
| Framer badge | shown | **removed** (authorized) | — | — |

---

## Present on live but missing in my build
- **Footer giant role-word marquee** (DESIGNER/STRATEGIST/… drifting behind the CTA). Established earlier to be **positioned off-screen / invisible even at 2× contrast** on live, so omitting it changes nothing visible. Listing it for completeness.
- Nothing else section-level is missing; all 9 sections are present.

## Present in my build but NOT on live (extra)
- None identified.

---

## Authorized / intended deviations (NOT bugs)
- Time counter origin **7 Jan 2019, viewer-local** (~10-day gap vs live's counter).
- **Footer résumé** points to the header résumé file (live footer uses a separate Drive id on mobile).
- **WhatsApp `https://`** (live uses `http://`).
- **`rel="noopener noreferrer"`** added on `target="_blank"` links (live left rel empty).
- **"View"** pill on Recent Work cards (live says "See").
- **Framer "Made in Framer" badge removed** entirely.
- **Footer pinned scroll shortened** to ~1 screen instead of live's ~8000px (your choice this session).
- **Footer role-word marquee omitted** (invisible on live; confirmed).

---

## Performance (transferred bytes / requests / DOM / timing @1440, full scroll)

| Metric | My build (prod) | Live (Framer) | Verdict |
|---|---|---|---|
| **Total transferred** | **32.9 MB** | 25.6 MB | ✗ mine heavier |
| GIFs | **31 MB** (14.8+7.7+7.5) | 7.9 MB | ✗ **blocker** — optimize |
| Static images | avif 2.0 MB + webp 0.4 MB = **2.4 MB** | webp 13.6 MB + avif 2.7 MB = 16.3 MB | ✓ mine far lighter (avif) |
| **JavaScript** | **310 KB** (104 KB gz) | 1.69 MB | ✓ mine ~5× leaner |
| **CSS** | **44 KB** (9.4 KB gz) | (inlined) | ✓ lean |
| Fonts (woff2) | 110 KB | 97 KB | ≈ tie |
| **DOM nodes** | **671** | 933 | ✓ mine leaner |
| Requests | 65 | 74 | ✓ |
| DCL | 182 ms (localhost) | 287 ms (network) | not comparable (localhost vs internet) |

**Net:** my hand-written bundle is dramatically leaner on **JS, CSS, DOM, and static images** — but the **31 MB of unoptimized GIFs** blows the total past live and would tank a Lighthouse "Performance"/LCP score. Fix = encode the three GIFs as `webm`+`mp4` (or heavily optimize) → expected total well under live's 25 MB. Lighthouse mobile/desktop should be re-run after that (needs `npx lighthouse` + the served build).

---

## Honest bottom line
- **Desktop (1440/1920): near pixel-parity** across all 9 sections — the differences are line-height / letter-spacing nits + the footer pale-heading spacing.
- **Tablet (768–1279): the real gap.** My responsive typography (fluid hero, over-aggressive 1280 shrink) and the **About tablet layout** (portrait not hidden, bio not full-width) diverge visibly from live. This is where "marked done earlier" ≠ "matches" — the earlier per-section work was validated mostly at 1440 + phone, and the middle breakpoints drifted.
- **Mobile (390/360): close**, with three concrete size diffs (footer heading 84→100, footer pill 18→20, PHOTOGRAPHING 34→40/600).
- **Perf:** leaner everywhere except the GIFs, which are the one blocker.
