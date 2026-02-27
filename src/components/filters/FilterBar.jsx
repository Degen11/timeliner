import { useMemo, useCallback } from 'react'
import { AlertTriangle, X } from 'lucide-react'
import useTimelineStore from '@/store/useTimelineStore'
import { getAllPeople, getAllTags, getFlaggedEvents } from '@/store/selectors'
import SearchInput from './SearchInput'
import MultiSelect from './MultiSelect'
import Badge from '@/components/shared/Badge'

export default function FilterBar() {
  const { events, filters, setFilters, clearFilters, toggleReviewMode } =
    useTimelineStore()

  const allPeople = useMemo(() => getAllPeople(events), [events])
  const allTags = useMemo(() => getAllTags(events), [events])
  const flaggedCount = useMemo(() => getFlaggedEvents(events).length, [events])

  const hasActiveFilters =
    filters.search || filters.people.length > 0 || filters.tags.length > 0

  const handleSearchChange = useCallback(
    (search) => setFilters({ ...filters, search }),
    [filters, setFilters]
  )

  const handlePeopleChange = useCallback(
    (people) => setFilters({ ...filters, people }),
    [filters, setFilters]
  )

  const handleTagsChange = useCallback(
    (tags) => setFilters({ ...filters, tags }),
    [filters, setFilters]
  )

  const handleRemovePerson = useCallback(
    (p) => setFilters({ ...filters, people: filters.people.filter((x) => x !== p) }),
    [filters, setFilters]
  )

  const handleRemoveTag = useCallback(
    (t) => setFilters({ ...filters, tags: filters.tags.filter((x) => x !== t) }),
    [filters, setFilters]
  )

  return (
    <div className="flex flex-col gap-2">
      <div className="flex flex-wrap items-center gap-2">
        <div className="w-full sm:w-64">
          <SearchInput
            value={filters.search}
            onChange={handleSearchChange}
          />
        </div>

        <MultiSelect
          label="People"
          options={allPeople}
          selected={filters.people}
          onChange={handlePeopleChange}
        />

        <MultiSelect
          label="Tags"
          options={allTags}
          selected={filters.tags}
          onChange={handleTagsChange}
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
              className="flex items-center gap-1.5 rounded-lg border border-flag/30 bg-flag-light px-3 py-1.5 text-xs font-medium text-flag hover:bg-flag-light/80 transition-all cursor-pointer"
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
              onRemove={() => handleRemovePerson(p)}
            >
              {p}
            </Badge>
          ))}
          {filters.tags.map((t) => (
            <Badge
              key={t}
              onRemove={() => handleRemoveTag(t)}
            >
              {t}
            </Badge>
          ))}
        </div>
      )}
    </div>
  )
}
