import { useRef, useState, useEffect } from 'react'
import { Upload, Braces, Table, X } from 'lucide-react'
import Papa from 'papaparse'
import useTimelineStore from '@/store/useTimelineStore'
import { isValidISODate } from '@/utils/dateUtils'

function generateId() {
  return 'evt_' + Math.random().toString(36).slice(2, 9)
}

function normalizeCSVEvent(row) {
  const rawDate = row.dateStart || row.date || null
  const dateInvalid = rawDate && !isValidISODate(rawDate)
  return {
    id: generateId(),
    title: row.title || 'Untitled',
    description: row.description || null,
    dateStart: dateInvalid ? null : rawDate,
    dateEnd: row.dateEnd || null,
    dateRaw: row.dateRaw || row.dateStart || row.date || '',
    datePrecision: row.datePrecision || 'day',
    flagged: dateInvalid || row.flagged === 'Yes' || row.flagged === 'true' || row.flagged === true,
    flagReason: dateInvalid ? `Invalid date format: "${rawDate}"` : (row.flagReason || null),
    people: typeof row.people === 'string'
      ? row.people.split(';').map((s) => s.trim()).filter(Boolean)
      : [],
    tags: typeof row.tags === 'string'
      ? row.tags.split(';').map((s) => s.trim()).filter(Boolean)
      : [],
    photos: [],
  }
}

function normalizeJSONEvents(data) {
  const events = data.events || data
  if (!Array.isArray(events)) return []
  return events.map((e) => {
    const rawDate = e.dateStart || e.date || null
    const dateInvalid = rawDate && !isValidISODate(rawDate)
    return {
      id: e.id || generateId(),
      title: e.title || 'Untitled',
      description: e.description || null,
      dateStart: dateInvalid ? null : rawDate,
      dateEnd: e.dateEnd || null,
      dateRaw: e.dateRaw || e.dateStart || '',
      datePrecision: e.datePrecision || 'day',
      flagged: dateInvalid || e.flagged || false,
      flagReason: dateInvalid ? `Invalid date format: "${rawDate}"` : (e.flagReason || null),
      people: Array.isArray(e.people) ? e.people : [],
      tags: Array.isArray(e.tags) ? e.tags : [],
      photos: Array.isArray(e.photos) ? e.photos : [],
    }
  })
}

export default function ImportMenu({ compact = false }) {
  const [isOpen, setIsOpen] = useState(false)
  const [error, setError] = useState(null)
  const jsonRef = useRef(null)
  const csvRef = useRef(null)
  const menuRef = useRef(null)
  const appendEvents = useTimelineStore((s) => s.appendEvents)
  const setEvents = useTimelineStore((s) => s.setEvents)
  const events = useTimelineStore((s) => s.events)
  const showToast = useTimelineStore((s) => s.showToast)

  useEffect(() => {
    function handleClick(e) {
      if (menuRef.current && !menuRef.current.contains(e.target)) {
        setIsOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [])

  const handleJSONImport = (e) => {
    const file = e.target.files?.[0]
    if (!file) return
    setError(null)

    const reader = new FileReader()
    reader.onload = (ev) => {
      try {
        const data = JSON.parse(ev.target.result)
        const newEvents = normalizeJSONEvents(data)
        if (newEvents.length === 0) {
          setError('No valid events found in JSON')
          return
        }
        if (events.length > 0) {
          appendEvents(newEvents)
        } else {
          setEvents(newEvents)
        }
        showToast(`Imported ${newEvents.length} event${newEvents.length !== 1 ? 's' : ''} from JSON`)
        setIsOpen(false)
      } catch (err) {
        setError(`Invalid JSON: ${err.message}`)
      }
    }
    reader.readAsText(file)
    e.target.value = ''
  }

  const handleCSVImport = (e) => {
    const file = e.target.files?.[0]
    if (!file) return
    setError(null)

    Papa.parse(file, {
      header: true,
      skipEmptyLines: true,
      complete: (results) => {
        if (results.errors.length > 0) {
          setError(`CSV parse error: ${results.errors[0].message}`)
          return
        }
        const newEvents = results.data.map(normalizeCSVEvent).filter((e) => e.dateStart)
        if (newEvents.length === 0) {
          setError('No valid events found in CSV (need at least a dateStart column)')
          return
        }
        if (events.length > 0) {
          appendEvents(newEvents)
        } else {
          setEvents(newEvents)
        }
        showToast(`Imported ${newEvents.length} event${newEvents.length !== 1 ? 's' : ''} from CSV`)
        setIsOpen(false)
      },
      error: (err) => {
        setError(`CSV error: ${err.message}`)
      },
    })
    e.target.value = ''
  }

  return (
    <div ref={menuRef} className="relative">
      <button
        onClick={() => { setIsOpen(!isOpen); setError(null) }}
        className={
          compact
            ? 'rounded-lg p-1.5 text-gray-400 hover:text-gray-700 hover:bg-gray-100 transition-colors cursor-pointer'
            : 'flex items-center gap-1.5 rounded-lg border border-gray-200 bg-white px-3 py-1.5 text-sm text-gray-700 hover:border-gray-300 hover:shadow-sm transition-all cursor-pointer'
        }
        title="Import timeline data"
      >
        <Upload size={compact ? 15 : 14} />
        {!compact && 'Import'}
      </button>

      {isOpen && (
        <div className="absolute top-full right-0 z-20 mt-1.5 min-w-[220px] rounded-xl border border-gray-200 bg-white py-1.5 shadow-lg">
          {error && (
            <div className="flex items-start gap-1.5 px-3 py-2 text-xs text-error">
              <X size={12} className="mt-0.5 flex-shrink-0" />
              <span>{error}</span>
            </div>
          )}
          <button
            onClick={() => jsonRef.current?.click()}
            className="flex w-full items-center gap-2 px-3 py-2 text-sm text-gray-700 hover:bg-gray-50 transition-colors cursor-pointer"
          >
            <Braces size={14} className="text-gray-400" />
            Import JSON
          </button>
          <button
            onClick={() => csvRef.current?.click()}
            className="flex w-full items-center gap-2 px-3 py-2 text-sm text-gray-700 hover:bg-gray-50 transition-colors cursor-pointer"
          >
            <Table size={14} className="text-gray-400" />
            Import CSV
          </button>

          <input
            ref={jsonRef}
            type="file"
            accept=".json,application/json"
            onChange={handleJSONImport}
            className="hidden"
          />
          <input
            ref={csvRef}
            type="file"
            accept=".csv,text/csv"
            onChange={handleCSVImport}
            className="hidden"
          />
        </div>
      )}
    </div>
  )
}
