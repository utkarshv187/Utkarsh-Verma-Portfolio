import { useEffect, useRef, useState } from 'react';
import { startLoop } from '../lib/sound';
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

  // stopwatch ticking while the counter is hovered (mouse / fine pointer only; loops until leave)
  const stopRef = useRef<() => void>(() => {});
  useEffect(() => () => stopRef.current(), []);
  const onEnter = (e: React.PointerEvent) => {
    if (e.pointerType !== 'mouse' || !window.matchMedia('(hover: hover) and (pointer: fine)').matches) return;
    stopRef.current = startLoop('stopwatch');
  };
  const onLeave = () => { stopRef.current(); stopRef.current = () => {}; };

  return (
    <div className="intro" aria-label="Designing for" onPointerEnter={onEnter} onPointerLeave={onLeave}>
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
