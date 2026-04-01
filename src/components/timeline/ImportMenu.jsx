import { useRef, useState } from 'react'
import { Upload, Braces, Table, Calendar, FileText, X } from 'lucide-react'
import Papa from 'papaparse'
import useTimelineStore from '@/store/useTimelineStore'
import { normalizeCSVEvent, normalizeJSONEvents, normalizeICSEvents, normalizeMarkdownEvents } from '@/utils/importHelpers'
import useImportWorker from '@/hooks/useImportWorker'
import { pluralize } from '@/utils/ui'
import { DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuItem } from '@/components/ui/DropdownMenu'

const WORKER_THRESHOLD = 50_000 // Use worker for files > 50KB

export default function ImportMenu({ compact = false, inline = false }) {
  const [error, setError] = useState(null)
  const jsonRef = useRef(null)
  const csvRef = useRef(null)
  const icsRef = useRef(null)
  const mdRef = useRef(null)
  const { parseInWorker } = useImportWorker()
  const appendEvents = useTimelineStore((s) => s.appendEvents)
  const setEvents = useTimelineStore((s) => s.setEvents)
  const events = useTimelineStore((s) => s.events)
  const showToast = useTimelineStore((s) => s.showToast)

  const handleJSONImport = (e) => {
    handleFileImport(e, (text) => {
      const data = JSON.parse(text)
      return normalizeJSONEvents(data)
    }, 'JSON', 'json')
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

  const handleFileImport = (e, parser, label, workerType) => {
    const file = e.target.files?.[0]
    if (!file) return
    setError(null)

    const reader = new FileReader()
    reader.onload = async (ev) => {
      try {
        const content = ev.target.result
        let newEvents

        // Use web worker for large files
        if (workerType && content.length > WORKER_THRESHOLD) {
          try {
            newEvents = await parseInWorker(workerType, content)
          } catch {
            // Fall back to main thread
            newEvents = parser(content)
          }
        } else {
          newEvents = parser(content)
        }

        if (newEvents.length === 0) {
          setError(`No valid events found in ${label} file`)
          return
        }
        if (events.length > 0) {
          appendEvents(newEvents)
        } else {
          setEvents(newEvents)
        }
        showToast(`Imported ${pluralize(newEvents.length, 'event')} from ${label}`)
      } catch (err) {
        setError(`${label} error: ${err.message}`)
      }
    }
    reader.readAsText(file)
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
        <DropdownMenuItem onSelect={(e) => { e.preventDefault(); icsRef.current?.click() }}>
          <Calendar size={14} className="text-text-muted shrink-0" />
          Import Calendar (.ics)
        </DropdownMenuItem>
        <DropdownMenuItem onSelect={(e) => { e.preventDefault(); mdRef.current?.click() }}>
          <FileText size={14} className="text-text-muted shrink-0" />
          Import Markdown
        </DropdownMenuItem>
        <input ref={jsonRef} type="file" accept=".json,application/json" onChange={handleJSONImport} className="hidden" />
        <input ref={csvRef} type="file" accept=".csv,text/csv" onChange={handleCSVImport} className="hidden" />
        <input ref={icsRef} type="file" accept=".ics,.ical,text/calendar" onChange={(e) => handleFileImport(e, normalizeICSEvents, 'Calendar', 'ics')} className="hidden" />
        <input ref={mdRef} type="file" accept=".md,.markdown,text/markdown" onChange={(e) => handleFileImport(e, normalizeMarkdownEvents, 'Markdown', 'markdown')} className="hidden" />
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
        <DropdownMenuItem onSelect={() => icsRef.current?.click()}>
          <Calendar size={14} className="text-text-muted" />
          Import Calendar (.ics)
        </DropdownMenuItem>
        <DropdownMenuItem onSelect={() => mdRef.current?.click()}>
          <FileText size={14} className="text-text-muted" />
          Import Markdown
        </DropdownMenuItem>
        <input ref={jsonRef} type="file" accept=".json,application/json" onChange={handleJSONImport} className="hidden" />
        <input ref={csvRef} type="file" accept=".csv,text/csv" onChange={handleCSVImport} className="hidden" />
        <input ref={icsRef} type="file" accept=".ics,.ical,text/calendar" onChange={(e) => handleFileImport(e, normalizeICSEvents, 'Calendar', 'ics')} className="hidden" />
        <input ref={mdRef} type="file" accept=".md,.markdown,text/markdown" onChange={(e) => handleFileImport(e, normalizeMarkdownEvents, 'Markdown', 'markdown')} className="hidden" />
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
