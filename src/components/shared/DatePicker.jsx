import { useState, useRef, useEffect } from 'react'
import { createPortal } from 'react-dom'
import {
  startOfMonth,
  endOfMonth,
  startOfWeek,
  endOfWeek,
  eachDayOfInterval,
  addMonths,
  subMonths,
  addYears,
  subYears,
  getYear,
  getMonth,
  getDate,
  format,
  isSameDay,
  isSameMonth,
} from 'date-fns'
import { ChevronLeft, ChevronRight, Calendar } from 'lucide-react'
import { safeParseForDisplay } from '@/utils/dateUtils'

const WEEKDAYS = ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa']
const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']

function toISO(date, precision) {
  const y = getYear(date)
  const m = String(getMonth(date) + 1).padStart(2, '0')
  const d = String(getDate(date)).padStart(2, '0')
  if (precision === 'year' || precision === 'decade') return `${y}-01-01`
  if (precision === 'month') return `${y}-${m}-01`
  return `${y}-${m}-${d}`
}

export default function DatePicker({
  value,
  onChange,
  precision = 'day',
  error,
  placeholder = 'Pick a date',
  renderTrigger,
}) {
  const [open, setOpen] = useState(false)
  const [viewDate, setViewDate] = useState(() => safeParseForDisplay(value) ?? new Date())
  // zoomLevel: 'day' | 'month' | 'year' | 'decade'
  const [zoomLevel, setZoomLevel] = useState(precision === 'approximate' ? 'day' : precision)

  // Draft state: tracks what the user has selected during drill-down
  // before the picker closes. null means no pending selection.
  const [draftDate, setDraftDate] = useState(null)
  const [draftPrecision, setDraftPrecision] = useState(null)

  const triggerRef = useRef(null)
  const popoverRef = useRef(null)
  const [popoverPos, setPopoverPos] = useState({ top: 0, left: 0 })

  useEffect(() => {
    setZoomLevel(precision === 'approximate' ? 'day' : precision)
  }, [precision])

  // Update viewDate when value changes externally
  useEffect(() => {
    const d = safeParseForDisplay(value)
    if (d) setViewDate(d)
  }, [value])

  // Reset draft when picker opens
  useEffect(() => {
    if (open) {
      setDraftDate(null)
      setDraftPrecision(null)
      // Reset zoom to match current precision
      setZoomLevel(precision === 'approximate' ? 'day' : precision)
    }
  }, [open, precision])

  // Commit draft and close picker
  const commitAndClose = () => {
    if (draftDate && draftDate !== value) {
      onChange(draftDate, draftPrecision)
    }
    setDraftDate(null)
    setDraftPrecision(null)
    setOpen(false)
  }

  // Click outside to close (commits draft)
  useEffect(() => {
    if (!open) return
    const handle = (e) => {
      if (
        popoverRef.current &&
        !popoverRef.current.contains(e.target) &&
        triggerRef.current &&
        !triggerRef.current.contains(e.target)
      ) {
        if (draftDate && draftDate !== value) {
          onChange(draftDate, draftPrecision)
        }
        setDraftDate(null)
        setDraftPrecision(null)
        setOpen(false)
      }
    }
    document.addEventListener('mousedown', handle)
    return () => document.removeEventListener('mousedown', handle)
  }, [open, draftDate, draftPrecision, value, onChange])

  // Position the portal popover relative to the trigger (fixed positioning)
  useEffect(() => {
    if (!open || !triggerRef.current) return
    const updatePos = () => {
      const rect = triggerRef.current.getBoundingClientRect()
      const flipUp = rect.bottom + 320 > window.innerHeight
      setPopoverPos({
        top: flipUp ? rect.top - 6 : rect.bottom + 6,
        left: rect.left,
        flipUp,
      })
    }
    updatePos()
    window.addEventListener('scroll', updatePos, true)
    window.addEventListener('resize', updatePos)
    return () => {
      window.removeEventListener('scroll', updatePos, true)
      window.removeEventListener('resize', updatePos)
    }
  }, [open])

  const today = new Date()

  const handleSelect = (date) => {
    // Always drill down: decade -> year -> month -> day
    // Track draft at each level so closing commits partial selection
    if (zoomLevel === 'decade') {
      const decadeYear = Math.floor(getYear(date) / 10) * 10
      setDraftDate(toISO(new Date(decadeYear, 0, 1), 'decade'))
      setDraftPrecision('decade')
      setViewDate(date)
      setZoomLevel('year')
      return
    }
    if (zoomLevel === 'year') {
      setDraftDate(toISO(date, 'year'))
      setDraftPrecision('year')
      setViewDate(date)
      setZoomLevel('month')
      return
    }
    if (zoomLevel === 'month') {
      setDraftDate(toISO(date, 'month'))
      setDraftPrecision('month')
      setViewDate(date)
      setZoomLevel('day')
      return
    }
    // Day level: select the exact date and close
    onChange(toISO(date, 'day'), 'day')
    setDraftDate(null)
    setDraftPrecision(null)
    setOpen(false)
  }

  const handleKeyDown = (e) => {
    if (e.key === 'Escape') {
      commitAndClose()
      triggerRef.current?.focus()
    }
  }

  const handleToday = () => {
    const now = new Date()
    onChange(toISO(now, 'day'), 'day')
    setDraftDate(null)
    setDraftPrecision(null)
    setOpen(false)
  }

  const zoomOut = () => {
    if (zoomLevel === 'day') setZoomLevel('month')
    else if (zoomLevel === 'month') setZoomLevel('year')
    else if (zoomLevel === 'year') setZoomLevel('decade')
  }

  // Parse value for highlight
  const selectedDate = safeParseForDisplay(value)

  const displayValue = (() => {
    if (!value || !selectedDate) return null
    return format(selectedDate, 'MMM d, yyyy')
  })()

  // --- Day grid ---
  const dayGrid = (() => {
    const monthStart = startOfMonth(viewDate)
    const monthEnd = endOfMonth(viewDate)
    const start = startOfWeek(monthStart)
    const end = endOfWeek(monthEnd)
    return eachDayOfInterval({ start, end })
  })()

  // --- Year grid (decade) ---
  const decadeStart = Math.floor(getYear(viewDate) / 10) * 10

  const renderHeader = () => {
    let label = ''
    let onPrev, onNext
    if (zoomLevel === 'day') {
      label = format(viewDate, 'MMMM yyyy')
      onPrev = () => setViewDate(subMonths(viewDate, 1))
      onNext = () => setViewDate(addMonths(viewDate, 1))
    } else if (zoomLevel === 'month') {
      label = format(viewDate, 'yyyy')
      onPrev = () => setViewDate(subYears(viewDate, 1))
      onNext = () => setViewDate(addYears(viewDate, 1))
    } else if (zoomLevel === 'year') {
      label = `${decadeStart}\u2013${decadeStart + 9}`
      onPrev = () => setViewDate(subYears(viewDate, 10))
      onNext = () => setViewDate(addYears(viewDate, 10))
    } else {
      const centuryStart = Math.floor(getYear(viewDate) / 100) * 100
      label = `${centuryStart}\u2013${centuryStart + 99}`
      onPrev = () => setViewDate(subYears(viewDate, 100))
      onNext = () => setViewDate(addYears(viewDate, 100))
    }

    return (
      <div className="flex items-center justify-between mb-2">
        <button
          type="button"
          onClick={onPrev}
          className="rounded-lg p-1 text-text-muted hover:text-text-default hover:bg-surface-raised transition-colors cursor-pointer"
          aria-label="Previous"
        >
          <ChevronLeft size={16} />
        </button>
        <button
          type="button"
          onClick={zoomLevel !== 'decade' ? zoomOut : undefined}
          className={`text-sm font-medium text-text-default ${zoomLevel !== 'decade' ? 'hover:text-secondary cursor-pointer' : ''}`}
        >
          {label}
        </button>
        <button
          type="button"
          onClick={onNext}
          className="rounded-lg p-1 text-text-muted hover:text-text-default hover:bg-surface-raised transition-colors cursor-pointer"
          aria-label="Next"
        >
          <ChevronRight size={16} />
        </button>
      </div>
    )
  }

  const renderBody = () => {
    if (zoomLevel === 'day') {
      return (
        <>
          <div className="grid grid-cols-7 mb-1">
            {WEEKDAYS.map((d) => (
              <div key={d} className="text-center text-xs font-medium text-text-muted py-1">
                {d}
              </div>
            ))}
          </div>
          <div className="grid grid-cols-7">
            {dayGrid.map((day) => {
              const inMonth = isSameMonth(day, viewDate)
              const isToday = isSameDay(day, today)
              const isSelected = selectedDate && isSameDay(day, selectedDate)
              return (
                <button
                  key={day.toISOString()}
                  type="button"
                  onClick={() => handleSelect(day)}
                  className={`w-8 h-8 rounded-lg text-sm transition-colors cursor-pointer ${
                    isSelected
                      ? 'bg-secondary text-white font-medium'
                      : isToday
                        ? 'bg-secondary/10 text-secondary font-medium'
                        : inMonth
                          ? 'text-text-default hover:bg-surface-raised'
                          : 'text-gray-300 hover:bg-surface-raised'
                  }`}
                >
                  {getDate(day)}
                </button>
              )
            })}
          </div>
        </>
      )
    }

    if (zoomLevel === 'month') {
      return (
        <div className="grid grid-cols-4 gap-1">
          {MONTHS.map((m, i) => {
            const isSelected =
              selectedDate &&
              getMonth(selectedDate) === i &&
              getYear(selectedDate) === getYear(viewDate)
            return (
              <button
                key={m}
                type="button"
                onClick={() => {
                  const d = new Date(getYear(viewDate), i, 1)
                  handleSelect(d)
                }}
                className={`rounded-lg py-2 text-sm transition-colors cursor-pointer ${
                  isSelected
                    ? 'bg-secondary text-white font-medium'
                    : 'text-text-default hover:bg-surface-raised'
                }`}
              >
                {m}
              </button>
            )
          })}
        </div>
      )
    }

    if (zoomLevel === 'year') {
      const years = Array.from({ length: 10 }, (_, i) => decadeStart + i)
      return (
        <div className="grid grid-cols-4 gap-1">
          {years.map((y) => {
            const isSelected = selectedDate && getYear(selectedDate) === y
            return (
              <button
                key={y}
                type="button"
                onClick={() => {
                  const d = new Date(y, 0, 1)
                  handleSelect(d)
                }}
                className={`rounded-lg py-2 text-sm transition-colors cursor-pointer ${
                  isSelected
                    ? 'bg-secondary text-white font-medium'
                    : 'text-text-default hover:bg-surface-raised'
                }`}
              >
                {y}
              </button>
            )
          })}
        </div>
      )
    }

    // decade zoom (century view)
    const centuryStart = Math.floor(getYear(viewDate) / 100) * 100
    const decades = Array.from({ length: 10 }, (_, i) => centuryStart + i * 10)
    return (
      <div className="grid grid-cols-4 gap-1">
        {decades.map((d) => {
          const isSelected = selectedDate && Math.floor(getYear(selectedDate) / 10) * 10 === d
          return (
            <button
              key={d}
              type="button"
              onClick={() => {
                const date = new Date(d, 0, 1)
                handleSelect(date)
              }}
              className={`rounded-lg py-2 text-sm transition-colors cursor-pointer ${
                isSelected
                  ? 'bg-secondary text-white font-medium'
                  : 'text-text-default hover:bg-surface-raised'
              }`}
            >
              {d}s
            </button>
          )
        })}
      </div>
    )
  }

  const handleTriggerClick = () => {
    if (open) {
      commitAndClose()
    } else {
      setOpen(true)
    }
  }

  const trigger = renderTrigger ? (
    <span
      ref={triggerRef}
      role="button"
      tabIndex={0}
      onClick={handleTriggerClick}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault()
          handleTriggerClick()
        }
      }}
      className="cursor-pointer"
    >
      {renderTrigger({ open, displayValue })}
    </span>
  ) : (
    <button
      ref={triggerRef}
      type="button"
      onClick={handleTriggerClick}
      className={`w-full flex items-center gap-2 rounded-lg border border-gray-200 px-3 py-2 text-sm text-left transition-colors duration-150 cursor-pointer bg-canvas ${
        error
          ? 'border-error focus:border-error'
          : open
            ? 'border-secondary ring-2 ring-secondary/15'
            : 'hover:bg-surface-raised'
      }`}
    >
      <Calendar size={14} className="text-text-muted flex-shrink-0" />
      {displayValue ? (
        <span className="text-text-default">{displayValue}</span>
      ) : (
        <span className="text-text-muted">{placeholder}</span>
      )}
    </button>
  )

  return (
    <div className="relative">
      {trigger}

      {error && <p className="text-xs text-error mt-1">{error}</p>}

      {open &&
        createPortal(
          <div
            ref={popoverRef}
            onKeyDown={handleKeyDown}
            data-datepicker-popover
            className="fixed z-[100] rounded-xl border border-gray-200 bg-white shadow-lg p-3"
            style={{
              top: popoverPos.flipUp ? undefined : popoverPos.top,
              bottom: popoverPos.flipUp ? window.innerHeight - popoverPos.top : undefined,
              left: popoverPos.left,
              minWidth: 280,
            }}
          >
            {renderHeader()}
            {zoomLevel !== 'day' && (
              <p className="text-[11px] text-text-muted mb-2 text-center">
                {zoomLevel === 'decade' && 'Select a decade — or drill down for more precision'}
                {zoomLevel === 'year' && 'Select a year — or drill down to pick a month'}
                {zoomLevel === 'month' && 'Select a month — or drill down to pick a day'}
              </p>
            )}
            {renderBody()}
            <div className="mt-2 pt-2 border-t border-gray-200 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={handleToday}
                  className="text-xs font-medium text-secondary hover:text-secondary-hover transition-colors duration-150 cursor-pointer"
                >
                  Today
                </button>
                {draftPrecision && (
                  <span className="text-[10px] text-text-muted bg-surface-raised rounded px-1.5 py-0.5">
                    Precision: {draftPrecision}
                  </span>
                )}
              </div>
              {value && (
                <button
                  type="button"
                  onClick={() => {
                    setViewDate(new Date())
                    setZoomLevel('day')
                  }}
                  className="text-xs text-text-muted hover:text-text-default transition-colors duration-150 cursor-pointer"
                >
                  Go to current month
                </button>
              )}
            </div>
          </div>,
          document.body
        )}
    </div>
  )
}
