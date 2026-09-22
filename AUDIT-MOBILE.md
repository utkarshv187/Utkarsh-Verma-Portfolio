# Mobile audit — my build vs live (uxuiuv.framer.website)

**Scope:** mobile widths only — **430, 414, 390, 375, 360, 320**. Desktop/tablet not audited this pass.
**Method:** headless Chromium with mobile emulation (`isMobile`, `hasTouch`, iPhone UA, DPR 2) loading
both sites at each width; computed styles read off matching elements on **both** (font family/size/
weight/letter-spacing/line-height/color, box sizes, positions, section bg); full-page screenshots
composited; horizontal-overflow + console sweep at every width; touch interactions driven in a real
touch browser (tap/press/scroll) and compared. "Measured" values below are `getComputedStyle`, not eyeballed.

Primary reference width: **390**. Values quoted as **mine → live** unless noted.

---

## Global results (all mobile widths)

| Check | Result |
|---|---|
| **Horizontal overflow** | **None on mine or live** at 430/414/390/375/360/320 (`scrollWidth ≤ innerWidth` every width). |
| **Console errors** | **Live:** none functional (only transient `net::ERR_CONNECTION_RESET` on some loads). **Mine:** 1 repeating **React dev warning** — "React does not recognize the `fetchPriority` prop" (from the hero portrait `<img fetchPriority>`). Harmless at runtime but it is a real console error. |
| **Custom cursor on touch** | **Correct** — mine renders **no `.cursor` element at all** on mobile (0 cursor nodes); `body { cursor: auto }`. Not stuck, not visible. Matches live (no custom cursor on touch). |
| **Framer badge** | Live shows the "Made in Framer" badge; mine removed it — **authorized deviation, not a bug**. |
| **Reduced-motion / smooth scroll** | Present on mine (rAF smooth scroll, `prefers-reduced-motion` guards intact). |

---

## Section-by-section differences

`Section | Element | Live | Mine | Severity | Widths`

### 1. Header
| Section | Element | Live | Mine | Severity | Widths |
|---|---|---|---|---|---|
| Header | Layout | logo + mail icon + WhatsApp icon + Résumé; **no** counter, **no** hamburger/menu | same: logo + mail + WhatsApp + Résumé, counter hidden, no hamburger | — (match) | all |
| Header | "Designing for" counter | hidden on mobile | hidden on mobile (`.header__intro-wrap{display:none}`) | — (match) | all |
| Header | Résumé pill width | ~93px | ~101px | nitpick | all |

*No hover-only trap: About/Contact don't exist in the mobile header on either build (they're desktop-nav only).*

### 2. Hero
| Section | Element | Live | Mine | Severity | Widths |
|---|---|---|---|---|---|
| Hero | **Portrait / column** | centered **fixed column ~390**: portrait **306×396**, centred (x≈42) | **full-bleed**: portrait = **viewport-width × 640** (430/390/375/360/320 wide), top-anchored | **obvious** | all (worse at 430) |
| Hero | PRODUCT size/weight/tracking/color | 74px / 700 / -0.04em / #EEEEFF | 74 / 700 / -0.04em / #EEEEFF | — (match) | all |
| Hero | **PRODUCT line-height** | **1.1** (81.4px) | **1.5** (111px) → extra gap under PRODUCT | minor | all |
| Hero | Role waterfall sizes | 72 / 48 / 40 / 32 / 28 / 28 | 72 / 48 / 40 / 32 / 28 / 28 | — (match) | all |
| Hero | Rotating badge / O-ring / WhatsApp-on-O | hidden on mobile | hidden on mobile | — (match) | all |
| Hero | "UTKARSH VERMA" graffiti | hidden on mobile | hidden on mobile | — (match) | all |
| Hero | Aurora / yellow diagonal accent | present | present | — (match) | all |

### 3. Work Experience
| Section | Element | Live | Mine | Severity | Widths |
|---|---|---|---|---|---|
| WE | Heading "WORK EXPERIENCE" | 31 / 700 / lh 37.2 (1.2) / #0E0C20 | 31 / 700 / **lh 35.65 (1.15)** | nitpick | all |
| WE | Subtitle "BASED IN DELHI…" | 16 / 700 / lh 24 / #fff | 16 / 700 / **lh 22.4 (1.4)** | nitpick | all |
| WE | **Stat label** (YEARS OF EXPERIENCE…) | **16px** / 600 | **20px** / 600 | **obvious** | all |
| WE | Stat value (7+/30+/1M+) | 60px / 700 | **64px** / 700 | nitpick | all |
| WE | Number scramble on scroll-in | present | present | — (match) | all |
| WE | **Spinny highlights image** | **not shown on mobile** (no image in the WE section) | **shown** — the reveal latches open on the first touch/scroll of the section | **obvious (extra in mine)** | all |
| WE | Row stacking | company on top, role/date below | same | — (match) | all |

### 4. Recent Work
| Section | Element | Live | Mine | Severity | Widths |
|---|---|---|---|---|---|
| RW | 4 cards stack | vertical, non-sticky on mobile | vertical, non-sticky | — (match) | all |
| RW | Heading | 31 / 700 / #0E0C20 | 31 / 700 | — (match) | all |
| RW | Stat number | 20 / 600 / #fff | 20 / 600 / #fff | — (match) | all |
| RW | Stat label | 10 / 600 / teal | 10 / 600 / teal | — (match) | all |
| RW | Stat boxes wrap | ≤2 lines, no overflow | ≤2 lines, no overflow | — (match) | all |
| RW | Card links on tap | whole card is a link → new tab | same | — (match) | all |

### 5. Things They Say
| Section | Element | Live | Mine | Severity | Widths |
|---|---|---|---|---|---|
| TTS | Cards present | yes | yes | — (match) | all |
| TTS | Swipe/drag + auto-scroll | present (touch drag) | present (pointer-driven drag + auto-scroll) | — (match, see touch note) | all |

### 6. More About Me
| Section | Element | Live | Mine | Severity | Widths |
|---|---|---|---|---|---|
| About | Portrait on mobile | **hidden** | **hidden** | — (match) | all |
| About | Heading / subhead (ENGINEER TURNED ARTIST) | 31 / 700 gold · 16 / 700 white | 31 / 700 gold · 16 / 700 white | — (match) | all |
| About | Bio + 5 Square-Peg script phrases + 5 carets | "mentor, storyteller / & improving / products & businesses / sometimes unconventional / if not, then we correct & make it work" | identical text, 5 carets | — (match) | all |
| About | Tool ticker (drag on touch) | present | present | — (match) | all |

### 7. When I Am Not Designing
| Section | Element | Live | Mine | Severity | Widths |
|---|---|---|---|---|---|
| Hobbies | **Intro "WHEN I AM NOT DESIGNING"** | **16px** / 700 | **24px** / 700 | **obvious** | all |
| Hobbies | Stacks (one per row) + swipe | single column, swipe cycles | single column, swipe cycles | — (match) | all |
| Hobbies | Tap → 2×2 photo popup | works on tap | **works on tap (verified)** | — (match) | all |
| Hobbies | PHOTOGRAPHING title | 40 / 600, ls normal | 40 / 600, **ls 0.4px (0.01em)** | nitpick | all |
| Hobbies | PHOTOGRAPHING grid columns | **2 per row** | **2 per row** | — (match) | all |
| Hobbies | Grid image count | **14** (even, clean 2-up) | **15** → **orphan alone in the last row** | minor | all |
| Hobbies | Lightbox on tap | opens | opens (same `.hob__lb` mechanism) | — (match) | all |

### 8. Footer
| Section | Element | Live | Mine | Severity | Widths |
|---|---|---|---|---|---|
| Footer | Heading variant on mobile | "CAME THIS FAR?" (narrow) 100 / 700 / lh 90 / -2px / white-56% | same text, 100 / 700 / lh 90 / -2px / white-56% | — (match) | all |
| Footer | Section bg | gold #FFB705 | gold #FFB705 | — (match) | all |
| Footer | **Contact pills** | content-width (~172px), **centred** | **full-width (100%)**, stretched | minor | all |
| Footer | Pill text style | 20 / 600, green number / blue email | 20 / 600, green / blue | — (match) | all |
| Footer | Contact tap | pill is a link → opens (WhatsApp new tab / mailto) | same | — (match) | all |
| Footer | GO TO TOP | present | present | — (match) | all |

### 9. Global mobile
| Section | Element | Live | Mine | Severity | Widths |
|---|---|---|---|---|---|
| Global | Custom cursor on touch | none | none (disabled, not stuck) | — (match) | all |
| Global | Horizontal overflow | none | none | — (match) | all |
| Global | Console | clean (network blips only) | 1 React `fetchPriority` dev warning | minor | all |
| Global | Framer badge | present | removed (authorized) | — (intended) | all |

---

## Missing / Extra / Broken

- **Missing in mine (on live, absent on mine):** none found.
- **Extra in mine (on mine, not on live):**
  - **Spinny "Highlights at Spinny" reveal image appears on mobile** (opens on first touch of the Work
    Experience section). Live does not show this image at mobile widths. *(obvious)*
- **Overflow / broken layout:** none at any mobile width on either build.
- **Dead touch interactions (hover-only, no tap path):** none. Everything hover-driven on desktop is
  either hidden on mobile (hero O-ring/WhatsApp, UTKARSH graffiti, header Contact/About) or has a working
  touch path (hobby tap-popup ✅ verified, hobby swipe, RW card links, footer pill links, testimonials drag,
  tool-ticker drag, Spinny reveal opens on touch).

---

## Authorized deviations (intended — excluded from the bug list)

- Framer "Made in Framer" badge removed.
- Counter origin date, WhatsApp `https://api.whatsapp.com/…918869808079…` URL, "View" vs "See" cursor
  label, résumé link `target`, `rel="noopener noreferrer"` added on external links.

---

## Summary

**Counts by severity**
- **Blocker:** 0
- **Obvious:** 4 — hero full-bleed vs centred column; hobby intro 24 vs 16; WE stat label 20 vs 16; Spinny reveal extra on mobile.
- **Minor:** 4 — footer pills full-width vs centred; PHOTOGRAPHING grid orphan (15 vs 14); PRODUCT line-height 1.5 vs 1.1; React `fetchPriority` console warning.
- **Nitpick:** 5 — WE stat value 64 vs 60; WE subtitle lh 22.4 vs 24; WE heading lh 35.65 vs 37.2; PHOTOGRAPHING title ls 0.4px vs normal; Résumé pill width ~101 vs ~93.

**Top 10 most visible mobile issues to fix first**
1. **Hero is full-bleed on mobile; live is a centred ~390 column** (portrait 306 centred vs full-width). Biggest visible layout gap. *(obvious)*
2. **Hobby intro "WHEN I AM NOT DESIGNING" is 24px; live is 16px.** *(obvious)*
3. **Work-Experience stat labels are 20px; live is 16px.** *(obvious)*
4. **Spinny highlights image shows on mobile; live hides it at mobile widths** — remove/guard the reveal below the phone breakpoint. *(obvious)*
5. **PHOTOGRAPHING grid leaves an orphan (15 images, last row = 1); live shows 14 even** — drop one on mobile like the tablet fix. *(minor)*
6. **Footer contact pills are full-width; live keeps them content-width, centred.** *(minor)*
7. **Hero PRODUCT line-height 1.5 → gap under PRODUCT too large; live is 1.1.** *(minor)*
8. **WE stat value 64px vs live 60px.** *(nitpick)*
9. **WE subtitle / heading line-heights slightly tighter than live** (22.4 vs 24; 35.65 vs 37.2). *(nitpick)*
10. **PHOTOGRAPHING title has 0.4px tracking; live is normal.** *(nitpick)*

**Confirmed:** **no horizontal overflow at any mobile width (430/414/390/375/360/320)** on either build,
and **no functional console errors** on mine except the one React `fetchPriority` dev warning (live shows
only transient network resets). No fix was applied — this pass is findings only.
