import { ArrowUpDown, ChevronDown } from 'lucide-react'
import useTimelineStore from '@/store/useTimelineStore'
import { SORT_OPTIONS } from '@/utils/constants'

const SORT_LABELS = {
  [SORT_OPTIONS.DATE_ASC]: 'Date (oldest first)',
  [SORT_OPTIONS.DATE_DESC]: 'Date (newest first)',
  [SORT_OPTIONS.TITLE_ASC]: 'Title (A-Z)',
  [SORT_OPTIONS.TITLE_DESC]: 'Title (Z-A)',
}

export default function SortBar() {
  const sortOrder = useTimelineStore((s) => s.sortOrder)
  const setSortOrder = useTimelineStore((s) => s.setSortOrder)

  const isNonDefault = sortOrder !== SORT_OPTIONS.DATE_ASC

  return (
    <div className="flex items-center gap-2 shrink-0">
      <div className={`relative flex items-center gap-1.5 rounded-lg border px-2.5 py-1.5 transition-colors ${
        isNonDefault
          ? 'border-secondary/40 bg-soft-accent'
          : 'border-gray-200/60 bg-white/60'
      }`}>
        <ArrowUpDown size={12} className={isNonDefault ? 'text-secondary' : 'text-gray-300'} />
        <select
          value={sortOrder}
          onChange={(e) => setSortOrder(e.target.value)}
          className={`text-xs bg-transparent appearance-none border-0 cursor-pointer focus:outline-none pr-4 ${
            isNonDefault ? 'text-secondary font-medium' : 'text-gray-500'
          }`}
        >
          {Object.entries(SORT_LABELS).map(([key, label]) => (
            <option key={key} value={key}>
              {label}
            </option>
          ))}
        </select>
        <ChevronDown size={10} className={`absolute right-2.5 pointer-events-none ${isNonDefault ? 'text-secondary' : 'text-gray-300'}`} />
      </div>
    </div>
  )
}
