export default function Logo({ size = 'md' }) {
  const sizes = {
    sm: { icon: 18, text: 'text-base' },
    md: { icon: 22, text: 'text-lg' },
    lg: { icon: 28, text: 'text-2xl' },
  }

  const s = sizes[size]

  return (
    <span className="inline-flex items-center gap-2">
      {/* Minimal timeline icon: vertical line with 3 dots */}
      <svg
        width={s.icon}
        height={s.icon}
        viewBox="0 0 24 24"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        <line x1="8" y1="3" x2="8" y2="21" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
        <circle cx="8" cy="6" r="2.5" fill="currentColor" />
        <circle cx="8" cy="13" r="2.5" fill="currentColor" opacity="0.5" />
        <circle cx="8" cy="20" r="2" fill="currentColor" opacity="0.25" />
        <line x1="12" y1="6" x2="20" y2="6" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
        <line x1="12" y1="13" x2="18" y2="13" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" opacity="0.5" />
      </svg>
      <span
        className={`font-display font-bold tracking-tight text-accent ${s.text}`}
      >
        timeliner
      </span>
    </span>
  )
}
