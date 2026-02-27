import { useRef, useState, useEffect } from 'react'
import { Upload, FileJson, FileSpreadsheet, X } from 'lucide-react'
import Papa from 'papaparse'
import useTimelineStore from '@/store/useTimelineStore'

function generateId() {
  return 'evt_' + Math.random().toString(36).slice(2, 9)
}

function normalizeCSVEvent(row) {
  return {
    id: generateId(),
    title: row.title || 'Untitled',
    description: row.description || null,
    dateStart: row.dateStart || row.date || null,
    dateEnd: row.dateEnd || null,
    dateRaw: row.dateRaw || row.dateStart || row.date || '',
    datePrecision: row.datePrecision || 'day',
    flagged: row.flagged === 'Yes' || row.flagged === 'true' || row.flagged === true,
    flagReason: row.flagReason || null,
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
  return events.map((e) => ({
    id: e.id || generateId(),
    title: e.title || 'Untitled',
    description: e.description || null,
    dateStart: e.dateStart || e.date || null,
    dateEnd: e.dateEnd || null,
    dateRaw: e.dateRaw || e.dateStart || '',
    datePrecision: e.datePrecision || 'day',
    flagged: e.flagged || false,
    flagReason: e.flagReason || null,
    people: Array.isArray(e.people) ? e.people : [],
    tags: Array.isArray(e.tags) ? e.tags : [],
    photos: Array.isArray(e.photos) ? e.photos : [],
  }))
}

export default function ImportMenu() {
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
        className="flex items-center gap-1.5 rounded-lg border border-gray-200 bg-white px-3 py-1.5 text-sm text-gray-700 hover:border-gray-300 hover:shadow-sm transition-all cursor-pointer"
        title="Import timeline data"
      >
        <Upload size={14} />
        Import
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
            <FileJson size={14} className="text-gray-400" />
            Import JSON
          </button>
          <button
            onClick={() => csvRef.current?.click()}
            className="flex w-full items-center gap-2 px-3 py-2 text-sm text-gray-700 hover:bg-gray-50 transition-colors cursor-pointer"
          >
            <FileSpreadsheet size={14} className="text-gray-400" />
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
