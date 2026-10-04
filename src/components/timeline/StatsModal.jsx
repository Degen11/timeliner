import { X, Filter, AlertTriangle } from 'lucide-react'
import AnimatedModal from '@/components/shared/AnimatedModal'
import { Button } from '@/components/ui/Button'
import { Tooltip } from '@/components/ui/Tooltip'
import useTimelineStore from '@/store/useTimelineStore'
import { buildPeriodHistogram, getYearSpan, getFlaggedEvents } from '@/store/selectors'
import { countByField, pluralize } from '@/utils/ui'
import { getTagPalette, STATS_MAX_PERIODS, STATS_TOP_N } from '@/utils/constants'

const EMPTY_FILTERS = { search: '', people: [], tags: [], dateFrom: '', dateTo: '' }

// "Albert Einstein" → "AE"
const initials = (name) =>
  name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((w) => w[0].toUpperCase())
    .join('')

const periodLabel = ({ from, to }, size) => (size === 10 ? `${from}s` : `${from}–${to}`)

const ranked = (counts) => Object.entries(counts).sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]))

function computeStats(events) {
  if (events.length === 0) return null

  const peopleCounts = countByField(events, 'people')
  const tagCounts = countByField(events, 'tags')
  const people = ranked(peopleCounts)
  const tags = ranked(tagCounts)

  // The timeline's subject often appears in most events; give them a callout
  // so the bars compare everyone else instead of all reading as slivers
  const [lead] = people
  const hasLead = lead && people.length > 1 && lead[1] >= events.length / 2

  return {
    span: getYearSpan(events),
    histogram: buildPeriodHistogram(events, STATS_MAX_PERIODS),
    places: new Set(events.map((e) => e.location?.trim()).filter(Boolean)).size,
    peopleTotal: people.length,
    tagsTotal: tags.length,
    lead: hasLead ? { name: lead[0], count: lead[1] } : null,
    topPeople: people.slice(hasLead ? 1 : 0, (hasLead ? 1 : 0) + STATS_TOP_N),
    topTags: tags.slice(0, STATS_TOP_N),
    flaggedCount: getFlaggedEvents(events).length,
  }
}

function HeroNumber({ value, label }) {
  return (
    <div className="flex flex-col gap-0.5 py-3 sm:py-3.5 pl-4 first:pl-0 border-l border-gray-200 first:border-l-0">
      <span className="font-serif text-2xl sm:text-[28px] font-semibold leading-none tabular-nums text-text-strong">{value}</span>
      <span className="text-xs text-text-default">{label}</span>
    </div>
  )
}

function PeriodChart({ histogram, onPick }) {
  const { bins, size } = histogram
  const max = Math.max(...bins.map((b) => b.count), 1)
  const labelAll = bins.length <= 10
  const thinLabels = bins.length > 10
  const busiest = bins.filter((b) => b.count === max && b.count > 0)

  return (
    <section aria-labelledby="stats-periods" className="space-y-2.5">
      <div className="flex items-baseline justify-between gap-3">
        <h3 id="stats-periods" className="text-[13px] font-semibold text-text-strong">
          Events by {size === 10 ? 'decade' : `${size}-year period`}
        </h3>
        {busiest.length > 0 && busiest.length < bins.length && (
          <span className="truncate text-xs text-text-muted">
            Busiest: {busiest.slice(0, 2).map((b) => periodLabel(b, size)).join(' and ')}
          </span>
        )}
      </div>
      <div
        className="grid h-32 items-end border-b border-gray-200"
        style={{ gridTemplateColumns: `repeat(${bins.length}, minmax(0, 1fr))` }}
      >
        {bins.map((bin) => {
          const label = periodLabel(bin, size)
          const showValue = bin.count > 0 && (labelAll || bin.count === max)
          return (
            <Tooltip key={bin.from} label={`${label}: ${pluralize(bin.count, 'event')}`} side="top" delayDuration={0}>
              <button
                type="button"
                onClick={() => bin.count > 0 && onPick(bin)}
                disabled={bin.count === 0}
                aria-label={`${label}: ${pluralize(bin.count, 'event')}${bin.count > 0 ? '. Filter timeline to this period' : ''}`}
                className="group flex h-full flex-col items-center justify-end gap-1 rounded-t-md px-0.5 outline-none focus-visible:ring-2 focus-visible:ring-focus-ring enabled:cursor-pointer"
              >
                {showValue && (
                  <span className={`text-xs tabular-nums ${bin.count === max ? 'font-semibold text-text-strong' : 'text-text-default'}`}>
                    {bin.count}
                  </span>
                )}
                <span
                  className="block w-full max-w-6 rounded-t bg-stone-600 transition-colors duration-150 group-enabled:group-hover:bg-stone-800 dark:bg-stone-400 dark:group-enabled:group-hover:bg-stone-200"
                  style={{ height: bin.count === 0 ? 2 : `${Math.max(6, (bin.count / max) * 80)}%`, opacity: bin.count === 0 ? 0.35 : 1 }}
                />
              </button>
            </Tooltip>
          )
        })}
      </div>
      <div
        className="grid text-center font-serif text-[13px] text-text-default"
        style={{ gridTemplateColumns: `repeat(${bins.length}, minmax(0, 1fr))` }}
        aria-hidden="true"
      >
        {bins.map((bin, i) => (
          <span key={bin.from} className="truncate">
            {!thinLabels || i % 2 === 0 ? periodLabel(bin, size) : ''}
          </span>
        ))}
      </div>
    </section>
  )
}

function BarList({ title, rows, onPick, showColors = false, extra }) {
  const max = Math.max(...rows.map(([, c]) => c), 1)
  return (
    <section className="flex min-w-0 flex-col gap-1.5" aria-label={title}>
      <h3 className="text-[13px] font-semibold text-text-strong">{title}</h3>
      {extra}
      {rows.map(([name, count]) => (
        <button
          key={name}
          type="button"
          onClick={() => onPick(name)}
          aria-label={`${name}: ${pluralize(count, 'event')}. Filter timeline`}
          className="-mx-1.5 grid h-9 sm:h-8 grid-cols-[minmax(0,7.5rem)_minmax(0,1fr)_1.75rem] items-center gap-2 rounded-md px-1.5 text-left transition-colors duration-150 hover:bg-surface-raised cursor-pointer"
        >
          <span className="flex min-w-0 items-center gap-1.5 text-[13px] text-text-strong">
            {showColors && (
              <span className="h-2 w-2 shrink-0 rounded-full" style={{ backgroundColor: getTagPalette(name).activeBg }} aria-hidden="true" />
            )}
            <span className="truncate">{name}</span>
          </span>
          <span className="h-2.5 rounded-r bg-stone-600 dark:bg-stone-400" style={{ width: `${Math.max(4, (count / max) * 100)}%` }} aria-hidden="true" />
          <span className="text-right text-xs tabular-nums text-text-default">{count}</span>
        </button>
      ))}
    </section>
  )
}

export default function StatsModal({ open, onClose, events, photoCount }) {
  const timelineName = useTimelineStore(
    (s) => s.timelines.find((t) => t.id === s.activeTimelineId)?.name || 'Timeline'
  )

  // Only compute stats while the modal is open — avoids O(n) work on every
  // event mutation when the modal is closed.
  const stats = open ? computeStats(events) : null

  // Every chart row narrows the timeline to just that slice, then closes
  const applyFilter = (patch) => {
    useTimelineStore.getState().setFilters({ ...EMPTY_FILTERS, ...patch })
    onClose()
  }
  const openReview = () => {
    onClose()
    useTimelineStore.getState().toggleReviewMode()
  }

  const spanLabel = stats?.span
    ? stats.span.min === stats.span.max
      ? String(stats.span.min)
      : `${stats.span.min}–${stats.span.max}`
    : null
  const years = stats?.span ? stats.span.max - stats.span.min + 1 : null

  return (
    <AnimatedModal
      label="Timeline statistics"
      open={open && !!stats}
      onClose={onClose}
      className="bg-surface sm:rounded-2xl shadow-2xl max-w-2xl w-full sm:mx-4 max-h-[92dvh] sm:max-h-[88vh] flex flex-col overflow-hidden modal-surface"
    >
      <div className="flex shrink-0 items-start justify-between gap-4 px-5 sm:px-6 pt-4 sm:pt-5 pb-3">
        <div className="min-w-0 space-y-1">
          <span className="text-xs font-medium text-text-muted">Stats</span>
          <h2 className="truncate font-serif text-2xl font-semibold text-text-strong">
            {timelineName}
            {spanLabel && <span className="text-text-default">, {spanLabel}</span>}
          </h2>
        </div>
        <Button variant="ghost" size="icon" onClick={onClose} aria-label="Close" className="-mr-2">
          <X size={16} />
        </Button>
      </div>

      {stats && (
        <>
          <div className="min-h-0 flex-1 space-y-6 overflow-y-auto px-5 sm:px-6 pb-6 app-scroll">
            <div className="grid grid-cols-3 sm:grid-cols-5 border-y border-gray-200">
              <HeroNumber value={events.length} label={events.length === 1 ? 'event' : 'events'} />
              {years != null && <HeroNumber value={years} label={years === 1 ? 'year' : 'years'} />}
              <HeroNumber value={stats.peopleTotal} label={stats.peopleTotal === 1 ? 'person' : 'people'} />
              <HeroNumber value={stats.places} label={stats.places === 1 ? 'place' : 'places'} />
              <HeroNumber value={stats.tagsTotal} label={stats.tagsTotal === 1 ? 'tag' : 'tags'} />
            </div>

            {stats.histogram && (
              <div className="space-y-1.5">
                <PeriodChart
                  histogram={stats.histogram}
                  onPick={(bin) => applyFilter({ dateFrom: String(bin.from), dateTo: String(bin.to) })}
                />
                {stats.histogram.undated > 0 && (
                  <p className="text-xs text-text-muted">
                    {pluralize(stats.histogram.undated, 'undated event')} not shown
                  </p>
                )}
              </div>
            )}

            {(stats.topPeople.length > 0 || stats.lead || stats.topTags.length > 0) && (
              <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 sm:gap-7">
                {(stats.lead || stats.topPeople.length > 0) && (
                  <BarList
                    title="Who appears most"
                    rows={stats.topPeople}
                    onPick={(name) => applyFilter({ people: [name] })}
                    extra={
                      stats.lead && (
                        <button
                          type="button"
                          onClick={() => applyFilter({ people: [stats.lead.name] })}
                          aria-label={`${stats.lead.name}: in ${stats.lead.count} of ${events.length} events. Filter timeline`}
                          className="mb-1 flex items-center gap-2.5 rounded-[10px] border border-gray-200 bg-surface-raised px-2.5 py-2 text-left transition-colors duration-150 hover:bg-soft-accent cursor-pointer"
                        >
                          <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-orange-100 font-serif text-[13px] font-semibold text-orange-800 dark:bg-orange-500/15 dark:text-orange-300" aria-hidden="true">
                            {initials(stats.lead.name)}
                          </span>
                          <span className="flex min-w-0 flex-col">
                            <span className="truncate text-[13px] font-semibold text-text-strong">{stats.lead.name}</span>
                            <span className="text-xs text-text-default">in {stats.lead.count} of {events.length} events</span>
                          </span>
                        </button>
                      )
                    }
                  />
                )}
                {stats.topTags.length > 0 && (
                  <BarList
                    title="Most-used tags"
                    rows={stats.topTags}
                    onPick={(tag) => applyFilter({ tags: [tag] })}
                    showColors
                  />
                )}
              </div>
            )}
          </div>

          <div className="flex shrink-0 flex-wrap items-center gap-2 border-t border-gray-200 bg-surface-raised px-5 sm:px-6 py-3 text-xs text-text-default">
            <Filter size={14} className="shrink-0 text-text-muted" aria-hidden="true" />
            <span className="min-w-0 flex-1">Click any bar, person or tag to filter the timeline</span>
            {stats.flaggedCount > 0 ? (
              <button
                type="button"
                onClick={openReview}
                className="-mr-2 inline-flex h-9 sm:h-7 items-center gap-1.5 rounded-lg px-2 font-semibold text-amber-800 hover:bg-amber-100 dark:text-amber-300 dark:hover:bg-amber-500/15 transition-colors duration-150 cursor-pointer"
              >
                <AlertTriangle size={13} aria-hidden="true" />
                {pluralize(stats.flaggedCount, 'date')} flagged
              </button>
            ) : (
              <span className="text-text-muted">{photoCount > 0 ? pluralize(photoCount, 'photo') : 'No photos yet'}</span>
            )}
          </div>
        </>
      )}
    </AnimatedModal>
  )
}
