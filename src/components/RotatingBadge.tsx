// Circular "LET'S • WORK • TOGETHER •" text that rotates continuously, sitting on the O of PRODUCT.
// SVG geometry copied 1:1 from the live site: viewBox 0 0 100 100, text runs on a circle at the
// viewBox edge (r=50) with a hanging baseline so glyphs hang inward toward the counter.
export function RotatingBadge() {
  return (
    <span className="badge" aria-hidden="true">
      <svg className="badge__svg" viewBox="0 0 100 100" overflow="visible">
        {/* Clean circle r=50 centred at (50,50) — geometrically identical to live's ring
            (same radius/circumference) but without live's redundant zero-length segments,
            so every glyph rests evenly on one continuous path. */}
        <path
          id="badge-curve"
          d="M 0 50 A 50 50 0 1 1 100 50 A 50 50 0 1 1 0 50"
          fill="transparent"
        />
        {/* textLength = the circle's circumference (2*pi*50) with lengthAdjust="spacing" spreads the
            words + bullets EVENLY around the whole O; the trailing "• " (kept via xml:space) closes
            the loop so the gap between TOGETHER and LET'S matches the other separators. */}
        <text>
          <textPath
            className="badge__text"
            href="#badge-curve"
            startOffset="0"
            dominantBaseline="hanging"
            textLength="314.16"
            lengthAdjust="spacing"
            xmlSpace="preserve"
          >{"LET'S • WORK • TOGETHER • "}</textPath>
        </text>
      </svg>
    </span>
  );
}
