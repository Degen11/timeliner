import { UserRound } from 'lucide-react'
import { getTagStyle, getTagDarkStyle } from '@/utils/constants'

/**
 * Badge / Pill component.
 *
 * variant:
 *   - "default"  — neutral gray
 *   - "accent"   — people badge (slate with user icon, rounded-lg square shape)
 *   - "flag"     — warning/flag
 *   - any string — treated as a tag name, styled via the 16-color palette
 *
 * Props:
 *   dark      — use dark sidebar variant colors
 *   small     — compact size (11px font)
 *   onRemove  — show × button
 */
export default function Badge({
  children,
  variant = 'default',
  small = false,
  dark = false,
  onRemove,
}) {
  const isTag = variant !== 'default' && variant !== 'accent' && variant !== 'flag'
  const isPeople = variant === 'accent'

  // Size classes — unified caption size (11px)
  const sizeCls = small ? 'px-1.5 py-0.5 text-[11px]' : 'px-2 py-0.5 text-[11px]'

  // Max width for truncation
  const maxW = small ? 'max-w-[100px]' : 'max-w-[160px]'

  // Build style & class based on variant
  let style = {}
  let cls = ''

  if (isTag) {
    // Tag badge — use inline styles from palette for guaranteed contrast
    style = dark ? getTagDarkStyle(variant) : getTagStyle(variant)
    cls = 'border'
  } else if (isPeople) {
    // People badge — distinct neutral shape with user icon
    if (dark) {
      style = {
        backgroundColor: 'rgba(96,165,250,0.22)',
        color: '#93C5FD',
        borderColor: 'rgba(96,165,250,0.40)',
      }
    } else {
      style = {
        backgroundColor: '#F1F5F9',
        color: '#475569',
        borderColor: '#E2E8F0',
      }
    }
    cls = 'border'
  } else if (variant === 'flag') {
    cls = 'bg-flag-light text-flag border border-flag/30'
  } else {
    // default
    if (dark) {
      style = {
        backgroundColor: 'rgba(100,116,139,0.15)',
        color: '#CBD5E1',
        borderColor: 'rgba(148,163,184,0.20)',
      }
      cls = 'border'
    } else {
      cls = 'bg-gray-100 text-gray-600 border border-gray-200'
    }
  }

  // People badges use rounded-lg (square pill) to differentiate from tag rounded-full
  const radiusCls = isPeople ? 'rounded-lg' : 'rounded-full'

  const textContent = typeof children === 'string' ? children : ''

  return (
    <span
      className={`inline-flex items-center gap-1 font-semibold tracking-wide leading-none transition-colors duration-150 ${radiusCls} ${sizeCls} ${cls}`}
      style={style}
      title={textContent}
    >
      {isPeople && <UserRound size={small ? 10 : 11} className="shrink-0 opacity-70" />}
      <span className={`${maxW} truncate`}>{children}</span>
      {onRemove && (
        <button
          onClick={onRemove}
          className={`ml-0.5 transition-colors cursor-pointer ${
            dark ? 'hover:text-white' : 'hover:text-gray-900'
          }`}
          aria-label="Remove"
        >
          &times;
        </button>
      )}
    </span>
  )
}
