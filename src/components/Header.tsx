import './header.css';
import { useEffect, useRef, useState } from 'react';
import { LINKS, EXTERNAL } from '../config/site';
import { Logo } from './Logo';
import { WhatsAppIcon, MailIcon, ArrowDown } from './Icons';
import { HeaderIntro } from './HeaderIntro';
import { ResumeButton } from './ResumeButton';
import { ScrollProgress } from './ScrollProgress';
import { smoothScrollToId } from '../lib/scroll';

// header height (80px) + a small gap, so the MORE ABOUT ME heading lands just under the fixed header
const ABOUT_OFFSET = 112;

// Contact: on DESKTOP it's the outline pill that expands on hover to reveal email + WhatsApp
// (CSS-only, unchanged). On TABLET (touch, no hover) the same pill instead TAPS OPEN a popup with the
// two contacts — tapping WhatsApp opens it in a new tab, tapping email fires the mailto, both close
// the popup; tapping outside just closes it. The popup + tap wiring only render/act at the tablet
// breakpoint (the popup is display:none elsewhere, so desktop/mobile are untouched).
function ContactNav() {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (!open) return;
    const onDown = (e: PointerEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener('pointerdown', onDown);
    return () => document.removeEventListener('pointerdown', onDown);
  }, [open]);

  return (
    <div
      className={`contact${open ? ' contact--open' : ''}`}
      ref={ref}
      onClick={() => setOpen((o) => !o)}
    >
      <span className="contact__label">Contact</span>

      {/* Desktop hover reveal (hidden on tablet via CSS) */}
      <div className="contact__reveal" aria-hidden="true">
        <a href={LINKS.email} className="contact__item contact__item--mail" tabIndex={-1}>
          <MailIcon size={20} />
          <span className="contact__email">utkarshv187@gmail.com</span>
        </a>
        <span className="contact__divider" />
        <a href={LINKS.whatsapp} {...EXTERNAL} className="contact__item contact__item--wa" tabIndex={-1}>
          <WhatsAppIcon size={20} />
          <span className="contact__phone">+91 8869808079</span>
        </a>
      </div>

      {/* Tablet tap popup (green number / blue email). stopPropagation so an item tap doesn't also
          re-toggle the pill; the <a> handles navigation (WhatsApp new tab / mailto), then it closes. */}
      <div className="contact__popup" role="menu">
        <a
          href={LINKS.whatsapp}
          {...EXTERNAL}
          className="contact__pop-item contact__pop-item--wa"
          role="menuitem"
          onClick={(e) => { e.stopPropagation(); setOpen(false); }}
        >
          <WhatsAppIcon size={20} />
          <span>+91 8869808079</span>
        </a>
        <a
          href={LINKS.email}
          className="contact__pop-item contact__pop-item--mail"
          role="menuitem"
          onClick={(e) => { e.stopPropagation(); setOpen(false); }}
        >
          <MailIcon size={20} />
          <span>utkarshv187@gmail.com</span>
        </a>
      </div>
    </div>
  );
}

export function Header() {
  return (
    <header className="header">
      <div className="header__inner">
        {/* Left: logo + intro (Designing-for ⟷ Thinking-design on hover) */}
        <div className="header__left">
          <a href="#home" className="header__logo" aria-label="Utkarsh Verma — home">
            <Logo />
          </a>
          <div className="header__intro-wrap">
            <HeaderIntro />
          </div>
        </div>

        {/* Desktop nav */}
        <nav className="header__nav header__nav--desktop" aria-label="Primary">
          <a
            href="#about"
            className="nav-link"
            onClick={(e) => { e.preventDefault(); smoothScrollToId('about', ABOUT_OFFSET); }}
          >
            <span>About</span>
            <span className="nav-link__arrow" aria-hidden="true"><ArrowDown size={16} /></span>
          </a>

          {/* Contact: hover-reveal pill (desktop) / tap-popup (tablet) */}
          <ContactNav />

          <ResumeButton />
        </nav>

        {/* Mobile nav (visual order on live: Mail, WhatsApp, Résumé) */}
        <nav className="header__nav header__nav--mobile" aria-label="Primary">
          <a href={LINKS.email} className="nav-icon" aria-label="Email">
            <MailIcon size={24} />
          </a>
          <a href={LINKS.whatsapp} {...EXTERNAL} className="nav-icon" aria-label="WhatsApp">
            <WhatsAppIcon size={24} />
          </a>
          <ResumeButton className="resume--mobile" />
        </nav>
      </div>

      <ScrollProgress />
    </header>
  );
}
