import './header.css';
import { LINKS, EXTERNAL } from '../config/site';
import { Logo } from './Logo';
import { WhatsAppIcon, MailIcon } from './Icons';
import { DesigningForCounter } from './DesigningForCounter';
import { ScrollProgress } from './ScrollProgress';

export function Header() {
  return (
    <header className="header">
      <div className="header__inner">
        {/* Left: logo + Designing-for (counter hidden on phone) */}
        <div className="header__left">
          <a href="#home" className="header__logo" aria-label="Utkarsh Verma — home">
            <Logo />
          </a>
          <div className="header__desking-for-wrap">
            <DesigningForCounter />
          </div>
        </div>

        {/* Desktop nav */}
        <nav className="header__nav header__nav--desktop" aria-label="Primary">
          <a href="#about" className="nav-link">About</a>
          <a href="#contact" className="nav-pill nav-pill--outline">Contact</a>
          <a href={LINKS.resume} {...EXTERNAL} className="nav-pill nav-pill--resume">Résumé</a>
        </nav>

        {/* Mobile nav (visual order on live: Mail, WhatsApp, Résumé) */}
        <nav className="header__nav header__nav--mobile" aria-label="Primary">
          <a href={LINKS.email} className="nav-icon" aria-label="Email">
            <MailIcon size={24} />
          </a>
          <a href={LINKS.whatsapp} {...EXTERNAL} className="nav-icon" aria-label="WhatsApp">
            <WhatsAppIcon size={24} />
          </a>
          <a href={LINKS.resume} {...EXTERNAL} className="nav-pill nav-pill--resume">Résumé</a>
        </nav>
      </div>

      <ScrollProgress />
    </header>
  );
}
