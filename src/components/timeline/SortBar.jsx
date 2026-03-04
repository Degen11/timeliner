import { ArrowUpDown, ChevronDown } from 'lucide-react'
import useTimelineStore from '@/store/useTimelineStore'
import { SORT_OPTIONS } from '@/utils/constants'

const SORT_LABELS = {
  [SORT_OPTIONS.DATE_ASC]: 'Date (oldest first)',
  [SORT_OPTIONS.DATE_DESC]: 'Date (newest first)',
  [SORT_OPTIONS.TITLE_ASC]: 'Title (A-Z)',
  [SORT_OPTIONS.TITLE_DESC]: 'Title (Z-A)',
}

export default function SortBar({ dark = false }) {
  const sortOrder = useTimelineStore((s) => s.sortOrder)
  const setSortOrder = useTimelineStore((s) => s.setSortOrder)

  const isNonDefault = sortOrder !== SORT_OPTIONS.DATE_ASC

  // Dark mode styles with improved contrast
  // Default: #CBD5E1 on #1e293b = 8.2:1 (AAA)
  // Active: #93C5FD on ~#172240 = 5.8:1 (AA)
  const containerStyle = dark
    ? isNonDefault
      ? { backgroundColor: 'rgba(37,99,235,0.15)', borderColor: 'rgba(37,99,235,0.4)' }
      : { borderColor: '#475569' }
    : undefined

  const textColor = dark ? (isNonDefault ? '#93C5FD' : '#CBD5E1') : undefined

  return (
    <div>
      {dark && (
        <span
          className="block text-[11px] font-semibold uppercase tracking-wider mb-1 px-1"
          style={{ color: '#94A3B8' }}
        >
          Sort by
        </span>
      )}
      <div
        className={`relative flex items-center gap-2 w-full rounded-lg border px-3 py-2 transition-all cursor-pointer ${
          dark
            ? 'bg-sidebar-input hover:bg-white/[0.04]'
            : isNonDefault
              ? 'border-secondary/40 bg-soft-accent'
              : 'border-gray-200/60 bg-white/60 hover:bg-gray-50'
        }`}
        style={containerStyle}
      >
        <ArrowUpDown
          size={14}
          className="shrink-0"
          style={dark ? { color: textColor } : undefined}
          {...(!dark && {
            className: `shrink-0 ${isNonDefault ? 'text-secondary' : 'text-gray-300'}`,
          })}
        />
        <select
          value={sortOrder}
          onChange={(e) => setSortOrder(e.target.value)}
          className={`flex-1 text-xs bg-transparent appearance-none border-0 cursor-pointer focus:outline-none pr-4 ${
            dark
              ? isNonDefault
                ? 'font-semibold'
                : 'font-medium'
              : isNonDefault
                ? 'text-secondary font-medium'
                : 'text-gray-500'
          }`}
          style={dark ? { color: textColor } : undefined}
        >
          {Object.entries(SORT_LABELS).map(([key, label]) => (
            <option key={key} value={key}>
              {label}
            </option>
          ))}
        </select>
        <ChevronDown
          size={12}
          className="absolute right-2.5 pointer-events-none"
          style={dark ? { color: textColor } : undefined}
          {...(!dark && {
            className: `absolute right-2.5 pointer-events-none ${isNonDefault ? 'text-secondary' : 'text-gray-300'}`,
          })}
        />
      </div>
    </div>
  )
}
