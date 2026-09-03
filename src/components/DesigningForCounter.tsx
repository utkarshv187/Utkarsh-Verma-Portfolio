import { useEffect, useState } from 'react';
import { COUNTER_ORIGIN, elapsedSince, formatElapsed } from '../lib/dateDiff';

// "Designing for" live counter. Recomputes from the current Date each second, so it stays
// correct after the tab is backgrounded. No reflow: tabular figures + nowrap + fixed width.
export function DesigningForCounter() {
  const [text, setText] = useState(() => formatElapsed(elapsedSince(COUNTER_ORIGIN)));

  useEffect(() => {
    const tick = () => setText(formatElapsed(elapsedSince(COUNTER_ORIGIN)));
    tick();
    const id = window.setInterval(tick, 1000);
    return () => window.clearInterval(id);
  }, []);

  return (
    <div className="designing-for">
      <p className="designing-for__label">Designing for</p>
      <div className="designing-for__value" role="timer" aria-label="Forward timer">
        {text}
      </div>
    </div>
  );
}
