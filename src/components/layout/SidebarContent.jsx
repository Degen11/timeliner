import { Flag } from 'lucide-react'
import useTimelineStore from '@/store/useTimelineStore'
import { getAllPeople, getAllTags, getFilteredEvents, getFlaggedEvents } from '@/store/selectors'
import { countByField } from '@/utils/ui'
import SearchInput from '@/components/filters/SearchInput'
import FilterChips from '@/components/filters/FilterChips'
import YearRangeFilter from '@/components/filters/YearRangeFilter'
import TimelineManager from '@/components/timeline/TimelineManager'
import SortBar from '@/components/timeline/SortBar'
import AnimatedCount from '@/components/shared/AnimatedCount'

function ReviewCard({ flagged, onReview }) {
  const first = flagged[0]
  const count = flagged.length
  return (
    <div className="shrink-0 rounded-xl bg-flag-light px-3 py-2.5">
      <p className="flex items-center gap-2 text-xs font-semibold text-rose-700 dark:text-rose-300">
        <Flag size={13} className="shrink-0 text-flag" aria-hidden="true" />
        {count === 1 ? '1 date to check' : `${count} dates to check`}
      </p>
      <div className="mt-1 flex items-center gap-2.5">
        <p className="min-w-0 flex-1 line-clamp-2 text-[13px] leading-snug text-rose-900 dark:text-rose-100" title={first.title}>
          {first.title}
          {count > 1 && <span className="text-rose-800/80 dark:text-rose-200/80"> and {count - 1} more</span>}
        </p>
        <button
          type="button"
          onClick={onReview}
          aria-label={`Check ${count === 1 ? 'flagged date' : `${count} flagged dates`}`}
          className="shrink-0 rounded-[7px] border border-flag/30 bg-surface px-3 py-1.5 text-xs font-semibold text-rose-700 hover:bg-flag-light dark:text-rose-300 transition-colors duration-150 cursor-pointer"
        >
          Check
        </button>
      </div>
    </div>
  )
}

export default function SidebarContent() {
  const events = useTimelineStore((s) => s.events)
  const filters = useTimelineStore((s) => s.filters)
  const setFilters = useTimelineStore((s) => s.setFilters)
  const clearFilters = useTimelineStore((s) => s.clearFilters)
  const toggleReviewMode = useTimelineStore((s) => s.toggleReviewMode)

  const allPeople = getAllPeople(events)
  const allTags = getAllTags(events)
  const flagged = getFlaggedEvents(events)
  const filteredCount = getFilteredEvents(events, filters).length

  const peopleCounts = countByField(events, 'people')
  const tagCounts = countByField(events, 'tags')

  const hasDateFilter = Boolean(filters.dateFrom || filters.dateTo)
  const activeFilterCount =
    filters.people.length + filters.tags.length + (hasDateFilter ? 1 : 0)
  const isFiltered = activeFilterCount > 0 || Boolean(filters.search)

  // Read the latest filters at call time so rapid successive updates compose
  const updateFilter = (key, value) => {
    const current = useTimelineStore.getState().filters
    setFilters({ ...current, [key]: value })
  }

  return (
    // Fills the sidebar's height without scrolling: fixed blocks keep their
    // size and the People/Tags chip groups absorb whatever space is left
    <div className="flex h-full min-h-0 flex-col gap-4 [@media(max-height:760px)]:gap-3">
      <div className="shrink-0 space-y-3">
        <TimelineManager />
        <div className="space-y-1.5">
          <SearchInput
            value={filters.search}
            onChange={(search) => updateFilter('search', search)}
            shortcutHint="/"
          />
          <div className="flex items-center justify-between pl-0.5 text-xs text-text-muted">
            <span role="status" aria-live="polite">
              {isFiltered ? (
                <>
                  <strong className="font-semibold text-text-strong">
                    <AnimatedCount value={filteredCount} />
                  </strong>{' '}
                  of <AnimatedCount value={events.length} /> events
                </>
              ) : (
                <>
                  <AnimatedCount value={events.length} /> event{events.length !== 1 ? 's' : ''}
                </>
              )}
            </span>
            <SortBar />
          </div>
        </div>
      </div>

      {events.length > 0 && (
        <section
          aria-labelledby="sidebar-filters-heading"
          className="flex flex-1 min-h-0 flex-col gap-4 overflow-hidden border-t border-gray-100 dark:border-sidebar-border pt-4 [@media(max-height:760px)]:gap-3 [@media(max-height:760px)]:pt-3"
        >
          <div className="flex shrink-0 items-center justify-between">
            <h2 id="sidebar-filters-heading" className="flex items-center gap-1.5 text-xs font-semibold text-text-strong">
              Filters
              {activeFilterCount > 0 && (
                <span className="inline-flex h-[18px] min-w-[18px] items-center justify-center rounded-full bg-text-strong px-1 text-[11px] font-semibold text-canvas">
                  <AnimatedCount value={activeFilterCount} />
                </span>
              )}
            </h2>
            {isFiltered && (
              <button
                type="button"
                onClick={clearFilters}
                className="text-xs text-text-muted underline underline-offset-2 hover:text-text-default transition-colors duration-150 cursor-pointer"
              >
                Clear all
              </button>
            )}
          </div>

          <FilterChips
            label="People"
            options={allPeople}
            selected={filters.people}
            onChange={(people) => updateFilter('people', people)}
            counts={peopleCounts}
            fill
          />
          <FilterChips
            label="Tags"
            options={allTags}
            selected={filters.tags}
            onChange={(tags) => updateFilter('tags', tags)}
            counts={tagCounts}
            showColors
            fill
          />
          <YearRangeFilter
            className="shrink-0"
            events={events}
            dateFrom={filters.dateFrom}
            dateTo={filters.dateTo}
            onChange={updateFilter}
          />
        </section>
      )}

      {flagged.length > 0 && <ReviewCard flagged={flagged} onReview={toggleReviewMode} />}
    </div>
  )
}
