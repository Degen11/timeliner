import { X } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { Tooltip } from '@/components/ui/Tooltip'
import { buildYearHistogram, getBiggestBlocker, getFilterRelaxations, getYearSpan } from '@/store/selectors'
import { safeGetUTCYear } from '@/utils/dateUtils'
import { YEAR_HISTOGRAM_MAX_BINS, FILTER_EMPTY_REVEAL_MAX } from '@/utils/constants'
import useTimelineStore from '@/store/useTimelineStore'

const KIND_LABEL = { search: 'Search', person: 'Person', tag: 'Tag', dates: 'Years' }

function describeValue(r) {
  if (r.kind === 'search') return `“${r.value}”`
  if (r.kind === 'dates') return `${r.value.from || '…'} – ${r.value.to || '…'}`
  return r.value
}

const plural = (n) => `${n} event${n !== 1 ? 's' : ''}`

/**
 * Where the filtered-out events sit: the date window outlined over the whole
 * timeline, with the periods holding events that match the other filters
 * picked out. Only shown when a date filter is part of the problem.
 */
function RangeHistogram({ events, filters, matches }) {
  const histogram = buildYearHistogram(events, YEAR_HISTOGRAM_MAX_BINS)
  if (!histogram) return null
  const { bins } = histogram
  const fromYear = safeGetUTCYear(filters.dateFrom, -Infinity)
  const toYear = safeGetUTCYear(filters.dateTo, Infinity)
  const inRange = bins.map((b) => b.to >= fromYear && b.from <= toYear)
  const first = inRange.indexOf(true)
  const last = inRange.lastIndexOf(true)

  const matchYears = new Set(matches.map((e) => safeGetUTCYear(e.dateStart, null)).filter((y) => y != null))
  const hasMatch = bins.map((b) => [...matchYears].some((y) => y >= b.from && y <= b.to))
  const max = Math.max(1, ...bins.map((b) => b.count))

  return (
    <figure className="m-0 flex flex-col gap-2" aria-label="Events per period across the timeline, with your date range outlined">
      <div
        className="grid h-14 gap-[3px]"
        style={{ gridTemplateColumns: `repeat(${bins.length}, minmax(0, 1fr))` }}
        aria-hidden="true"
      >
        {first !== -1 && (
          <div
            className="-mx-[3px] -mt-1.5 rounded-t-md border-[1.5px] border-b-0 border-highlight bg-highlight/[0.07]"
            style={{ gridColumn: `${first + 1} / ${last + 2}`, gridRow: 1 }}
          />
        )}
        {bins.map((b, i) => (
          <div
            key={b.from}
            className={`self-end rounded-t-[2px] ${
              hasMatch[i] ? 'bg-text-strong' : inRange[i] ? 'bg-highlight/45' : 'bg-gray-200'
            }`}
            style={{ gridColumn: i + 1, gridRow: 1, height: `${Math.max(6, (b.count / max) * 100)}%` }}
          />
        ))}
      </div>
      <div className="-mt-2 h-px bg-gray-200" aria-hidden="true" />
      <figcaption className="flex flex-wrap items-center justify-between gap-x-4 gap-y-1 text-xs text-text-muted">
        <span className="font-serif text-[13px] tabular-nums">{histogram.min}</span>
        <span className="flex flex-wrap items-center gap-x-4 gap-y-1">
          <span className="inline-flex items-center gap-1.5">
            <span className="size-2.5 rounded-[2px] border-[1.5px] border-highlight bg-highlight/[0.07]" aria-hidden="true" />
            Your range
          </span>
          {matches.length > 0 && (
            <span className="inline-flex items-center gap-1.5">
              <span className="size-2.5 rounded-[2px] bg-text-strong" aria-hidden="true" />
              Matches your other filters
            </span>
          )}
        </span>
        <span className="font-serif text-[13px] tabular-nums">{histogram.max}</span>
      </figcaption>
    </figure>
  )
}

/**
 * Displayed when active filters match zero events. Instead of a wall of
 * pills, it shows what each filter is costing: how many events come back if
 * you drop it, with the filter that unlocks the most promoted.
 */
export default function FilterEmptyState({ events, filters, setFilters, clearFilters }) {
  const relaxations = getFilterRelaxations(events, filters)
  const blocker = getBiggestBlocker(relaxations)
  const dates = relaxations.find((r) => r.kind === 'dates')
  const span = getYearSpan(events)
  const filterCount = relaxations.length

  const title =
    filterCount > 1
      ? `Nothing fits all ${filterCount === 2 ? 'both' : filterCount} filters`
      : 'Nothing matches this filter'
  const summary = span
    ? `Your ${plural(events.length)} run from ${span.min} to ${span.max}.`
    : `Your timeline has ${plural(events.length)}.`
  const hint = blocker
    ? 'Remove one filter to see what’s there.'
    : 'No single filter is the problem. Try removing a few, or start over.'

  const reveal = blocker && blocker.count <= FILTER_EMPTY_REVEAL_MAX ? blocker.matches : []
  const showEvent = (event) => {
    setFilters(blocker.without)
    useTimelineStore.getState().openEventDetail(event)
  }

  return (
    <section className="mx-auto flex w-full max-w-2xl flex-col gap-6 px-1 py-10 sm:py-14" aria-labelledby="filter-empty-title">
      <div className="flex flex-col gap-1.5">
        <h2 id="filter-empty-title" className="font-serif text-2xl sm:text-[28px] font-medium leading-tight text-text-strong text-balance">
          {title}
        </h2>
        <p className="text-sm text-text-muted">{summary} {hint}</p>
      </div>

      {dates && <RangeHistogram events={events} filters={filters} matches={dates.matches} />}

      <ul className="m-0 flex list-none flex-col overflow-hidden rounded-xl border border-gray-200 bg-surface p-0">
        {relaxations.map((r) => {
          const isBlocker = r === blocker
          return (
            <li
              key={r.id}
              className={`flex items-center gap-4 border-t border-gray-100 py-3 pl-4 pr-3 first:border-t-0 ${isBlocker ? 'bg-highlight/[0.06]' : ''}`}
            >
              <div className="flex min-w-0 flex-1 flex-col gap-0.5">
                <span className={`text-[11px] font-semibold uppercase tracking-wider ${isBlocker ? 'text-orange-700 dark:text-orange-400' : 'text-text-muted'}`}>
                  {KIND_LABEL[r.kind]}
                  {isBlocker && filterCount > 1 && ' · the blocker'}
                </span>
                <span className="truncate text-sm font-medium text-text-strong">{describeValue(r)}</span>
              </div>
              {r.count > 0 ? (
                <Button
                  size="sm"
                  variant={isBlocker ? 'primary' : 'secondary'}
                  onClick={() => setFilters(r.without)}
                  aria-label={`Remove ${KIND_LABEL[r.kind].toLowerCase()} filter ${describeValue(r)}, shows ${plural(r.count)}`}
                >
                  Remove · {plural(r.count)}
                </Button>
              ) : (
                <span className="flex shrink-0 items-center gap-1 text-[13px] text-text-muted">
                  <span className="hidden sm:inline">Removing still shows 0</span>
                  <span className="sm:hidden">Still 0</span>
                  <Tooltip label="Remove anyway">
                    <button
                      type="button"
                      onClick={() => setFilters(r.without)}
                      className="touch-target rounded-md p-1.5 text-text-muted hover:bg-soft-accent hover:text-text-strong transition-colors duration-150 cursor-pointer"
                      aria-label={`Remove ${KIND_LABEL[r.kind].toLowerCase()} filter ${describeValue(r)}`}
                    >
                      <X size={14} />
                    </button>
                  </Tooltip>
                </span>
              )}
            </li>
          )
        })}
      </ul>

      <p className="text-[13px] text-text-muted">
        {reveal.length === 1 && (
          <>
            {reveal[0].title}
            {safeGetUTCYear(reveal[0].dateStart, null) != null && ` is in ${safeGetUTCYear(reveal[0].dateStart, null)}`}.{' '}
            <button type="button" onClick={() => showEvent(reveal[0])} className="font-medium text-text-strong underline decoration-gray-300 underline-offset-[3px] hover:decoration-text-strong cursor-pointer">
              Show it
            </button>
            {' or '}
          </>
        )}
        {reveal.length > 1 && (
          <>
            {'Close by: '}
            {reveal.map((e, i) => (
              <span key={e.id}>
                <button type="button" onClick={() => showEvent(e)} className="font-medium text-text-strong underline decoration-gray-300 underline-offset-[3px] hover:decoration-text-strong cursor-pointer">
                  {e.title}
                </button>
                {i < reveal.length - 1 ? ', ' : '. '}
              </span>
            ))}
            {'Or '}
          </>
        )}
        <button type="button" onClick={() => clearFilters()} className="font-medium text-text-strong underline decoration-gray-300 underline-offset-[3px] hover:decoration-text-strong cursor-pointer">
          {reveal.length > 0 ? 'clear all filters' : 'Clear all filters'}
        </button>
        .
      </p>
    </section>
  )
}
