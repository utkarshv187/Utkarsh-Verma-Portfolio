import './testimonials.css';
import { useMarquee } from '../lib/useMarquee';

// THINGS THEY SAY — a leftward marquee of 3 baked LinkedIn recommendation screenshots, each
// linking to the profile. Auto-scrolls (2x the old pace), slows to half on hover, and is also
// grab-draggable horizontally.
const CARDS = [
  { src: 'tts-1', alt: 'LinkedIn recommendation from Ujjwal Kumar, Head of Product Design at Spinny' },
  { src: 'tts-2', alt: 'LinkedIn recommendation from Anurag Gaggar, SVP Product at MakeMyTrip' },
  { src: 'tts-3', alt: 'LinkedIn recommendation from Prakash Srivastava, Global Product Leader' },
];
const HREF = 'https://www.linkedin.com/in/uxuiuv/';

export function Testimonials() {
  // duplicate the set so the track loops seamlessly (wrap at one copy width)
  const loop = [...CARDS, ...CARDS];
  // ~48px/s (2x the old ~24px/s); hover drops to half (~24px/s), smooth
  const { containerRef, trackRef } = useMarquee({ speed: 48, hoverFactor: 0.5 });
  return (
    <section className="tts" id="things-they-say">
      <div className="tts__inner">
        <h2 className="tts__heading">THINGS THEY SAY</h2>
        <p className="tts__subtitle">REAL WORK, REAL WORDS, REAL WORTH</p>
      </div>
      <div className="tts__marquee" ref={containerRef}>
        <ul className="tts__track" ref={trackRef}>
          {loop.map((c, i) => (
            <li className="tts__item" key={i} aria-hidden={i >= CARDS.length || undefined}>
              <a className="tts__card" href={HREF} target="_blank" rel="noopener noreferrer" tabIndex={i >= CARDS.length ? -1 : undefined} data-cursor-variant="link" data-cursor-arrow="up-right">
                <picture>
                  {/* mobile: live's tall PORTRAIT testimonial cards (750x936). desktop/tablet keep the
                      landscape screenshots. */}
                  <source media="(max-width: 809.98px)" srcSet={`/images/${c.src}-m.avif`} type="image/avif" />
                  <source media="(max-width: 809.98px)" srcSet={`/images/${c.src}-m.webp`} type="image/webp" />
                  <source srcSet={`/images/${c.src}.avif`} type="image/avif" />
                  <img src={`/images/${c.src}.webp`} alt={i >= CARDS.length ? '' : c.alt} width={500} height={300} loading="lazy" />
                </picture>
              </a>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
