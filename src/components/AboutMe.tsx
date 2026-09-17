import './about-me.css';
import { useEffect, useRef, useState } from 'react';

// One gold caret-insert: an inline caret (^) in the bio, plus the gold handwritten phrase that
// fades + slides up into place when the bio scrolls into view.
function Ins({ n, children }: { n: number; children: React.ReactNode }) {
  return (
    <span className={`about__ins about__ins--${n}`}>
      <span className="about__caret">^</span>
      <span className="about__ins-text">{children}</span>
    </span>
  );
}

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
            Result, impact &amp; delight driven designer
            <Ins n={1}>, mentor, storyteller</Ins> with 7+ years of expertise in building
            <Ins n={2}>&amp; improving</Ins> human experiences
            <Ins n={3}>, products &amp; businesses</Ins> by thoughtful
            <Ins n={4}>sometimes unconventional</Ins> interfaces &amp; ideas which work
            <Ins n={5}>if not, then we correct &amp; make it work</Ins> &amp; thrive
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
