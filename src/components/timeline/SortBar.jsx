import { ArrowUpDown } from 'lucide-react'
import useTimelineStore from '@/store/useTimelineStore'
import { SORT_OPTIONS } from '@/utils/constants'
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from '@/components/ui/Select'

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

  return (
    <div>
      {dark && (
        <span className="block text-xs font-semibold uppercase tracking-wider mb-1 px-1 text-sidebar-muted">
          Sort by
        </span>
      )}
      <Select value={sortOrder} onValueChange={setSortOrder}>
        <SelectTrigger
          className={`h-auto px-3 py-2 text-xs gap-2 ${
            dark
              ? isNonDefault
                ? 'bg-secondary/15 border-secondary/40 hover:bg-secondary/20 font-semibold text-blue-300'
                : 'bg-sidebar-input border-sidebar-input-border hover:bg-sidebar-hover font-medium text-sidebar-text'
              : isNonDefault
                ? 'border-secondary/40 bg-soft-accent text-secondary font-medium'
                : 'border-gray-200 bg-white hover:bg-surface-raised text-text-muted'
          }`}
        >
          <ArrowUpDown size={14} className={`shrink-0 ${iconCls}`} />
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          {Object.entries(SORT_LABELS).map(([key, label]) => (
            <SelectItem key={key} value={key}>{label}</SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  )
}
