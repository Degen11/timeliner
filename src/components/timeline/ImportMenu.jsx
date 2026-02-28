import { useRef, useState, useEffect } from 'react'
import { Upload, Braces, Table, X } from 'lucide-react'
import Papa from 'papaparse'
import useTimelineStore from '@/store/useTimelineStore'
import { normalizeCSVEvent, normalizeJSONEvents } from '@/utils/importHelpers'

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
            ? 'rounded-md p-1.5 text-gray-500 hover:text-gray-900 hover:bg-white hover:shadow-sm transition-all cursor-pointer'
            : 'flex items-center gap-1.5 rounded-lg border border-gray-200 bg-white px-3 py-1.5 text-sm text-gray-700 hover:border-gray-300 hover:shadow-sm transition-all cursor-pointer'
        }
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
