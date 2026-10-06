# Answers to §7 — proceed once these are applied

Standing rule from PROMPT.md still holds: where an answer below says "match the original", that means observe the live site and reproduce it, not pick what seems reasonable. Where you still can't determine something, ask again rather than guessing.

---

**1. Caveat Brush**

Self-host it yourself. It's a Google Font under the SIL Open Font License, so self-hosting is permitted — download it, subset it, convert to woff2, commit it to the repo. Do not add it to `/fonts` as a request to me, and do not load it from Google's CDN in the final build.

Confirm from the live site which weight(s) and style(s) are actually used before you subset, and confirm the subset still covers every glyph that appears on the page (including any punctuation, ampersands, carets or accented characters in the annotated "MORE ABOUT ME" section).

---

**2. "Designing for" counter**

**Origin timestamp — use this, it is authoritative:**

```js
new Date(2019, 0, 7, 0, 0, 0, 0)   // 7 Jan 2019, midnight, viewer-local
```

Parse it in the **viewer's local timezone**, not UTC. Visitors in different timezones will therefore see slightly different readings; that is intended.

**This is an authorised deviation from the live site — do not "correct" it.**

The live site currently runs off a different origin. At approximately 2026-09-03 09:05 UTC it displayed `7y 8m 5d 15h 37m 53s`, which works backwards to roughly 28 Dec 2018. The value above is what I want going forward, so the rebuilt counter will read about **10 days lower** than the Framer site.

Consequences you must handle:

- In Phase 4, the counter will not match the live site. **This is expected.** List it under authorised deviations, not as a bug, and do not adjust the origin to make the two agree.
- Do not extract the origin from the Framer bundle and use it. If you do happen to see what the bundle uses, report it to me as information only.

**Everything else about the counter still has to match the original exactly:**

- **The date-difference algorithm.** Calendar-aware year/month arithmetic and fixed-length approximations (month = 30 days, year = 365 days) diverge by several days over a 7-year span. Determine how the original computes the `y / m / d / h / m / s` breakdown from its origin and reproduce that exact logic, including rollover behaviour at month and year boundaries.
- **Display format** — unit labels, spacing, separators, zero-padding, and what happens to a unit when it hits zero.
- **Update interval**, and whether it keeps ticking when the tab is backgrounded.
- **Typography and layout** — this text must not reflow or shift width as digits change. Match how the original prevents that (tabular figures, fixed-width containers, or whatever it actually does).

Sanity check before you move on: with the origin above, on 3 Sept 2026 the counter should read approximately `7y 7m 27d`. If your implementation produces something materially different, your difference algorithm is wrong — tell me rather than adjusting the origin to compensate.

---

**3. Testimonials**

Transcribe every card verbatim from the live site — full text, names, titles, punctuation, casing, line breaks. No summarising, no tidying, no "…" truncation that the original doesn't have.

My DOM read suggests **3 cards**, all linking to `https://www.linkedin.com/in/uxuiuv/`. Confirm the count from the desktop variant and tell me if it differs.

Pause-on-hover, autoplay, scroll/drag behaviour, loop direction and speed: **match the original.** Observe it, don't decide it. If the cards are a carousel, also match its wrap behaviour at the ends.

---

**4. GIFs — yes, prototype the swaps**

Go ahead and build animated-WebP and video variants and show me a side-by-side before anything is committed. 22 MB is worth attacking. But the acceptance bar is playback fidelity, not file size:

- Same frame rate, same total duration, same loop timing, same loop count
- Autoplay behaviour identical, with no visible first-frame freeze
- No perceptible quality loss at the size the asset actually renders at

Known risk to account for and report on: `<video>` does not autoplay on iOS in Low Power Mode, while a GIF always plays. If you go the video route, `muted` + `playsinline` + `autoplay` are all mandatory, and you must still tell me what happens in Low Power Mode. Animated WebP behaves like a GIF and is usually the safer swap.

Present both options with actual byte sizes and your recommendation. Keep the untouched original GIFs in `/assets/original` regardless of what we ship.

---

**5. Résumé — there are currently two different files**

The live site linked two different (now outdated) Google Drive résumés; as of 2026-10-06 every résumé link uses the one updated file:

- Header/nav → `https://drive.google.com/file/d/1tfhAWJ2jAmRjVymT_v4HQ_srxkQiQlTi/view?usp=drive_link`
- Footer → `https://drive.google.com/file/d/1tfhAWJ2jAmRjVymT_v4HQ_srxkQiQlTi/view?usp=drive_link`

Use this one in **both** places:

> `https://drive.google.com/file/d/1tfhAWJ2jAmRjVymT_v4HQ_srxkQiQlTi/view?usp=drive_link`

Flag it back to me if you find a third résumé link anywhere else on the site.

---

**6. Favicon / OG**

Reuse the current assets. Current OG image is `https://framerusercontent.com/images/sB6wpIS7XS4U6nhva4i10xBcI.png` — download the original, self-host it, keep the same image.

Requirements:

- `og:image` and `twitter:image` must be **absolute URLs on the new domain**. Relative paths break link previews on every platform.
- Carry over the existing `og:title`, `og:description`, `twitter:card` and `canonical` values, with the canonical pointing at the new domain.
- Reproduce the full favicon set actually served (all sizes, apple-touch-icon, any manifest), not just a single `favicon.ico`.

---

**7. Links — confirmed**

| Where | URL |
|---|---|
| WhatsApp | `api.whatsapp.com/send/?phone=918869808079&text=Hi+Utkarsh%2C+I+visited+your+portfolio+and+would+like+to+discuss+an+opportunity.&type=phone_number&app_absent=0` |
| Email | `mailto:utkarshv187@gmail.com` |
| Connect / LinkedIn | `https://www.linkedin.com/in/uxuiuv/` |
| Auction PLP project | `https://auction-plp-redesign-by-uv.vercel.app/` |
| Gamification project | `https://gamification-by-uv.vercel.app/` |
| Spinny Design System card | `https://www.figma.com/design/iBOEPZFnnHc4BZ3FtVsQZ7/Spinny-Design-System---Styles---Components?node-id=2-4101` |

Two fixes and one query:

- The WhatsApp link is currently `http://`. Change it to **`https://`**. This is the one deliberate change I'm authorising; keep the query string byte-identical, including the encoded prefilled message.
- Preserve the `#home` anchor and the "GO TO TOP" behaviour exactly, including whether it animates or jumps.
- **Query:** the "Established Spinny consumer design system" card and the "Other small & big projects" card both currently point to the same Figma file (`E3jWyZ8YzWeGPtf4wqAiLj/Auction-new-listing-B2B`). Reproduce it as-is for now, but list it in your deviations report so I can decide. Do not change it on your own.

Confirm `target`/`rel` attributes on every external link match the original.

---

**8. Custom cursor**

Yes — if the original hides the native cursor and renders a custom one, reproduce it exactly: same size, shape, colour, blend mode, follow easing/lag, and every hover state change over links, project cards and buttons.

Three conditions:

- **Touch devices:** do not apply it at all. Gate on pointer capability (`@media (hover: hover) and (pointer: fine)`), not on viewport width.
- **Keyboard accessibility:** hiding the native cursor must not remove visible focus indicators. Focus states must remain clearly visible for keyboard navigation.
- **`prefers-reduced-motion`:** tell me what the custom cursor does under it before you implement the fallback.

---

**9. Deploy target and analytics**

Deploy to **Vercel**.

On analytics: Framer's built-in analytics is tied to Framer hosting and cannot be migrated, so this isn't keep-or-drop. Install **Vercel Analytics** as the replacement — it's lightweight and adds effectively nothing to the critical path. Historical data does not carry over.

Do not add Google Analytics, tag managers, heatmaps, chat widgets or any other third-party script. Nothing that isn't on the current site gets added.

---

**10. Domain — you didn't ask, but it blocks §6**

The new site will live at:

> `uxuiuv.vercel.app`

Canonical URL, OG/Twitter absolute URLs, sitemap and robots.txt all depend on this. If it's a placeholder for now, structure it as a single config value so switching later is a one-line change, and tell me exactly where that value lives.

---

## Before you resume building

Re-read PROMPT.md. The phase gates still apply — finish and get my sign-off on the audit before writing production code, and keep the section-by-section screenshot comparison and per-section commits.

Anything above that you still can't pin down exactly: ask. Don't fill the gap with a reasonable-looking default.
