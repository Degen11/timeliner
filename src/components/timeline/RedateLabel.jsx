import { CalendarClock } from 'lucide-react'

function describeShift(months) {
  if (months === 0) return 'no change'
  const sign = months > 0 ? '+' : '\u2212'
  const abs = Math.abs(months)
  const years = Math.floor(abs / 12)
  const rest = abs % 12
  const parts = []
  if (years) parts.push(`${years} yr${years !== 1 ? 's' : ''}`)
  if (rest) parts.push(`${rest} mo`)
  return sign + parts.join(' ')
}

// Floating "lands on" pill shown above an event while it's dragged along a
// horizontal timeline (see useRedateDrag)
export default function RedateLabel({ x, y, preview }) {
  if (!preview) return null
  return (
    <div
      className="absolute z-40 pointer-events-none -translate-x-1/2 -translate-y-full flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-semibold shadow-lg whitespace-nowrap"
      style={{
        left: x,
        top: y,
        backgroundColor: 'var(--color-tooltip-bg)',
        color: 'var(--color-tooltip-text)',
      }}
      role="status"
      aria-live="polite"
    >
      <CalendarClock size={12} className="shrink-0" />
      {preview.label}
      <span className="font-medium" style={{ color: 'var(--color-tooltip-muted)' }}>
        {describeShift(preview.months)}
      </span>
    </div>
  )
}
