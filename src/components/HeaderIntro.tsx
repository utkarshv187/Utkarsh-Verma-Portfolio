import { useEffect, useState } from 'react';
import { COUNTER_ORIGIN, elapsedSince, formatElapsed } from '../lib/dateDiff';

// Left header block. Default: "Designing for" + live counter.
// On hover (fine pointer): crossfades to memoji + "Thinking design / all the time" (Caveat Brush).
export function HeaderIntro() {
  const [text, setText] = useState(() => formatElapsed(elapsedSince(COUNTER_ORIGIN)));
  useEffect(() => {
    const tick = () => setText(formatElapsed(elapsedSince(COUNTER_ORIGIN)));
    tick();
    const id = window.setInterval(tick, 1000);
    return () => window.clearInterval(id);
  }, []);

  return (
    <div className="intro" aria-label="Designing for">
      <div className="intro__default">
        <p className="intro__label">Designing for</p>
        <div className="intro__value" role="timer" aria-label="Forward timer">{text}</div>
      </div>
      <div className="intro__hover" aria-hidden="true">
        <img className="intro__memoji" src="/images/memoji.png" width={107} height={126} alt="" />
        <p className="intro__script">Thinking design<br />all the time</p>
      </div>
    </div>
  );
}
