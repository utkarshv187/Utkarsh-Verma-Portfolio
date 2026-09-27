import './footer.css';
import { LINKS, EXTERNAL } from '../config/site';
import { WhatsAppIcon, MailIcon, LinkedInIcon, ArrowUpRight } from './Icons';
import { play } from '../lib/sound';

// FOOTER / CONTACT — the gold (#FFB705) closing CTA. A sticky CTA pins as the section scrolls up
// over the hobbies grid: a pale question heading + a white CTA heading (both swap by breakpoint —
// "SCROLLED THIS FAR? / LET'S WORK TOGETHER" ≥1280, "CAME THIS FAR? / LET'S TALK WORK" below), then
// three white stadium contact pills (green WhatsApp / blue email / blue LinkedIn), and the glossy
// "Wall Of Portfolios 2026" badge (top-right on desktop, below the pills on tablet/mobile).
export function Footer() {
  return (
    <footer className="footer" id="contact">
      <div className="footer__pin">
        <div className="footer__inner">
          <div className="footer__copy">
            <h2 className="footer__q">
              <span className="footer__t footer__t--wide">SCROLLED THIS FAR?</span>
              <span className="footer__t footer__t--narrow">CAME THIS FAR?</span>
            </h2>
            <h2 className="footer__cta">
              <span className="footer__t footer__t--wide">LET&rsquo;S WORK TOGETHER</span>
              <span className="footer__t footer__t--narrow">LET&rsquo;S TALK WORK</span>
            </h2>

            <div className="footer__pills">
              <a className="footer__pill footer__pill--wa" href={LINKS.whatsapp} {...EXTERNAL} aria-label="Chat on WhatsApp">
                <WhatsAppIcon size={22} />
                <span className="footer__pill-text">+91 8869808079</span>
                <span className="footer__pill-arrow" aria-hidden="true"><ArrowUpRight size={13} /></span>
              </a>
              <a className="footer__pill footer__pill--mail" href={LINKS.email} {...EXTERNAL} aria-label="Email Utkarsh">
                <MailIcon size={22} />
                <span className="footer__pill-text">utkarshv187@gmail.com</span>
                <span className="footer__pill-arrow" aria-hidden="true"><ArrowUpRight size={13} /></span>
              </a>
              <a className="footer__pill footer__pill--in" href={LINKS.linkedin} {...EXTERNAL} aria-label="Connect on LinkedIn">
                <LinkedInIcon size={22} />
                <span className="footer__pill-text">Connect</span>
                <span className="footer__pill-arrow" aria-hidden="true"><ArrowUpRight size={13} /></span>
              </a>
            </div>
          </div>

          {/* hover (fine pointer): the badge shrinks to 90% and a two-line script caption fades in below */}
          <div
            className="footer__badge"
            onPointerEnter={(e) => {
              // the 'wow' flourish on hover (mouse / fine pointer only; ignored while it's still playing)
              if (e.pointerType === 'mouse' && window.matchMedia('(hover: hover) and (pointer: fine)').matches) play('wow');
            }}
          >
            <picture className="footer__badge-img">
              <source srcSet="/images/footer-badge.avif" type="image/avif" />
              <img src="/images/footer-badge.webp" alt="Featured on Wall of Portfolios · 2026" width={112} height={212} loading="lazy" />
            </picture>
            <p className="footer__badge-cap" aria-hidden="true">Featured on<br />Wall Of Portfolios</p>
          </div>
        </div>
      </div>
    </footer>
  );
}
