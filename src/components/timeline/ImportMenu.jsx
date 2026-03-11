import { useRef, useState, useCallback } from 'react'
import { Upload, Braces, Table, X } from 'lucide-react'
import Papa from 'papaparse'
import useTimelineStore from '@/store/useTimelineStore'
import { normalizeCSVEvent, normalizeJSONEvents } from '@/utils/importHelpers'
import { dropdownCls, pluralize } from '@/utils/ui'
import useClickOutside from '@/hooks/useClickOutside'

export default function ImportMenu({ compact = false, inline = false }) {
  const [isOpen, setIsOpen] = useState(false)
  const [error, setError] = useState(null)
  const jsonRef = useRef(null)
  const csvRef = useRef(null)
  const menuRef = useRef(null)
  const appendEvents = useTimelineStore((s) => s.appendEvents)
  const setEvents = useTimelineStore((s) => s.setEvents)
  const events = useTimelineStore((s) => s.events)
  const showToast = useTimelineStore((s) => s.showToast)
  const closeMenu = useCallback(() => setIsOpen(false), [])
  useClickOutside(menuRef, closeMenu)

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
        showToast(
          `Imported ${pluralize(newEvents.length, 'event')} from JSON`
        )
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
        showToast(`Imported ${pluralize(newEvents.length, 'event')} from CSV`)
        setIsOpen(false)
      },
      error: (err) => {
        setError(`CSV error: ${err.message}`)
      },
    })
    e.target.value = ''
  }

  // Inline mode: render import buttons directly (for embedding in another dropdown)
  if (inline) {
    return (
      <>
        {error && (
          <div className="flex items-start gap-1.5 px-3 py-2 text-xs text-error">
            <X size={12} className="mt-0.5 flex-shrink-0" />
            <span>{error}</span>
          </div>
        )}
        <button
          onClick={() => jsonRef.current?.click()}
          className="w-full text-left px-3 py-2 text-sm font-medium transition-colors duration-150 cursor-pointer flex items-center gap-2.5 text-text-default hover:bg-surface-raised"
        >
          <Braces size={14} className="text-text-muted shrink-0" />
          <span className="flex-1">Import JSON</span>
        </button>
        <button
          onClick={() => csvRef.current?.click()}
          className="w-full text-left px-3 py-2 text-sm font-medium transition-colors duration-150 cursor-pointer flex items-center gap-2.5 text-text-default hover:bg-surface-raised"
        >
          <Table size={14} className="text-text-muted shrink-0" />
          <span className="flex-1">Import CSV</span>
        </button>
        <input ref={jsonRef} type="file" accept=".json,application/json" onChange={handleJSONImport} className="hidden" />
        <input ref={csvRef} type="file" accept=".csv,text/csv" onChange={handleCSVImport} className="hidden" />
      </>
    )
  }

  return (
    <div ref={menuRef} className="relative">
      <button
        onClick={() => {
          setIsOpen(!isOpen)
          setError(null)
        }}
        className={
          compact
            ? 'rounded-lg p-1.5 text-text-muted hover:text-text-default hover:bg-surface-raised transition-colors duration-150 cursor-pointer'
            : 'flex items-center gap-1.5 rounded-lg border border-gray-200 bg-white px-3 py-1.5 text-sm text-text-default hover:bg-surface-raised transition-colors duration-150 cursor-pointer'
        }
      >
        <Upload size={14} />
        {!compact && 'Import'}
      </button>

      {isOpen && (
        <div className={`${dropdownCls} top-full right-0 min-w-[220px]`}>
          {error && (
            <div className="flex items-start gap-1.5 px-3 py-2 text-xs text-error">
              <X size={12} className="mt-0.5 flex-shrink-0" />
              <span>{error}</span>
            </div>
          )}
          <button
            onClick={() => jsonRef.current?.click()}
            className="flex w-full items-center gap-2 px-3 py-2 text-sm text-text-default hover:bg-surface-raised transition-colors duration-150 cursor-pointer"
          >
            <Braces size={14} className="text-text-muted" />
            Import JSON
          </button>
          <button
            onClick={() => csvRef.current?.click()}
            className="flex w-full items-center gap-2 px-3 py-2 text-sm text-text-default hover:bg-surface-raised transition-colors duration-150 cursor-pointer"
          >
            <Table size={14} className="text-text-muted" />
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
