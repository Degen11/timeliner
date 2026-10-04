import { useEffect, useId, useRef, useState } from 'react'
import { ChevronDown } from 'lucide-react'
import { buildYearHistogram } from '@/store/selectors'
import { safeGetUTCYear } from '@/utils/dateUtils'
import { YEAR_HISTOGRAM_MAX_BINS, YEAR_RANGE_COMMIT_MS } from '@/utils/constants'
import DatePicker from '@/components/shared/DatePicker'

const clamp = (n, lo, hi) => Math.min(hi, Math.max(lo, n))

/**
 * Date-range filter: a year histogram of the timeline with a two-thumb slider
 * under it. Dragging a thumb filters to whole years; "Exact dates" reveals
 * day-precision pickers for the same dateFrom/dateTo filter fields.
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

  const handleReset = () => {
    clearTimeout(commitTimer.current)
    setDraft(null)
    onChange('dateFrom', '')
    onChange('dateTo', '')
  }

  const pct = (year) => (singleYear ? 0 : ((year - min) / (max - min)) * 100)
  const maxCount = Math.max(...bins.map((b) => b.count), 1)

  return (
    <div role="group" aria-labelledby={labelId} className={`space-y-2 ${className}`}>
      <div className="flex items-center justify-between">
        <span id={labelId} className="text-xs font-semibold text-text-default">
          When
        </span>
        {isActive && (
          <button
            type="button"
            onClick={handleReset}
            className="text-xs text-text-muted hover:text-text-default transition-colors duration-150 cursor-pointer"
          >
            Reset
          </button>
        )}
      </div>

      {!singleYear && (
        <>
          <div className="flex items-end gap-[3px] h-9 px-[9px] [@media(max-height:760px)]:hidden" aria-hidden="true">
            {bins.map((bin) => {
              const inRange = bin.to >= from && bin.from <= to
              return (
                <div
                  key={bin.from}
                  className={`flex-1 rounded-[3px] transition-colors duration-150 ${
                    bin.count === 0 ? 'bg-gray-100' : inRange ? 'bg-text-strong/55' : 'bg-gray-200'
                  }`}
                  style={{ height: bin.count === 0 ? 3 : `${Math.max(18, (bin.count / maxCount) * 100)}%` }}
                />
              )
            })}
          </div>

          <div className="dual-range relative h-5 mx-0">
            <div className="absolute left-[9px] right-[9px] top-1/2 -translate-y-1/2 h-0.5 rounded-full bg-gray-200" />
            <div
              className="absolute top-1/2 -translate-y-1/2 h-0.5 rounded-full bg-text-strong"
              style={{
                left: `calc(9px + (100% - 18px) * ${pct(from) / 100})`,
                right: `calc(9px + (100% - 18px) * ${1 - pct(to) / 100})`,
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

      <div className="flex items-center justify-between">
        <span className="font-serif text-[13px] tabular-nums text-text-default">
          {from}
          {!singleYear && <span className="text-text-muted"> – </span>}
          {!singleYear && to}
        </span>
        <button
          type="button"
          onClick={() => setShowExact((v) => !v)}
          aria-expanded={showExact}
          className="inline-flex items-center gap-1 text-xs text-text-muted hover:text-text-default transition-colors duration-150 cursor-pointer"
        >
          Exact dates
          <ChevronDown
            size={12}
            className={`transition-transform duration-150 ${showExact ? 'rotate-180' : ''}`}
            aria-hidden="true"
          />
        </button>
      </div>

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
