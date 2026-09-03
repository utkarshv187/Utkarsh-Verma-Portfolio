// "UX" monogram — exact vector from the live site (viewBox 0 0 52.918 30).
export function Logo({ fill = 'currentColor', className }: { fill?: string; className?: string }) {
  return (
    <svg viewBox="0 0 52.918 30" className={className} aria-hidden="true" style={{ display: 'block' }}>
      <path
        fill={fill}
        d="M 0 0 L 5 0 L 5 30 L 0 30 Z M 20 0 L 25 0 L 25 30 L 20 30 Z M 29.792 0.007 L 35.656 0.138 L 44.25 14.988 L 41.354 20.03 L 29.792 0.006 Z M 10 0 L 15 0 L 15 5 L 10 5 Z M 10 10 L 15 10 L 15 20 L 10 20 Z"
      />
      <path
        fill={fill}
        d="M 0 29.993 L 0 24.993 L 25 24.993 L 25 29.993 Z M 44.23 25.003 L 47.146 19.982 L 52.917 29.98 L 47.116 29.98 Z M 52.918 0 L 47.053 0.132 L 38.46 14.982 L 41.356 20.023 Z M 38.48 25.003 L 35.564 19.982 L 29.793 29.98 L 35.594 29.98 Z"
      />
      <path fill={fill} d="M 38.479 25.021 L 35.562 20 L 29.792 29.998 L 35.592 29.998 Z" />
    </svg>
  );
}
