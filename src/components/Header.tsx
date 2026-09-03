import './header.css';
import { LINKS, EXTERNAL } from '../config/site';
import { Logo } from './Logo';
import { WhatsAppIcon, MailIcon, ArrowDown } from './Icons';
import { HeaderIntro } from './HeaderIntro';
import { ResumeButton } from './ResumeButton';
import { ScrollProgress } from './ScrollProgress';

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
          <a href="#about" className="nav-link">
            <span>About</span>
            <span className="nav-link__arrow" aria-hidden="true"><ArrowDown size={16} /></span>
          </a>

          {/* Contact: outline pill that expands on hover to reveal email + WhatsApp */}
          <div className="contact">
            <span className="contact__label">Contact</span>
            <div className="contact__reveal" aria-hidden="true">
              <a href={LINKS.email} className="contact__item contact__item--mail" tabIndex={-1}>
                <MailIcon size={20} />
                <span>utkarshv187@gmail.com</span>
              </a>
              <span className="contact__divider" />
              <a href={LINKS.whatsapp} {...EXTERNAL} className="contact__item contact__item--wa" tabIndex={-1}>
                <WhatsAppIcon size={20} />
                <span className="contact__phone">+91 8869808079</span>
              </a>
            </div>
          </div>

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
