export function LogoIcon({ size = 18, className = '' }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 64 64"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden="true"
      className={className}
    >
      {/* Same mark as public/favicon.svg; the tile follows currentColor and the marks use the canvas color so it inverts in dark mode */}
      <rect width="64" height="64" rx="14" fill="currentColor" />
      <line x1="12" y1="32" x2="52" y2="32" strokeWidth="3" strokeLinecap="round" opacity="0.35" style={{ stroke: 'var(--color-canvas)' }} />
      <circle cx="16" cy="32" r="4" opacity="0.55" style={{ fill: 'var(--color-canvas)' }} />
      <circle cx="48" cy="32" r="4" style={{ fill: 'var(--color-canvas)' }} />
      <circle cx="32" cy="32" r="8" fill="#f97316" />
    </svg>
  )
}

export default function Logo({ size = 'md', textClassName = 'text-text-strong' }) {
  const sizes = {
    sm: { icon: 18, text: 'text-base' },
    md: { icon: 22, text: 'text-lg' },
    lg: { icon: 28, text: 'text-2xl' },
  }

  const s = sizes[size]

  return (
    <span className="inline-flex items-center gap-2.5">
      <LogoIcon size={s.icon} />
      <span className={`font-display font-bold tracking-tight ${textClassName} ${s.text}`}>
        timeliner
      </span>
    </span>
  )
}
