import './hobbies.css';

// WHEN I AM NOT DESIGNING — three fanned photo piles (GAMING / SOCIALIZING / ADVENTURING) with a
// title + gold Square Peg caption, then a big "& PHOTOGRAPHING" landscape grid. Static content
// (live has no drag / hover / parallax here — just the site's custom cursor); everything scrolls
// with the page.
type Photo = { src: string; rot: number; z: number; dx: number; dy: number };
type Stack = { key: string; title: string; caption: string; photos: Photo[] };

const STACKS: Stack[] = [
  {
    key: 'gaming', title: 'GAMING', caption: 'very very competitive!',
    photos: [
      { src: 'hob-game-1', rot: -30, z: 1, dx: -28, dy: 16 },
      { src: 'hob-game-2', rot: -20, z: 2, dx: -14, dy: 8 },
      { src: 'hob-game-3', rot: -10, z: 3, dx: 16, dy: -6 },
      { src: 'hob-game-4', rot: -10, z: 4, dx: 0, dy: 0 }, /* TEKKEN — front (live) */
    ],
  },
  {
    key: 'socializing', title: 'SOCIALIZING', caption: 'extrovert like a designer should be',
    photos: [
      { src: 'hob-social-1', rot: 18, z: 1, dx: 30, dy: 14 },
      { src: 'hob-social-2', rot: 12, z: 2, dx: 20, dy: 6 },
      { src: 'hob-social-3', rot: 6, z: 3, dx: 12, dy: -4 },
      { src: 'hob-social-4', rot: 0, z: 4, dx: 0, dy: 0 }, /* arcade — front (live) */
    ],
  },
  {
    key: 'adventuring', title: 'ADVENTURING', caption: 'whenever work allows',
    photos: [
      { src: 'hob-adv-1', rot: -30, z: 1, dx: -30, dy: 16 },
      { src: 'hob-adv-2', rot: -20, z: 2, dx: -18, dy: 8 },
      { src: 'hob-adv-4', rot: -10, z: 3, dx: -8, dy: -8 },
      { src: 'hob-adv-3', rot: 10, z: 4, dx: 4, dy: 0 }, /* scuba — front (live) */
    ],
  },
];

const GRID = Array.from({ length: 15 }, (_, i) => `hob-grid-${i + 1}`);

function Pic({ src, alt, w, h }: { src: string; alt: string; w: number; h: number }) {
  return (
    <picture>
      <source srcSet={`/images/${src}.avif`} type="image/avif" />
      <img src={`/images/${src}.webp`} alt={alt} width={w} height={h} loading="lazy" draggable={false} />
    </picture>
  );
}

export function Hobbies() {
  return (
    <section className="hob" id="not-designing">
      <div className="hob__inner">
        <h2 className="hob__intro">
          <span className="hob__intro-a">JUST IN CASE </span>
          <span className="hob__intro-b">WHEN I AM NOT DESIGNING</span>
        </h2>

        <div className="hob__stacks">
          {STACKS.map((s) => (
            <div className={`hob__col hob__col--${s.key}`} key={s.key}>
              <div className="hob__pile">
                {s.photos.map((ph) => (
                  <div
                    className="hob__card"
                    key={ph.src}
                    style={{ zIndex: ph.z, transform: `translate(${ph.dx}px, ${ph.dy}px) rotate(${ph.rot}deg)` }}
                  >
                    <Pic src={ph.src} alt="" w={296} h={370} />
                  </div>
                ))}
              </div>
              <h3 className="hob__title">{s.title}</h3>
              <p className="hob__caption">{s.caption}</p>
            </div>
          ))}
        </div>
      </div>

      <div className="hob__photo">
        <span className="hob__amp">&amp;</span>
        <h2 className="hob__photo-title">PHOTOGRAPHING</h2>
      </div>

      <div className="hob__grid">
        {GRID.map((src, i) => (
          <div className="hob__grid-cell" key={i}>
            <Pic src={src} alt="Travel photograph by Utkarsh Verma" w={960} h={540} />
          </div>
        ))}
      </div>
    </section>
  );
}
