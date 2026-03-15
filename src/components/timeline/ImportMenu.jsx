import { useRef, useState } from 'react'
import { Upload, Braces, Table, X } from 'lucide-react'
import Papa from 'papaparse'
import useTimelineStore from '@/store/useTimelineStore'
import { normalizeCSVEvent, normalizeJSONEvents } from '@/utils/importHelpers'
import { pluralize } from '@/utils/ui'
import { DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuItem } from '@/components/ui/DropdownMenu'

export default function ImportMenu({ compact = false, inline = false }) {
  const [error, setError] = useState(null)
  const jsonRef = useRef(null)
  const csvRef = useRef(null)
  const appendEvents = useTimelineStore((s) => s.appendEvents)
  const setEvents = useTimelineStore((s) => s.setEvents)
  const events = useTimelineStore((s) => s.events)
  const showToast = useTimelineStore((s) => s.showToast)

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
      },
      error: (err) => {
        setError(`CSV error: ${err.message}`)
      },
    })
    e.target.value = ''
  }

  // Inline mode: render import items for embedding in another DropdownMenu
  if (inline) {
    return (
      <>
        {error && (
          <div className="flex items-start gap-1.5 px-3 py-2 text-xs text-error">
            <X size={12} className="mt-0.5 flex-shrink-0" />
            <span>{error}</span>
          </div>
        )}
        <DropdownMenuItem onSelect={(e) => { e.preventDefault(); jsonRef.current?.click() }}>
          <Braces size={14} className="text-text-muted shrink-0" />
          Import JSON
        </DropdownMenuItem>
        <DropdownMenuItem onSelect={(e) => { e.preventDefault(); csvRef.current?.click() }}>
          <Table size={14} className="text-text-muted shrink-0" />
          Import CSV
        </DropdownMenuItem>
        <input ref={jsonRef} type="file" accept=".json,application/json" onChange={handleJSONImport} className="hidden" />
        <input ref={csvRef} type="file" accept=".csv,text/csv" onChange={handleCSVImport} className="hidden" />
      </>
    )
  }

  return (
    <DropdownMenu onOpenChange={(open) => { if (open) setError(null) }}>
      <DropdownMenuTrigger asChild>
        <button
          className={
            compact
              ? 'rounded-lg p-1.5 text-text-muted hover:text-text-default hover:bg-surface-raised transition-colors duration-150 cursor-pointer'
              : 'flex items-center gap-1.5 rounded-lg border border-gray-200 bg-white px-3 py-1.5 text-sm text-text-default hover:bg-surface-raised transition-colors duration-150 cursor-pointer'
          }
        >
          <Upload size={14} />
          {!compact && 'Import'}
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="min-w-[220px]">
        {error && (
          <div className="flex items-start gap-1.5 px-3 py-2 text-xs text-error">
            <X size={12} className="mt-0.5 flex-shrink-0" />
            <span>{error}</span>
          </div>
        )}
        <DropdownMenuItem onSelect={() => jsonRef.current?.click()}>
          <Braces size={14} className="text-text-muted" />
          Import JSON
        </DropdownMenuItem>
        <DropdownMenuItem onSelect={() => csvRef.current?.click()}>
          <Table size={14} className="text-text-muted" />
          Import CSV
        </DropdownMenuItem>
        <input ref={jsonRef} type="file" accept=".json,application/json" onChange={handleJSONImport} className="hidden" />
        <input ref={csvRef} type="file" accept=".csv,text/csv" onChange={handleCSVImport} className="hidden" />
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
