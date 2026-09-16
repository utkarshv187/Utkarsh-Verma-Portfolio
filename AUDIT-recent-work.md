# AUDIT — RECENT WORK section (live: uxuiuv.framer.website)

Audited at 1440×900 (desktop variant). Tablet/phone variants exist in the DOM and are **not yet audited** (see Open Questions).

## 1. Layout & order
Section sits after WORK EXPERIENCE. Order top→bottom:
1. `RECENT WORK` heading
2. `I LOVE BLENDING ART & TECHNOLOGY` sub-heading
3. Three project cards that **sticky-stack** as you scroll.

- **Section background:** `#ECECF5` (rgb 236,236,245) — light lavender-grey. (Container `data-framer-name="Solid Part work"`.)
- **Content column:** 1200px wide, centred (120px side margins at 1440).

## 2. Headings (type 1:1)
| Text | Font | Size / line-height | Weight | Color | Letter-spacing |
|---|---|---|---|---|---|
| `RECENT WORK` | Clash Display | 80px / 96px | 700 | `#0E0C20` (rgb 14,12,32) | normal |
| `I LOVE BLENDING ART & TECHNOLOGY` | Clash Display | 40px / 56px | 700 | `#6C37B2` (rgb 108,55,178) | normal |

(Heading may be a doubled/outline treatment — to re-verify at build, see Open Q4.)

## 3. The three cards
All cards: **1200 × 620**, `border-radius: 24px`, `padding: 48px`, `position: sticky`, `z-index: 1` (later card in DOM paints over earlier → card 3 on top).

| # | Title (Satoshi 900, 56px, white) | Card bg | Sticky `top` | Link (`target=_blank`) |
|---|---|---|---|---|
| 1 | Spinny's car auction app PLP redesign | `#0F0C20` navy | 132px | https://auction-plp-redesign-by-uv.vercel.app/ |
| 2 | Introduced a tier based gamification | `#56239A` purple | 146px | https://gamification-by-uv.vercel.app/ |
| 3 | Established the Spinny design system | `#0F0C20` navy | 160px | https://www.figma.com/design/iBOEPZFnnHc4BZ3FtVsQZ7/Spinny-Design-System---Styles---Components?node-id=2-4101 |

Card `<a>` = whole card, `cursor: pointer`, no card-level lift/scale on hover.

### Left media (per card)
- **Card 1 — before/after comparison slider.** Two phone screenshots (OLD vs NEW PLP) overlaid in one phone frame; a **draggable** centre divider wipes between them. Round handle reads `< >`, changes to **"See ↗"** on hover. Flanking annotations: *"The former product listing page"* (red script + red arrow) on a lavender **×-pattern** panel; *"The new and better product listing page"* (teal script + teal arrow) on a cream **+-pattern** panel.
  Assets: phone screenshots `Hc8qhenVvOzLFygH7bRBkqgUo.jpg` (tall), `wJSpzHHWPlexbIf1wtaEMsSiKjM.gif`, `w1Uk2Z8nPI65mdCgH1IKeD5A.jpg`, `ekzcQGySZuDI6aO6napaJLM7l4.jpg`, `O7otRCPpiunRfMOoFypvX76Zw.png`; pattern bgs `PqGj8J2MVkxfOEclM8s4LM1lfiY.jpg`, `eKISVOiUdQcSF8TrYhBxq1COg.jpg`, `BeRbTT6Zpf9Eybwmy9WStsO0hGg.jpg`.
- **Card 2 — two animated GIFs** of the gamification screens (GOLD/coins/2x + "TIER UPGRADED"), overlapping, on a dotted cream panel. Assets: `bAXnzVrKeF5riTiESNxjpvqOWWM.gif` (200×438), `xkzkmWXB2AV2EIqCliUZyQEHw.gif` (253×552), bg `BeRbTT6Z…jpg`. **GIFs kept animated.**
- **Card 3 — one Figma design-system screenshot** `upit0LYDKKJSw1HtFId1F3CeUM.jpg` (intrinsic 1440×1738), bled off the left edge.

### Stat callouts (2×2 grid; tiles 254×85, radius 8px, gap ~24px)
- Number: **white**, ~32px, weight ~600. Label: 2 lines, **16px/600 Clash Display**.
- Tiles/labels are **teal** `rgba(37,197,179,.12)` bg + `#25C5B3` label (cards 1 & 3) OR **gold** `rgba(255,182,1,.16)` bg + `#FFB601` label (card 2).
- Numbers **scramble/decode** in on scroll-in (observed "40Z" mid-decode → settles "40%"), same effect as the hero / WORK EXPERIENCE counters.

| Card 1 (teal) | Card 2 (gold) | Card 3 (teal) |
|---|---|---|
| **13%** MORE USER / RETENTION | **18%** MORE USER / RETENTION | **1000+** VARIANTS DESIGNED / & DEVELOPED |
| **9%** REVENUE / GROWTH | **7%** SURGE IN / REVENUE | **1/3** DESIGN / BANDWIDTH SAVED |
| **40%** DROP IN / CARS MISSED | **31%** RISE IN / BIDS MADE | **1/4** DEVELOPMENT TIME / REDUCED |
| **2x** SHOOT UP / IN NPS | **14%** REDUCED T.A.T OF / CAR DELIVERIES | **MAX** CONSISTENCY / ACHIEVED |

## 4. Scroll / stacking mechanic (the important part)
- Each card is `position: sticky` with an increasing `top` (132 → 146 → 160).
- **Entrance:** as a card scrolls into view it rises in — `opacity 0→1`, `translateY +40px→0` (~300px of scroll).
- **Stack push:** once pinned, each card gets a scroll-linked `translateY` that scrubs 0 → a negative value as the **next** card rises to stack on top of it, then holds:
  - card 1 → **−105px**, card 2 → **−72px**, card 3 → **−38px**.
  - Combined with the sticky tops, the final pinned tops land ≈ **27 / 74 / 122px** → each card peeks ~**47px** above the one in front.
- Later card paints over earlier (DOM order), so the stack builds front-to-back with card 3 on top.
- On exit, the whole stack scrolls up and away as the next section arrives.
- (Transform ranges sampled at 320px steps; will fine-sample the exact scrub curves during build.)

## 5. Assets to extract (originals, query-string stripped)
Phone/screens: `Hc8qhenVvOzLFygH7bRBkqgUo.jpg`, `O7otRCPpiunRfMOoFypvX76Zw.png`, `wJSpzHHWPlexbIf1wtaEMsSiKjM.gif` (animated), `w1Uk2Z8nPI65mdCgH1IKeD5A.jpg`, `ekzcQGySZuDI6aO6napaJLM7l4.jpg`, `bAXnzVrKeF5riTiESNxjpvqOWWM.gif` (animated), `xkzkmWXB2AV2EIqCliUZyQEHw.gif` (animated), `upit0LYDKKJSw1HtFId1F3CeUM.jpg`. Pattern bgs: `PqGj8J2MVkxfOEclM8s4LM1lfiY.jpg`, `eKISVOiUdQcSF8TrYhBxq1COg.jpg`, `BeRbTT6Zpf9Eybwmy9WStsO0hGg.jpg`. (I extract these myself.)

## 6. Open questions
1. **Card 1 before/after slider** — confirmed draggable; I'll build it as a draggable wipe (default divider at centre) inside the phone frame, handle `< >`→"See ↗". OK? Any auto-animate on it, or drag-only?
2. **Number scramble** — reproduce the same decode effect as the hero/WORK EXPERIENCE counters (charset A–Z0–9, ~1s, trigger on in-view). Confirm.
3. **The two script annotations + curved arrows** on card 1 — reproduce as script-font text + inline SVG arrows (matching position/colour), not as flattened images. OK?
4. **Heading treatment** — single fill vs. doubled/outline; will match whatever the live computed style shows.
5. **Tablet/phone** — not yet audited; I'll audit those variants before building the responsive layout.
