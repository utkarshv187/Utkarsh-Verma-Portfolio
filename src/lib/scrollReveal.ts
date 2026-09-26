import { useLayoutEffect } from 'react';
import { readScroll } from './scroll';

// Site-wide scroll-scrubbed reveal: a block entering from the bottom of the viewport starts faded +
// slightly low, and eases to opaque / in place by the time its top has risen ~20% of the viewport
// height. Tied 1:1 to scroll position both ways (fades back as it drops out the bottom); anything
// above that line is untouched. No blur — content is always sharp.
//
// Performance:
// - ONE scroll listener + ONE rAF per frame for the whole site; an IntersectionObserver keeps the
//   per-frame set to the few blocks near the viewport (reads batched, then writes).
// - Only block-level containers are targeted (headings, text blocks, cards, images) — never their
//   children — and only `filter: opacity()` + `translate` are written: compositor-friendly, no
//   layout. Using the individual `translate` property and `filter: opacity()` (not `transform` /
//   `opacity`) means we never fight the components' own entrance/hover transforms or opacity
//   transitions (e.g. Work Experience's fade-up, the photo grid's scale-in).
// - `will-change` is set only while a block is mid-transition, and every style is REMOVED once it
//   is fully revealed, so settled content carries no filter, no layer and no stacking context.
// - prefers-reduced-motion: nothing is applied — content is always in place.

// Block-level targets, section by section. The hero is the first screen (pinned on desktop/tablet),
// so it is always fully on screen and has nothing to reveal.
const TARGETS = [
  '.we__heading', '.we__subtitle', '.we__row', '.we-card',
  '.rw__heading', '.rw__subtitle', '.rw-card__media', '.rw-card__title', '.rw-card__stats',
  '.tts__heading', '.tts__subtitle', '.tts__marquee',
  '.about__heading', '.about__subtitle', '.about__portrait', '.about__bio', '.about__marquee',
  '.hob__intro', '.hob__col', '.hob__photo', '.hob__grid-cell',
  '.footer__q', '.footer__cta', '.footer__pills', '.footer__badge',
].join(',');

const BAND = 0.2; // fraction of the viewport height over which a block resolves
const LIFT_DESKTOP = 28; // px the block starts below its resting spot
const LIFT_PHONE = 18;
const FADE_FROM = 0.25; // starting opacity

type State = { p: number; y: number };

export function useScrollReveal(): void {
  useLayoutEffect(() => {
    const reducedMq = window.matchMedia('(prefers-reduced-motion: reduce)');
    const phoneMq = window.matchMedia('(max-width: 809.98px), (hover: none), (pointer: coarse)');

    const els = [...document.querySelectorAll<HTMLElement>(TARGETS)];
    const state = new Map<HTMLElement, State>();
    const active = new Set<HTMLElement>();
    let raf = 0;

    const liftPx = () => (phoneMq.matches ? LIFT_PHONE : LIFT_DESKTOP);

    const clear = (el: HTMLElement) => {
      el.style.removeProperty('filter');
      el.style.removeProperty('translate');
      el.style.removeProperty('will-change');
    };

    // 0 = at the bottom edge (fully hidden state) → 1 = risen BAND of the viewport (fully revealed).
    // Near the end of the page a block may never get that high, so it resolves by max scroll instead.
    const progress = (top: number, vh: number, remaining: number): number => {
      const start = vh;
      let end = vh * (1 - BAND);
      const finalTop = top - remaining; // where this block's top ends up at max scroll
      if (finalTop > end) end = finalTop;
      if (top <= end || remaining < 1) return 1;
      if (top >= start || end >= start - 1) return 0;
      return (start - top) / (start - end);
    };

    const write = (el: HTMLElement, p: number) => {
      const prev = state.get(el);
      const q = Math.round(p * 1000) / 1000;
      if (prev && prev.p === q) return;
      if (q >= 1) {
        clear(el);
        state.set(el, { p: 1, y: 0 });
        return;
      }
      const e = q * q * (3 - 2 * q); // smoothstep: soft at both ends, spread across the whole band
      const y = (1 - e) * liftPx();
      const o = FADE_FROM + (1 - FADE_FROM) * e;
      el.style.setProperty('translate', `0 ${y.toFixed(2)}px`);
      el.style.setProperty('filter', `opacity(${o.toFixed(3)})`);
      if (q > 0) el.style.setProperty('will-change', 'filter, translate');
      else el.style.removeProperty('will-change'); // parked offscreen/at the edge: no layer
      state.set(el, { p: q, y });
    };

    const docMetrics = () => {
      const vh = window.innerHeight;
      const h = Math.max(document.documentElement.scrollHeight, document.body.scrollHeight);
      return { vh, remaining: Math.max(0, h - vh - readScroll()) };
    };

    const update = (list: Iterable<HTMLElement>) => {
      const { vh, remaining } = docMetrics();
      // read everything first (rect minus our own translate, so the lift never feeds back) …
      const reads: [HTMLElement, number][] = [];
      for (const el of list) {
        const r = el.getBoundingClientRect();
        reads.push([el, progress(r.top - (state.get(el)?.y || 0), vh, remaining)]);
      }
      // … then write
      for (const [el, p] of reads) write(el, p);
    };

    const frame = () => {
      raf = 0;
      update(active);
    };
    const schedule = () => { if (!raf) raf = requestAnimationFrame(frame); };

    // Watch a band a little larger than the viewport so blocks are already in their hidden state
    // before their first pixel appears (no one-frame sharp flash on a fast fling).
    const io = new IntersectionObserver(
      (entries) => {
        const left: HTMLElement[] = [];
        for (const e of entries) {
          const el = e.target as HTMLElement;
          if (e.isIntersecting) active.add(el);
          else if (active.delete(el)) left.push(el);
        }
        update(left); // settle anything that just left (sharp above, hidden below)
        schedule();
      },
      { rootMargin: '0px 0px 25% 0px' },
    );

    let on = false;
    const onScroll = () => schedule();
    const onResize = () => { state.clear(); update(els); };
    const ro = new ResizeObserver(() => { state.clear(); schedule(); }); // fonts/images shifting layout

    const start = () => {
      if (on) return;
      on = true;
      update(els); // initial state for every block before first paint
      els.forEach((el) => io.observe(el));
      // capture: the body is the scroll container here, and its 'scroll' doesn't bubble to window
      window.addEventListener('scroll', onScroll, { passive: true, capture: true });
      window.addEventListener('resize', onResize);
      ro.observe(document.body);
    };
    const stop = () => {
      if (!on) return;
      on = false;
      cancelAnimationFrame(raf);
      raf = 0;
      io.disconnect();
      ro.disconnect();
      window.removeEventListener('scroll', onScroll, { capture: true });
      window.removeEventListener('resize', onResize);
      active.clear();
      state.clear();
      els.forEach(clear);
    };
    const sync = () => (reducedMq.matches ? stop() : start());
    const onPhoneChange = () => { state.clear(); schedule(); };

    sync();
    reducedMq.addEventListener('change', sync);
    phoneMq.addEventListener('change', onPhoneChange);
    return () => {
      reducedMq.removeEventListener('change', sync);
      phoneMq.removeEventListener('change', onPhoneChange);
      stop();
    };
  }, []);
}
