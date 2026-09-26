import './go-to-top.css';
import { useEffect, useState } from 'react';
import { smoothScrollTo } from '../lib/scroll';
import { play } from '../lib/sound';

// "GO TO TOP" — fixed white circle with a dark up-arrow (live: 80px circle, right:40 bottom:32).
// On hover it matches live's variant swap: the arrow shrinks + slides up and the straight two-line
// label "GO TO / TOP" fades in below it (Clash Display 16px/700, dark). No circular/curved text.
// It slides IN from the right once MORE ABOUT ME is reached and stays visible through every section
// below; slides back OUT to the right when scrolled up above that section. Click smooth-scrolls home.
export function GoToTop() {
  const [show, setShow] = useState(false);
  useEffect(() => {
    const el = document.getElementById('more-about-me');
    if (!el) return;
    // visible once the section's top has scrolled up to ~60% of the viewport (matches live's
    // trigger), and stays true for all greater scroll; false again only above that point.
    // An IntersectionObserver whose root is EVERYTHING above the viewport's 60% line (bottom trimmed by
    // 40%, top extended far above the page) intersects the section exactly when its top is at or above
    // that line — so any scroll, including an instant jump, flips it. The browser precomputes this, so
    // there's no layout read on every scroll event (that per-scroll read was the biggest jank source).
    const io = new IntersectionObserver(([e]) => setShow(e.isIntersecting), { rootMargin: '1000000px 0px -40% 0px' });
    io.observe(el);
    return () => io.disconnect();
  }, []);

  return (
    <button
      className={`gtt${show ? ' gtt--show' : ''}`}
      type="button"
      aria-label="Go to top"
      aria-hidden={!show}
      tabIndex={show ? 0 : -1}
      onClick={() => { play('whoosh-up'); smoothScrollTo(0); }}
    >
      <span className="gtt__circle">
        <svg className="gtt__arrow" viewBox="0 0 24 24" width="28" height="28" aria-hidden="true">
          <path d="M12 20 V5 M6 11 L12 4.5 L18 11" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
        <span className="gtt__label" aria-hidden="true">GO TO<br />TOP</span>
      </span>
    </button>
  );
}
