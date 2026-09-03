# Claude Code Prompt — Pixel-Exact Rebuild of uxuiuv.framer.website

---

## PROJECT

Rebuild my portfolio site — **https://uxuiuv.framer.website/** — as a fresh, hand-written, high-performance codebase.

The current site is built in Framer. It looks and behaves exactly how I want it to. The only problem is that it is heavy and slow. Your job is to produce a **visually and behaviourally identical replica** that loads fast.

**The live site is the single source of truth. Not your taste, not best practices, not "improvements".**

---

## THE ONE RULE

> **Nothing changes. Everything must look, move and behave exactly as it does on the live site right now.**

That means, exactly identical:

- Layout and spacing at every breakpoint
- Colors (every fill, stroke, gradient, overlay, blend mode, opacity)
- Fonts (family, weight, size, line-height, letter-spacing, text-transform, optical alignment)
- All sections, and in the same top-to-bottom order
- All copy, word for word, including punctuation, casing and line breaks
- All scroll animations, including scroll-linked `transform` properties (translate, scale, rotate, skew), their exact input ranges (scroll progress) and output ranges
- All entrance/exit animations, hover states, cursor behaviour, marquees, tickers, loops, counters, stagger delays, durations and easing curves
- All images, GIFs, icons and their crop/fit/position
- Scroll behaviour itself (if there is smooth scroll / lenis-style damping, reproduce it; if there isn't, don't add it)

If something on the live site looks like a mistake to you — **it is not a mistake, it is the design.** Reproduce it.

---

## WHAT YOU MUST NOT DO

- ❌ Do **not** redesign, "clean up", "modernise", simplify or improve anything
- ❌ Do **not** substitute fonts, colors, spacing, radii or shadows with "close enough" values
- ❌ Do **not** drop, merge, reorder or add sections
- ❌ Do **not** replace a scroll-linked animation with a simple fade-in or CSS transition because it's easier
- ❌ Do **not** change copy, capitalisation or punctuation
- ❌ Do **not** silently guess. If you cannot determine an exact value, **ask me.**
- ❌ Do **not** invent placeholder content or lorem ipsum
- ❌ Do **not** start writing production code before Phase 1 and Phase 2 below are complete and I have approved

---

## WORKFLOW — FOLLOW THESE PHASES IN ORDER

### PHASE 1 — AUDIT (no code yet)

Open the live site and inspect it properly — DOM, computed styles, network tab, the served CSS and JS bundles, `@font-face` declarations, and the rendered animation state at multiple scroll positions. Framer sites ship their own CSS with real computed values; use them rather than eyeballing.

Produce an `AUDIT.md` containing:

1. **Section inventory** — every section in order, with a name, a description, its full copy, and its assets.
2. **Design tokens** — exact hex/rgba for every color used, the full type scale (family, weight, size, line-height, letter-spacing per element), spacing scale, border radii, shadows, blur/backdrop values.
3. **Font inventory** — every font family and weight actually loaded, the source of each file, and the format (woff2 etc.).
4. **Asset inventory** — every image/GIF with its URL, intrinsic dimensions, and where it's used.
5. **Animation inventory** — this is the most important part. For every animated element, document:
   - trigger (scroll progress, in-view, hover, load, infinite loop, time-based)
   - the exact properties animated
   - input range → output range for scroll-linked transforms
   - duration, delay, stagger, easing (cubic-bezier values or spring stiffness/damping/mass)
   - whether it plays once or every time, and whether it reverses
   - sticky/pinned behaviour and the pin duration
6. **Breakpoint map** — the exact breakpoint widths Framer is using, and what changes at each. Note: the Framer site renders separate variants per breakpoint, so the same content appears more than once in the DOM. Do not treat those duplicates as repeated sections — map them to one responsive implementation that matches each breakpoint's layout exactly.
7. **Open questions** — everything you could not determine with certainty.

Then **stop and show me the audit.** Do not proceed until I confirm.

### PHASE 2 — PLAN + ASK ME FOR WHAT YOU NEED

Give me:

- Your proposed stack and *why*, with the constraint that animation fidelity comes first and bundle size second. (Framer is built on Motion / framer-motion internally — using Motion in the rebuild is usually the most reliable way to reproduce the exact easing and spring behaviour. Tell me if you disagree and why.)
- Your file/folder structure.
- **A single explicit list of everything you need from me.**

  Two things are already settled, so do not ask about them:
  - **Images, GIFs and icons:** you extract these yourself from the live site at the highest resolution available (see the ASSETS section below for how). Don't ask me to export them.
  - **Fonts:** I am placing the original font files in a `/fonts` folder in the project root. Use those files. If a family or weight you need is missing from that folder, tell me the exact family name and weight and I'll add it — do not substitute a lookalike or fall back to a system font.

  Anything else you need — the Figma file, favicon, OG image, résumé PDF, LinkedIn testimonial content, analytics keys, the deploy target — ask for it in one clear list. Do not work around a missing asset by approximating it.
- **A list of anything you believe you cannot reproduce faithfully in code**, with the reason and your proposed options. Tell me this *before* you build it, not after.

Then **stop and wait for my approval.**

### PHASE 3 — BUILD

Build section by section, in page order. After each section:

- Run it locally
- Screenshot your build and the live site at the **same** viewport widths and the **same** scroll positions
- Compare them side by side and list any differences you can see
- Fix the differences before moving to the next section

Do not batch five sections and hope. One section at a time.

### PHASE 4 — VERIFY

Before you tell me it's done:

- Side-by-side comparison at minimum **1920, 1440, 1280, 1024, 768, 430, 390 and 360px** widths
- Scroll-through comparison capturing every scroll-triggered animation at start, middle and end of its range
- Confirm every animation's timing matches — a section that animates over 800ms must not animate over 300ms
- Confirm all links, mailto, WhatsApp link, résumé link and anchor scrolls work
- Confirm hover states, focus states and cursor behaviour match
- Report Lighthouse scores (performance, accessibility, best practices, SEO) and total transferred bytes, and compare against the Framer site
- Give me a written list of **every** known deviation from the original, however small. Do not hide anything.

---

## PERFORMANCE TARGETS

The whole point of this rebuild is speed. Aim for:

- Lighthouse performance ≥ 90 on mobile
- LCP < 2.0s, CLS < 0.05, INP < 200ms on a mid-tier device
- All images self-hosted, converted to WebP/AVIF with correct `srcset`/`sizes`, width/height set to prevent layout shift, lazy-loaded below the fold
- Fonts self-hosted, subset, `woff2`, preloaded, `font-display: swap` (only if it doesn't cause a visible flash that the original doesn't have)
- Animation work on the compositor where possible — `transform` and `opacity`, not layout-triggering properties
- Ship as little JS as possible **without sacrificing any animation fidelity**. Fidelity wins if the two ever conflict.

Respect `prefers-reduced-motion` with a sensible fallback, and tell me what that fallback does.

---

## ASSETS

### Images — you extract these yourself, at maximum resolution

All current assets are hosted on `framerusercontent.com`. Download every one of them, self-host them in the repo, and do not hotlink to Framer in the final build.

**Get the original, not the resized version.** Framer serves images through an image CDN and the URLs in the DOM carry downscaling parameters. Follow this order:

1. Take the asset URL and **strip the entire query string** (`?width=…&height=…`, `?scale-down-to=…`, `?lossless=…`). The bare URL — e.g. `https://framerusercontent.com/images/IWdo08dy1SBtkPucLvwPp046Fug.png` — serves the original upload at full resolution. Verify by comparing the returned file's intrinsic dimensions and byte size against the resized version.
2. If a bare URL fails, take the **largest candidate in that element's `srcset`**.
3. Also sweep sources the DOM inspector alone will miss: CSS `background-image` and `mask-image` URLs in the stylesheets, inline SVGs, `<use href>` references, video/poster attributes, the favicon set, and the OG image in the `<head>`.

Then:

- Record every asset's **intrinsic width × height before any conversion** and put it in the audit — this is what tells you whether you actually pulled the original.
- Keep the untouched originals in a `/assets/original` folder, committed. Generate the optimised WebP/AVIF variants from those, never from an already-downscaled copy.
- Never upscale. If an original is genuinely low-resolution, that is how it is on the live site — keep it, and note it in the audit.
- **GIFs:** preserve them as animations. Converting to a static frame or to a video with different timing is a change. If you want to propose an animated-WebP or video swap for weight, ask first and show me a comparison.
- Cross-check your final asset count against the audit's asset inventory. If any image on the live site has no corresponding file in the repo, that is a bug.

### Fonts — I am providing these

I am putting the original font files in a **`/fonts` folder in the project root**. Use those files; self-host them; subset and convert to `woff2`.

Before you use them, confirm from the live site exactly which families, weights and styles are actually loaded (read the `@font-face` rules in the served CSS, not just what looks right). If anything you need is missing from the folder, **tell me the exact family name, weight and style and I will add it.** Do not substitute a visually similar font, do not fall back to a system stack, and do not download the font from Framer's CDN instead — Framer's font licensing covers Framer-hosted sites and may not cover self-hosting on my own domain.

---

## HOW TO HANDLE UNCERTAINTY

This matters more than anything else in this prompt:

- **Ask me as many questions as you want. There is no limit.** I would much rather answer twenty questions than receive a site that is 90% right.
- Ask before you build, not after.
- If you are unsure about a value, an easing, a behaviour or an asset — **ask.**
- If something is ambiguous, do not pick the interpretation that is easiest to implement.
- If you genuinely cannot do something, say so plainly and early, and tell me what you'd need to make it possible.
- Batch your questions where sensible so I can answer them in one go.

Start with Phase 1 now. Ask me anything you need before you begin.
