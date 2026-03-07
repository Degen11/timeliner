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

  const iconCls = dark
    ? isNonDefault ? 'text-blue-300' : 'text-sidebar-muted'
    : isNonDefault ? 'text-secondary' : 'text-text-muted'

  const selectCls = dark
    ? isNonDefault ? 'font-semibold text-blue-300' : 'font-medium text-sidebar-text'
    : isNonDefault ? 'text-secondary font-medium' : 'text-text-muted'

  return (
    <div>
      {dark && (
        <span className="block text-xs font-semibold uppercase tracking-wider mb-1 px-1 text-sidebar-muted">
          Sort by
        </span>
      )}
      <div
        className={`relative flex items-center gap-2 w-full rounded-lg border px-3 py-2 transition-colors duration-150 cursor-pointer ${
          dark
            ? isNonDefault
              ? 'bg-secondary/15 border-secondary/40 hover:bg-secondary/20'
              : 'bg-sidebar-input border-sidebar-input-border hover:bg-sidebar-hover'
            : isNonDefault
              ? 'border-secondary/40 bg-soft-accent'
              : 'border-gray-200 bg-white hover:bg-surface-raised'
        }`}
      >
        <ArrowUpDown size={14} className={`shrink-0 ${iconCls}`} />
        <select
          value={sortOrder}
          onChange={(e) => setSortOrder(e.target.value)}
          className={`flex-1 text-xs bg-transparent appearance-none border-0 cursor-pointer focus:outline-none pr-4 ${selectCls}`}
        >
          {Object.entries(SORT_LABELS).map(([key, label]) => (
            <option key={key} value={key}>
              {label}
            </option>
          ))}
        </select>
        <ChevronDown size={12} className={`absolute right-2.5 pointer-events-none ${iconCls}`} />
      </div>
    </div>
  )
}
