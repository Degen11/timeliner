import { useState } from 'react'
import { Calendar, Check } from 'lucide-react'
import DatePicker from '@/components/shared/DatePicker'
import { formatDateForInput, formatEventDate, parseDatePhrase, safeGetUTCYear } from '@/utils/dateUtils'

const PRECISION_BADGE = { approximate: 'Approx.', decade: 'Decade' }

const keyOf = (v) => `${v.dateStart || ''}|${v.dateEnd || ''}|${v.datePrecision || ''}`

/**
 * One text field for an event's date: people type it the way they'd say it
 * ("summer 1994", "the 1990s", "about 1950", "3 May 1996 – 1998") and a live
 * line shows how it was read. The calendar stays one tap away. Writes
 * { dateStart, dateEnd, datePrecision } back through `onChange`; text that
 * can't be read clears dateStart so form validation catches it.
 */
export default function WhenField({ id, value, onChange, error, errorId, statusId }) {
  const [text, setText] = useState(() => formatDateForInput(value))
  // Re-seed the text when the value changes from outside (form reset, picker),
  // but not when it's echoing what this field just wrote
  const [seenKey, setSeenKey] = useState(keyOf(value))
  const [emittedKey, setEmittedKey] = useState(keyOf(value))
  const valueKey = keyOf(value)
  if (valueKey !== seenKey) {
    setSeenKey(valueKey)
    if (valueKey !== emittedKey) setText(formatDateForInput(value))
  }

  const emit = (next) => {
    setEmittedKey(keyOf(next))
    onChange(next)
  }

  const handleText = (t) => {
    setText(t)
    const parsed = parseDatePhrase(t)
    emit(
      parsed
        ? { dateStart: parsed.dateStart, dateEnd: parsed.dateEnd || '', datePrecision: parsed.datePrecision }
        : { dateStart: '', dateEnd: '', datePrecision: value.datePrecision || 'day' }
    )
  }

  const setExact = (next) => {
    setText(formatDateForInput(next))
    emit(next)
  }

  const parsed = text.trim() ? parseDatePhrase(text) : null
  const year = parsed ? safeGetUTCYear(parsed.dateStart, null) : null
  const alternative = !parsed
    ? null
    : parsed.datePrecision === 'approximate'
      ? { label: `Exactly ${year}`, value: { dateStart: `${year}-01-01`, dateEnd: '', datePrecision: 'year' } }
      : parsed.dateEnd || parsed.datePrecision === 'day' || parsed.datePrecision === 'month'
        ? { label: `Just ${year}`, value: { dateStart: `${year}-01-01`, dateEnd: '', datePrecision: 'year' } }
        : null

  return (
    <div className="space-y-2">
      <div
        className={`flex h-12 sm:h-11 items-center gap-2 rounded-[10px] border bg-surface pl-3.5 pr-1.5 transition-colors duration-150 focus-within:ring-2 ${
          error
            ? 'border-error focus-within:ring-error/20'
            : 'border-gray-200 focus-within:border-text-strong focus-within:ring-text-strong/10'
        }`}
      >
        <input
          id={id}
          type="text"
          value={text}
          onChange={(e) => handleText(e.target.value)}
          placeholder="e.g. June 1994, summer 1994, the 1990s"
          autoComplete="off"
          spellCheck={false}
          aria-required="true"
          aria-invalid={error ? true : undefined}
          aria-describedby={[error ? errorId : null, statusId].filter(Boolean).join(' ') || undefined}
          // The wrapper draws the focus ring; the global *:focus-visible outline would double it
          style={{ outline: 'none' }}
          className="min-w-0 flex-1 bg-transparent text-base text-text-strong placeholder:text-text-muted"
        />
        <DatePicker
          value={value.dateStart}
          precision={value.datePrecision === 'approximate' ? 'year' : value.datePrecision || 'day'}
          onChange={(dateStart, p) => setExact({ dateStart, dateEnd: '', datePrecision: p || value.datePrecision || 'day' })}
          renderTrigger={() => (
            <span
              aria-label="Pick on a calendar"
              className="flex h-9 w-9 sm:h-8 sm:w-8 items-center justify-center rounded-lg bg-soft-accent text-text-default hover:text-text-strong dark:bg-surface-raised transition-colors duration-150"
            >
              <Calendar size={15} aria-hidden="true" />
            </span>
          )}
        />
      </div>

      <div id={statusId} role="status" aria-live="polite">
        {parsed ? (
          <div className="flex flex-wrap items-center gap-x-2.5 gap-y-1 rounded-[10px] border border-gray-100 bg-surface-raised px-3 py-2">
            <Check size={14} strokeWidth={2.5} className="shrink-0 text-success" aria-hidden="true" />
            <span className="text-[13px] text-text-muted">Saved as</span>
            <span className="font-serif text-[15px] font-medium text-text-strong">
              {formatEventDate(parsed)}
            </span>
            {PRECISION_BADGE[parsed.datePrecision] && (
              <span className="text-[10px] font-semibold uppercase tracking-wider text-orange-700 dark:text-orange-400">
                {PRECISION_BADGE[parsed.datePrecision]}
              </span>
            )}
            {alternative && (
              <button
                type="button"
                onClick={() => setExact(alternative.value)}
                className="ml-auto text-[13px] text-text-default underline decoration-gray-300 underline-offset-[3px] hover:text-text-strong hover:decoration-text-strong cursor-pointer"
              >
                {alternative.label}
              </button>
            )}
          </div>
        ) : (
          <p className="text-xs text-text-muted">
            {text.trim() ? 'Can’t read that yet. ' : 'Type it the way you’d say it: '}
            <span className="text-text-default">June 1994</span>, <span className="text-text-default">the 1990s</span>,{' '}
            <span className="text-text-default">about 1950</span>, <span className="text-text-default">3 May 1996 – 1998</span>
          </p>
        )}
      </div>
    </div>
  )
}
