import './go-to-top.css';
import { useEffect, useState } from 'react';
import { smoothScrollTo } from '../lib/scroll';

// "GO TO TOP" — a fixed white circle with a dark up-arrow (live: 80px circle, right:40 bottom:32).
// It slides IN from the right edge once the MORE ABOUT ME section is reached and stays visible
// through every section below; sliding back OUT to the right when scrolled up above that section.
// Clicking it smooth-scrolls to the top (#home).
export function GoToTop() {
  const [show, setShow] = useState(false);
  useEffect(() => {
    const evaluate = () => {
      const el = document.getElementById('more-about-me');
      if (!el) return;
      // visible once the section has scrolled up to ~60% of the viewport (matches live's trigger),
      // and stays true for all greater scroll; false again only above that point.
      setShow(el.getBoundingClientRect().top <= window.innerHeight * 0.6);
    };
    evaluate();
    // body is the scroll container -> a capture-phase window scroll listener still catches it
    window.addEventListener('scroll', evaluate, { passive: true, capture: true });
    window.addEventListener('resize', evaluate);
    return () => {
      window.removeEventListener('scroll', evaluate, { capture: true } as EventListenerOptions);
      window.removeEventListener('resize', evaluate);
    };
  }, []);

  return (
    <button
      className={`gtt${show ? ' gtt--show' : ''}`}
      type="button"
      aria-label="Go to top"
      aria-hidden={!show}
      tabIndex={show ? 0 : -1}
      onClick={() => smoothScrollTo(0)}
    >
      <span className="gtt__circle">
        <svg className="gtt__arrow" viewBox="0 0 24 24" width="28" height="28" aria-hidden="true">
          <path d="M12 20 V5 M6 11 L12 4.5 L18 11" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </span>
    </button>
  );
}
