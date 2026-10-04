import { ArrowUpDown } from 'lucide-react'
import useTimelineStore from '@/store/useTimelineStore'
import { SORT_OPTIONS } from '@/utils/constants'
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from '@/components/ui/Select'

const SORT_LABELS = {
  [SORT_OPTIONS.DATE_ASC]: 'Oldest first',
  [SORT_OPTIONS.DATE_DESC]: 'Newest first',
  [SORT_OPTIONS.TITLE_ASC]: 'Title A–Z',
  [SORT_OPTIONS.TITLE_DESC]: 'Title Z–A',
}

// Compact inline sort control — sits beside the sidebar's result count
export default function SortBar() {
  const sortOrder = useTimelineStore((s) => s.sortOrder)
  const setSortOrder = useTimelineStore((s) => s.setSortOrder)

  const isNonDefault = sortOrder !== SORT_OPTIONS.DATE_ASC

  return (
    <Select value={sortOrder} onValueChange={setSortOrder}>
      <SelectTrigger
        aria-label={`Sort order: ${SORT_LABELS[sortOrder]}`}
        className={`h-8 sm:h-7 w-auto gap-1.5 -mr-2 px-2 py-0 border-transparent bg-transparent shadow-none text-xs hover:bg-surface-raised [&>svg:last-child]:h-3 [&>svg:last-child]:w-3 ${
          isNonDefault ? 'font-semibold text-text-strong' : 'text-text-default'
        }`}
      >
        <ArrowUpDown size={12} className="shrink-0 text-text-muted" aria-hidden="true" />
        <SelectValue />
      </SelectTrigger>
      <SelectContent align="end">
        {Object.entries(SORT_LABELS).map(([key, label]) => (
          <SelectItem key={key} value={key}>{label}</SelectItem>
        ))}
      </SelectContent>
    </Select>
  )
}
