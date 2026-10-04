import { useEffect, useId, useRef, useState } from 'react'
import { ChevronDown } from 'lucide-react'
import { buildYearHistogram } from '@/store/selectors'
import { safeGetUTCYear } from '@/utils/dateUtils'
import { YEAR_HISTOGRAM_MAX_BINS, YEAR_RANGE_COMMIT_MS, DECADE_SHORTCUTS_MIN, DECADE_SHORTCUTS_MAX } from '@/utils/constants'
import DatePicker from '@/components/shared/DatePicker'

const clamp = (n, lo, hi) => Math.min(hi, Math.max(lo, n))

// A typed year. Uncontrolled and keyed by its value, so it re-seeds whenever
// the range changes elsewhere; commits on Enter or blur.
function YearInput({ value, label, onCommit }) {
  const commit = (e) => {
    const n = parseInt(e.currentTarget.value, 10)
    if (Number.isNaN(n)) e.currentTarget.value = String(value)
    else if (n !== value) onCommit(n)
  }
  return (
    <input
      key={value}
      type="text"
      inputMode="numeric"
      defaultValue={value}
      aria-label={label}
      // Draws its own focus ring; skip the global *:focus-visible outline
      style={{ outline: 'none' }}
      onBlur={commit}
      onKeyDown={(e) => {
        if (e.key === 'Enter') {
          e.preventDefault()
          commit(e)
        }
      }}
      className="h-9 sm:h-8 w-[3.75rem] min-w-0 rounded-lg border border-gray-200 bg-surface px-2 font-serif text-base sm:text-[15px] tabular-nums text-text-strong focus:border-text-strong focus:ring-2 focus:ring-text-strong/10 transition-colors duration-150"
    />
  )
}

/**
 * Date-range filter: a year histogram of the timeline (years kept dark, years
 * filtered out light) with a two-thumb slider under it, typed year fields and
 * decade shortcuts. Dragging a thumb filters to whole years; "Exact dates"
 * reveals day-precision pickers for the same dateFrom/dateTo filter fields.
 */
export default function YearRangeFilter({ events, dateFrom, dateTo, onChange, className = '' }) {
  const labelId = useId()
  const histogram = buildYearHistogram(events, YEAR_HISTOGRAM_MAX_BINS)
  const hasPreciseDate = (dateFrom?.length ?? 0) > 4 || (dateTo?.length ?? 0) > 4
  const [showExact, setShowExact] = useState(hasPreciseDate)
  const [draft, setDraft] = useState(null)
  const commitTimer = useRef(null)

  useEffect(() => () => clearTimeout(commitTimer.current), [])

  if (!histogram) return null
  const { min, max, bins } = histogram
  const singleYear = min === max

  const committedFrom = dateFrom ? clamp(safeGetUTCYear(dateFrom, min), min, max) : min
  const committedTo = dateTo ? clamp(safeGetUTCYear(dateTo, max), min, max) : max
  const from = draft?.from ?? committedFrom
  const to = draft?.to ?? committedTo
  const isActive = Boolean(dateFrom || dateTo)

  // Only the thumb that moved is written back, so an exact date set on the
  // other end isn't rounded down to its year.
  const scheduleCommit = (side, year) => {
    clearTimeout(commitTimer.current)
    commitTimer.current = setTimeout(() => {
      if (side === 'from') onChange('dateFrom', year > min ? String(year) : '')
      else onChange('dateTo', year < max ? String(year) : '')
      setDraft(null)
    }, YEAR_RANGE_COMMIT_MS)
  }

  const handleFrom = (e) => {
    const year = Math.min(Number(e.target.value), to)
    setDraft({ from: year, to })
    scheduleCommit('from', year)
  }

  const handleTo = (e) => {
    const year = Math.max(Number(e.target.value), from)
    setDraft({ from, to: year })
    scheduleCommit('to', year)
  }

  // Typed years and decade shortcuts write both ends straight away
  const setRange = (fromYear, toYear) => {
    clearTimeout(commitTimer.current)
    setDraft(null)
    const f = clamp(Math.min(fromYear, toYear), min, max)
    const t = clamp(Math.max(fromYear, toYear), min, max)
    onChange('dateFrom', f > min ? String(f) : '')
    onChange('dateTo', t < max ? String(t) : '')
  }

  const handleReset = () => {
    clearTimeout(commitTimer.current)
    setDraft(null)
    onChange('dateFrom', '')
    onChange('dateTo', '')
  }

  const pct = (year) => (singleYear ? 0 : ((year - min) / (max - min)) * 100)
  const maxCount = Math.max(...bins.map((b) => b.count), 1)
  const narrowed = from > min || to < max
  const inRangeCount = bins.reduce((n, b) => (b.to >= from && b.from <= to ? n + b.count : n), 0)

  // Decade shortcuts, only when the timeline spans a handful of them
  const decades = []
  for (let d = Math.floor(min / 10) * 10; d <= max; d += 10) {
    const count = bins.reduce((n, b) => (b.from >= d && b.from <= d + 9 ? n + b.count : n), 0)
    if (count > 0) decades.push({ start: d, count })
  }
  const showDecades = decades.length >= DECADE_SHORTCUTS_MIN && decades.length <= DECADE_SHORTCUTS_MAX

  return (
    <div role="group" aria-labelledby={labelId} className={`space-y-2 ${className}`}>
      <div className="flex items-center justify-between">
        <span id={labelId} className="text-xs font-semibold text-text-default">
          When
        </span>
        <span className="flex items-center gap-2.5 text-xs text-text-muted">
          {narrowed && (
            <span role="status" aria-live="polite" className="tabular-nums">
              {inRangeCount} of {events.length} events
            </span>
          )}
          {isActive && (
            <button
              type="button"
              onClick={handleReset}
              className="hover:text-text-default transition-colors duration-150 cursor-pointer"
            >
              Reset
            </button>
          )}
        </span>
      </div>

      {!singleYear && (
        <>
          {/* Years you keep are dark, years filtered out stay light */}
          <div className="flex items-end gap-[2px] h-10 px-[5px] [@media(max-height:760px)]:hidden" aria-hidden="true">
            {bins.map((bin) => {
              const inRange = bin.to >= from && bin.from <= to
              const tone = bin.count === 0
                ? inRange && narrowed ? 'bg-gray-300' : 'bg-gray-200'
                : !narrowed ? 'bg-gray-400' : inRange ? 'bg-text-strong' : 'bg-gray-200'
              return (
                <div
                  key={bin.from}
                  className={`flex-1 rounded-t-[2px] transition-colors duration-150 ${tone}`}
                  style={{ height: bin.count === 0 ? 2 : `${Math.max(18, (bin.count / maxCount) * 100)}%` }}
                />
              )
            })}
          </div>

          <div className="dual-range relative h-5 mx-0">
            <div className="absolute left-[5px] right-[5px] top-1/2 -translate-y-1/2 h-0.5 rounded-full bg-gray-200" />
            <div
              className="absolute top-1/2 -translate-y-1/2 h-0.5 rounded-full bg-text-strong"
              style={{
                left: `calc(5px + (100% - 10px) * ${pct(from) / 100})`,
                right: `calc(5px + (100% - 10px) * ${1 - pct(to) / 100})`,
              }}
            />
            <input
              type="range"
              min={min}
              max={max}
              step={1}
              value={from}
              onChange={handleFrom}
              aria-label="Start year"
              aria-valuetext={String(from)}
              // Lift the start thumb above the end thumb once they meet near the top end
              style={{ zIndex: from > max - (max - min) / 10 ? 2 : 1 }}
            />
            <input
              type="range"
              min={min}
              max={max}
              step={1}
              value={to}
              onChange={handleTo}
              aria-label="End year"
              aria-valuetext={String(to)}
              style={{ zIndex: 1 }}
            />
          </div>
        </>
      )}

      <div className="flex items-center justify-between gap-2">
        {singleYear ? (
          <span className="font-serif text-[13px] tabular-nums text-text-default">{from}</span>
        ) : (
          <span className="flex items-center gap-1.5">
            <YearInput value={from} label="From year" onCommit={(y) => setRange(y, to)} />
            <span className="text-xs text-text-muted" aria-hidden="true">–</span>
            <YearInput value={to} label="To year" onCommit={(y) => setRange(from, y)} />
          </span>
        )}
        <button
          type="button"
          onClick={() => setShowExact((v) => !v)}
          aria-expanded={showExact}
          className="inline-flex shrink-0 items-center gap-1 whitespace-nowrap text-xs text-text-muted hover:text-text-default transition-colors duration-150 cursor-pointer"
        >
          Exact dates
          <ChevronDown
            size={12}
            className={`transition-transform duration-150 ${showExact ? 'rotate-180' : ''}`}
            aria-hidden="true"
          />
        </button>
      </div>

      {showDecades && (
        <div className="flex flex-wrap gap-1 [@media(max-height:820px)]:hidden" role="group" aria-label="Jump to a decade">
          {decades.map(({ start, count }) => {
            const active = from === Math.max(start, min) && to === Math.min(start + 9, max)
            return (
              <button
                key={start}
                type="button"
                onClick={() => (active ? handleReset() : setRange(start, start + 9))}
                aria-pressed={active}
                className={`inline-flex h-7 items-center gap-1 rounded-full border px-2 text-xs tabular-nums transition-colors duration-150 cursor-pointer ${
                  active
                    ? 'border-text-strong bg-text-strong text-canvas'
                    : 'border-gray-200 bg-surface text-text-default hover:border-gray-300 hover:text-text-strong'
                }`}
              >
                {start}s
                <span className={active ? 'text-canvas/70' : 'text-text-muted'}>{count}</span>
              </button>
            )
          })}
        </div>
      )}

      {showExact && (
        <div className="flex items-center gap-1.5">
          <div className="flex-1 min-w-0">
            <DatePicker
              value={dateFrom}
              onChange={(v) => onChange('dateFrom', v || '')}
              precision="day"
              placeholder="From"
            />
          </div>
          <span className="shrink-0 text-xs text-text-muted" aria-hidden="true">–</span>
          <div className="flex-1 min-w-0">
            <DatePicker
              value={dateTo}
              onChange={(v) => onChange('dateTo', v || '')}
              precision="day"
              placeholder="To"
            />
          </div>
        </div>
      )}
    </div>
  )
}
