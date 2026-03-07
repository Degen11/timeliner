export function LogoIcon({ size = 18, className = '' }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden="true"
      className={className}
    >
      <line x1="8" y1="3" x2="8" y2="21" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
      <circle cx="8" cy="6" r="3" fill="currentColor" />
      <circle cx="8" cy="13" r="2.5" fill="currentColor" opacity="0.7" />
      <circle cx="8" cy="20" r="2" fill="currentColor" opacity="0.4" />
      <line x1="12" y1="6" x2="20" y2="6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
      <line x1="12" y1="13" x2="18" y2="13" stroke="currentColor" strokeWidth="2" strokeLinecap="round" opacity="0.7" />
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
