import { ArrowUpDown, GripVertical } from 'lucide-react'
import useTimelineStore from '@/store/useTimelineStore'
import { SORT_OPTIONS } from '@/utils/constants'

const SORT_LABELS = {
  [SORT_OPTIONS.DATE_ASC]: 'Date (oldest first)',
  [SORT_OPTIONS.DATE_DESC]: 'Date (newest first)',
  [SORT_OPTIONS.TITLE_ASC]: 'Title (A-Z)',
  [SORT_OPTIONS.TITLE_DESC]: 'Title (Z-A)',
  [SORT_OPTIONS.CUSTOM]: 'Custom order',
}

export default function SortBar({ onDragMode, dragMode }) {
  const sortOrder = useTimelineStore((s) => s.sortOrder)
  const setSortOrder = useTimelineStore((s) => s.setSortOrder)

  return (
    <div className="flex items-center gap-2">
      <div className="flex items-center gap-1.5">
        <ArrowUpDown size={13} className="text-gray-400" />
        <select
          value={sortOrder}
          onChange={(e) => setSortOrder(e.target.value)}
          className="text-xs bg-transparent border-none text-gray-600 font-medium cursor-pointer focus:outline-none pr-6 -mr-4"
        >
          {Object.entries(SORT_LABELS).map(([key, label]) => (
            <option key={key} value={key}>
              {label}
            </option>
          ))}
        </select>
      </div>

      {onDragMode && (
        <button
          onClick={() => onDragMode(!dragMode)}
          className={`flex items-center gap-1 rounded-lg px-2.5 py-1 text-xs font-medium transition-all cursor-pointer border ${
            dragMode
              ? 'bg-accent-light text-accent border-accent/20'
              : 'bg-gray-50 text-gray-500 border-gray-200 hover:text-gray-700'
          }`}
          title={dragMode ? 'Exit reorder mode' : 'Drag to reorder events'}
        >
          <GripVertical size={12} />
          {dragMode ? 'Done' : 'Reorder'}
        </button>
      )}
    </div>
  )
}
