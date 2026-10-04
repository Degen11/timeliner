import { useRef, useState } from 'react'
import Papa from 'papaparse'
import useTimelineStore from '@/store/useTimelineStore'
import { normalizeCSVEvent, normalizeJSONEvents, normalizeICSEvents, normalizeMarkdownEvents } from '@/utils/importHelpers'
import useImportWorker from '@/hooks/useImportWorker'
import { pluralize } from '@/utils/ui'

const WORKER_THRESHOLD = 50_000 // Use worker for files > 50KB

/**
 * File import (JSON, CSV, Calendar, Markdown) shared by the toolbar menu and
 * the import modal's Upload tab. `pick(kind)` opens the file chooser; render
 * `inputs` somewhere in the tree for the hidden file inputs.
 */
export default function useFileImport({ onImported } = {}) {
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

  const commit = (newEvents, label) => {
    if (events.length > 0) {
      appendEvents(newEvents)
    } else {
      setEvents(newEvents)
    }
    showToast(`Imported ${pluralize(newEvents.length, 'event')} from ${label}`, { variant: 'success' })
    onImported?.(newEvents.length)
  }

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
        commit(newEvents, 'CSV')
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
        commit(newEvents, label)
      } catch (err) {
        setError(`${label} error: ${err.message}`)
      }
    }
    reader.readAsText(file)
    e.target.value = ''
  }

  const refs = { json: jsonRef, csv: csvRef, ics: icsRef, markdown: mdRef }
  const pick = (kind) => refs[kind].current?.click()

  const inputs = (
    <>
      <input ref={jsonRef} type="file" accept=".json,application/json" onChange={handleJSONImport} className="hidden" />
      <input ref={csvRef} type="file" accept=".csv,text/csv" onChange={handleCSVImport} className="hidden" />
      <input ref={icsRef} type="file" accept=".ics,.ical,text/calendar" onChange={(e) => handleFileImport(e, normalizeICSEvents, 'Calendar', 'ics')} className="hidden" />
      <input ref={mdRef} type="file" accept=".md,.markdown,text/markdown" onChange={(e) => handleFileImport(e, normalizeMarkdownEvents, 'Markdown', 'markdown')} className="hidden" />
    </>
  )

  return { error, setError, pick, inputs }
}
