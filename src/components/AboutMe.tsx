import './about-me.css';
import { Fragment, useEffect, useRef, useState } from 'react';
import { useMarquee } from '../lib/useMarquee';
import { play, playSequence } from '../lib/sound';
import { usePrefersReducedMotion } from '../lib/hooks';

// The bio: a sequence of words. Five words are ANCHORS — the gold script annotation (caret +
// phrase) is a child of that word's span, so it always sits right after that exact word, at every
// screen size / wrap (never a fixed screen position). Words reveal per-word (staggered fade-up);
// then the annotations pop in ONE AT A TIME in reading order (each caret + Caveat Brush phrase
// together). Anchor words + phrases mapped from the live site.
type Seg = { w: string; ins?: number; text?: string };
const BIO: Seg[] = [
  { w: 'Result,' }, { w: 'impact' }, { w: '&' }, { w: 'delight' }, { w: 'driven' },
  { w: 'designer', ins: 1, text: ', mentor, storyteller' },
  { w: 'with' }, { w: '7+' }, { w: 'years' }, { w: 'of' }, { w: 'expertise' }, { w: 'in' },
  { w: 'building', ins: 2, text: '& improving' },
  { w: 'human' },
  { w: 'experiences', ins: 3, text: ', products & businesses' },
  { w: 'by' },
  { w: 'thoughtful', ins: 4, text: 'sometimes unconventional' },
  { w: 'interfaces' }, { w: '&' }, { w: 'ideas' }, { w: 'which' },
  { w: 'work', ins: 5, text: 'if not, then we correct & make it work' },
  { w: '&' }, { w: 'thrive' },
];

// 9 skill/tool icons (about-icon-1..9). #5 is Rive — the one being LEARNED (gold badge).
const ICONS = [1, 2, 3, 4, 5, 6, 7, 8, 9];

export function AboutMe() {
  const bioRef = useRef<HTMLParagraphElement>(null);
  const [revealed, setRevealed] = useState(false);
  useEffect(() => {
    const el = bioRef.current;
    if (!el) return;
    const io = new IntersectionObserver(
      (entries) => entries.forEach((e) => { if (e.isIntersecting) { setRevealed(true); io.disconnect(); } }),
      { threshold: 0.35 },
    );
    io.observe(el);
    return () => io.disconnect();
  }, []);
  // typewriter under the BODY TEXT reveal: one very quiet keystroke per word, scheduled on the audio
  // clock at that word's own reveal delay (--wd), so the typing runs WITH the words as they fade in
  // and stops at the last one. (The gold script phrases have no sound.) No reveal animation under
  // reduced motion, so no typing either.
  const reduced = usePrefersReducedMotion();
  useEffect(() => {
    if (!revealed || reduced) return;
    const words = [...(bioRef.current?.querySelectorAll<HTMLElement>('.about__word') ?? [])];
    const offsets = words.map((w) => parseFloat(w.style.getPropertyValue('--wd')) || 0);
    playSequence('type', offsets, { gap: 3000, rateJitter: 0.08, gainJitter: 0.35 });
  }, [revealed, reduced]);
  const loop = [...ICONS, ...ICONS];
  // tools ticker: 50px/s auto (2x the old ~25), eases to half (~25) on hover; drag-scrollable
  const { containerRef: tickerRef, trackRef } = useMarquee({ speed: 50, hoverFactor: 0.5, onSwipe: () => play('wind') }); // soft wind on swipe (same as the testimonials)

  return (
    <section className="about" id="more-about-me">
      <div className="about__inner">
        <h2 className="about__heading" id="about">MORE ABOUT ME</h2>
        <p className="about__subtitle">ENGINEER TURNED ARTIST</p>

        <div className="about__row">
          <picture className="about__portrait">
            <source srcSet="/images/about-portrait.avif" type="image/avif" />
            <img src="/images/about-portrait.webp" alt="Utkarsh Verma" width={395} height={500} loading="lazy" />
          </picture>

          <p className={`about__bio${revealed ? ' about__bio--in' : ''}`} ref={bioRef}>
            {BIO.map((seg, i) => (
              // real space text node after each word so it COLLAPSES at line ends (a margin
              // wouldn't, which would push the wrap and change live's line breaks)
              <Fragment key={i}>
                <span
                  className={`about__word${seg.ins ? ` about__anchor about__anchor--${seg.ins}` : ''}`}
                  style={{ ['--wd' as string]: `${(i * 0.03).toFixed(2)}s` }}
                >
                  {seg.w}
                  {seg.ins && (
                    // caret + phrase anchored to THIS word (positioned relative to it)
                    <span className="about__ins">
                      <span className="about__caret">^</span>
                      <span className="about__ins-text">{seg.text}</span>
                    </span>
                  )}
                </span>{' '}
              </Fragment>
            ))}
          </p>
        </div>
      </div>

      <div className="about__marquee" ref={tickerRef}>
        <ul className="about__track" ref={trackRef}>
          {loop.map((n, i) => (
            <li className="about__icon" key={i} aria-hidden={i >= ICONS.length || undefined}>
              <picture>
                <source srcSet={`/images/about-icon-${n}.avif`} type="image/avif" />
                <img src={`/images/about-icon-${n}.webp`} alt="" width={100} height={100} loading="lazy" />
              </picture>
              {n === 5 && <span className="about__learning">LEARNING</span>}
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
