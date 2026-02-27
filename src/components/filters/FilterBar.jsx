import { AlertTriangle, X } from 'lucide-react'
import useTimelineStore from '@/store/useTimelineStore'
import { getAllPeople, getAllTags, getFlaggedEvents } from '@/store/selectors'
import SearchInput from './SearchInput'
import MultiSelect from './MultiSelect'
import Badge from '@/components/shared/Badge'

export default function FilterBar() {
  const { events, filters, setFilters, clearFilters, toggleReviewMode } =
    useTimelineStore()

  const allPeople = getAllPeople(events)
  const allTags = getAllTags(events)
  const flaggedCount = getFlaggedEvents(events).length

  const hasActiveFilters =
    filters.search || filters.people.length > 0 || filters.tags.length > 0

  return (
    <div className="flex flex-col gap-2">
      <div className="flex flex-wrap items-center gap-2">
        <div className="w-full sm:w-64">
          <SearchInput
            value={filters.search}
            onChange={(search) => setFilters({ ...filters, search })}
          />
        </div>

        <MultiSelect
          label="People"
          options={allPeople}
          selected={filters.people}
          onChange={(people) => setFilters({ ...filters, people })}
        />

        <MultiSelect
          label="Tags"
          options={allTags}
          selected={filters.tags}
          onChange={(tags) => setFilters({ ...filters, tags })}
        />

        {hasActiveFilters && (
          <button
            onClick={clearFilters}
            className="flex items-center gap-1 text-xs text-gray-500 hover:text-gray-700"
          >
            <X size={12} />
            Clear filters
          </button>
        )}

        <div className="ml-auto">
          {flaggedCount > 0 && (
            <button
              onClick={toggleReviewMode}
              className="flex items-center gap-1.5 rounded-md border border-flag/30 bg-flag-light px-3 py-1.5 text-xs font-medium text-flag hover:bg-flag-light/80 transition-colors"
            >
              <AlertTriangle size={12} />
              {flaggedCount} flagged
            </button>
          )}
        </div>
      </div>

      {/* Active filter badges */}
      {hasActiveFilters && (
        <div className="flex flex-wrap gap-1.5">
          {filters.people.map((p) => (
            <Badge
              key={p}
              variant="accent"
              onRemove={() =>
                setFilters({
                  ...filters,
                  people: filters.people.filter((x) => x !== p),
                })
              }
            >
              {p}
            </Badge>
          ))}
          {filters.tags.map((t) => (
            <Badge
              key={t}
              onRemove={() =>
                setFilters({
                  ...filters,
                  tags: filters.tags.filter((x) => x !== t),
                })
              }
            >
              {t}
            </Badge>
          ))}
        </div>
      )}
    </div>
  )
}
