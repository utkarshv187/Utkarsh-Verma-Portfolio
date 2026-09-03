import { LINKS, EXTERNAL } from '../config/site';
import { ArrowUpRight } from './Icons';

// Purple Résumé pill with a continuously orbiting gold border-beam (border-beam loop),
// and a hover state (full gold ring + ↗ arrow + scaleX squish).
export function ResumeButton({ className = '' }: { className?: string }) {
  return (
    <a href={LINKS.resume} {...EXTERNAL} className={`resume ${className}`.trim()}>
      <span className="resume__glow" aria-hidden="true" />
      <span className="resume__beam" aria-hidden="true" />
      <span className="resume__ring" aria-hidden="true" />
      <span className="resume__label">Résumé</span>
      <span className="resume__arrow" aria-hidden="true"><ArrowUpRight size={16} /></span>
    </a>
  );
}
