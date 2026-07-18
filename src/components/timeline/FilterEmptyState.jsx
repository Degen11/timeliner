import { X } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import EmptyState from '@/components/shared/EmptyState'

/**
 * Displayed when active filters match zero events.
 * Shows active filter badges with individual remove buttons.
 */
export default function FilterEmptyState({ filters, setFilters, clearFilters, totalCount }) {
  return (
    <EmptyState
      title="No matching events"
      description={`0 of ${totalCount} event${totalCount !== 1 ? 's' : ''} match your filters`}
    >
      <div className="flex flex-col items-center gap-3">
        <div className="flex flex-wrap justify-center gap-1.5 max-w-sm">
          {filters.search && (
            <span className="inline-flex items-center gap-1 rounded-full bg-gray-100 dark:bg-white/10 px-2.5 py-1 text-xs text-text-muted">
              Search: &ldquo;{filters.search}&rdquo;
              <button
                onClick={() => setFilters({ ...filters, search: '' })}
                className="ml-0.5 hover:text-text-strong cursor-pointer"
                aria-label="Clear search filter"
              >
                <X size={12} />
              </button>
            </span>
          )}
          {filters.people.map((p) => (
            <span key={p} className="inline-flex items-center gap-1 rounded-full bg-gray-100 dark:bg-white/10 px-2.5 py-1 text-xs text-text-muted">
              {p}
              <button
                onClick={() => setFilters({ ...filters, people: filters.people.filter((x) => x !== p) })}
                className="ml-0.5 hover:text-text-strong cursor-pointer"
                aria-label={`Remove ${p} filter`}
              >
                <X size={12} />
              </button>
            </span>
          ))}
          {filters.tags.map((t) => (
            <span key={t} className="inline-flex items-center gap-1 rounded-full bg-gray-100 dark:bg-white/10 px-2.5 py-1 text-xs text-text-muted">
              {t}
              <button
                onClick={() => setFilters({ ...filters, tags: filters.tags.filter((x) => x !== t) })}
                className="ml-0.5 hover:text-text-strong cursor-pointer"
                aria-label={`Remove ${t} filter`}
              >
                <X size={12} />
              </button>
            </span>
          ))}
          {(filters.dateFrom || filters.dateTo) && (
            <span className="inline-flex items-center gap-1 rounded-full bg-gray-100 dark:bg-white/10 px-2.5 py-1 text-xs text-text-muted">
              {filters.dateFrom || '…'} – {filters.dateTo || '…'}
              <button
                onClick={() => setFilters({ ...filters, dateFrom: '', dateTo: '' })}
                className="ml-0.5 hover:text-text-strong cursor-pointer"
                aria-label="Clear date range filter"
              >
                <X size={12} />
              </button>
            </span>
          )}
        </div>
        <Button variant="secondary" onClick={() => clearFilters()}>
          Clear all filters
        </Button>
      </div>
    </EmptyState>
  )
}
