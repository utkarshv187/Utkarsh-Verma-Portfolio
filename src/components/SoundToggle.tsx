import './sound-toggle.css';
import { setSoundOn, useSoundOn } from '../lib/sound';

// Mute/unmute — a small glass circle in the bottom-left corner (Go to top owns bottom-right).
// Sound is ON by default (armed; it starts at the visitor's first click / tap / key press). Muting is
// remembered for the tab session.
export function SoundToggle() {
  const on = useSoundOn();
  return (
    <button
      className={`sound-toggle${on ? ' sound-toggle--on' : ''}`}
      type="button"
      aria-pressed={on}
      aria-label={on ? 'Turn sound off' : 'Turn sound on'}
      title={on ? 'Sound on' : 'Sound off'}
      onClick={() => setSoundOn(!on)}
    >
      <svg viewBox="0 0 24 24" width="18" height="18" aria-hidden="true" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <path d="M4 9.5h3.2L12 5.5v13l-4.8-4H4z" fill="currentColor" stroke="none" />
        {on ? (
          <>
            <path d="M15.5 9.2a4 4 0 0 1 0 5.6" />
            <path d="M18.2 6.6a7.6 7.6 0 0 1 0 10.8" />
          </>
        ) : (
          <path d="M16 9.5l5 5M21 9.5l-5 5" />
        )}
      </svg>
    </button>
  );
}
