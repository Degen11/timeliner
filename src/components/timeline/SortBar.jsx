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

  return (
    <div className="flex items-center gap-2 shrink-0">
      <div className="relative flex items-center gap-1.5 rounded-lg border border-gray-200/60 bg-white/60 px-2.5 py-1.5">
        <ArrowUpDown size={12} className="text-gray-300" />
        <select
          value={sortOrder}
          onChange={(e) => setSortOrder(e.target.value)}
          className="text-xs bg-transparent appearance-none border-0 text-gray-500 cursor-pointer focus:outline-none pr-4"
        >
          {Object.entries(SORT_LABELS).map(([key, label]) => (
            <option key={key} value={key}>
              {label}
            </option>
          ))}
        </select>
        <ChevronDown size={10} className="absolute right-2.5 text-gray-300 pointer-events-none" />
      </div>
    </div>
  )
}
