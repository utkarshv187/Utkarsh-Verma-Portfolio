import './about-me.css';
import { Fragment, useEffect, useRef, useState } from 'react';

// The bio: a flat sequence of words + gold caret-inserts. Words reveal per-word (staggered
// fade-up) as the bio scrolls in; then the inserts pop in ONE AT A TIME (each caret + its script
// phrase together). Live's Satoshi body + Square Peg annotations.
type Seg = { w: string } | { ins: number; text: string };
const BIO: Seg[] = [
  { w: 'Result,' }, { w: 'impact' }, { w: '&' }, { w: 'delight' }, { w: 'driven' }, { w: 'designer' },
  { ins: 1, text: ', mentor, storyteller' },
  { w: 'with' }, { w: '7+' }, { w: 'years' }, { w: 'of' }, { w: 'expertise' }, { w: 'in' }, { w: 'building' },
  { ins: 2, text: '& improving' },
  { w: 'human' }, { w: 'experiences' },
  { ins: 3, text: ', products & businesses' },
  { w: 'by' }, { w: 'thoughtful' },
  { ins: 4, text: 'sometimes unconventional' },
  { w: 'interfaces' }, { w: '&' }, { w: 'ideas' }, { w: 'which' }, { w: 'work' },
  { ins: 5, text: 'if not, then we correct & make it work' },
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
  const loop = [...ICONS, ...ICONS];

  return (
    <section className="about" id="more-about-me">
      <div className="about__inner">
        <h2 className="about__heading">MORE ABOUT ME</h2>
        <p className="about__subtitle">ENGINEER TURNED ARTIST</p>

        <div className="about__row">
          <picture className="about__portrait">
            <source srcSet="/images/about-portrait.avif" type="image/avif" />
            <img src="/images/about-portrait.webp" alt="Utkarsh Verma" width={395} height={500} loading="lazy" />
          </picture>

          <p className={`about__bio${revealed ? ' about__bio--in' : ''}`} ref={bioRef}>
            {(() => {
              let wi = -1; // running word index (for the per-word stagger delay)
              return BIO.map((seg, i) => {
                if ('ins' in seg) {
                  return (
                    <span className={`about__ins about__ins--${seg.ins}`} key={i}>
                      <span className="about__caret">^</span>
                      <span className="about__ins-text">{seg.text}</span>
                    </span>
                  );
                }
                wi += 1;
                // real space text node after each word so it COLLAPSES at line ends (a margin
                // wouldn't, which would push the wrap and change live's line breaks)
                return (
                  <Fragment key={i}>
                    <span className="about__word" style={{ ['--wd' as string]: `${(wi * 0.03).toFixed(2)}s` }}>{seg.w}</span>{' '}
                  </Fragment>
                );
              });
            })()}
          </p>
        </div>
      </div>

      <div className="about__marquee">
        <ul className="about__track">
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
