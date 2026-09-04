// Circular "LET'S • WORK • TOGETHER •" text that rotates continuously, sitting on the O of PRODUCT.
export function RotatingBadge() {
  return (
    <span className="badge" aria-hidden="true">
      <svg className="badge__svg" viewBox="0 0 100 100">
        <defs>
          <path id="badge-curve" d="M 50 50 m -37 0 a 37 37 0 1 1 74 0 a 37 37 0 1 1 -74 0" fill="none" />
        </defs>
        <text className="badge__text">
          <textPath href="#badge-curve" startOffset="0">LET'S&nbsp;&nbsp;•&nbsp;&nbsp;WORK&nbsp;&nbsp;•&nbsp;&nbsp;TOGETHER&nbsp;&nbsp;•&nbsp;&nbsp;</textPath>
        </text>
      </svg>
    </span>
  );
}
