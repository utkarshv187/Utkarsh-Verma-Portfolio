import './testimonials.css';

// THINGS THEY SAY — a leftward marquee of 3 baked LinkedIn recommendation screenshots, each
// linking to the profile. Continuous (no pause on hover), matching live's ticker.
const CARDS = [
  { src: 'tts-1', alt: 'LinkedIn recommendation from Ujjwal Kumar, Head of Product Design at Spinny' },
  { src: 'tts-2', alt: 'LinkedIn recommendation from Anurag Gaggar, SVP Product at MakeMyTrip' },
  { src: 'tts-3', alt: 'LinkedIn recommendation from Prakash Srivastava, Global Product Leader' },
];
const HREF = 'https://www.linkedin.com/in/uxuiuv/';

export function Testimonials() {
  // duplicate the set so the track loops seamlessly (translateX -50% = exactly one copy)
  const loop = [...CARDS, ...CARDS];
  return (
    <section className="tts" id="things-they-say">
      <div className="tts__inner">
        <h2 className="tts__heading">THINGS THEY SAY</h2>
        <p className="tts__subtitle">REAL WORK, REAL WORDS, REAL WORTH</p>
      </div>
      <div className="tts__marquee">
        <ul className="tts__track">
          {loop.map((c, i) => (
            <li className="tts__item" key={i} aria-hidden={i >= CARDS.length || undefined}>
              <a className="tts__card" href={HREF} target="_blank" rel="noopener noreferrer" tabIndex={i >= CARDS.length ? -1 : undefined}>
                <picture>
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
