import { useState, useRef } from 'react'
import { Upload } from 'lucide-react'
import Papa from 'papaparse'
import useTimelineStore from '@/store/useTimelineStore'
import { normalizeCSVEvent, normalizeJSONEvents } from '@/utils/importHelpers'

export default function FileImportContent({ onDone }) {
  const [error, setError] = useState(null)
  const [isDragging, setIsDragging] = useState(false)
  const fileRef = useRef(null)
  const events = useTimelineStore((s) => s.events)
  const appendEvents = useTimelineStore((s) => s.appendEvents)
  const setEvents = useTimelineStore((s) => s.setEvents)
  const showToast = useTimelineStore((s) => s.showToast)
  const hasExisting = events.length > 0

  const processFile = (file) => {
    setError(null)
    const ext = file.name.split('.').pop().toLowerCase()

    if (ext === 'json') {
      const reader = new FileReader()
      reader.onload = (ev) => {
        try {
          const data = JSON.parse(ev.target.result)
          const newEvents = normalizeJSONEvents(data)
          if (newEvents.length === 0) {
            setError('No valid events found in JSON')
            return
          }
          if (hasExisting) {
            appendEvents(newEvents)
          } else {
            setEvents(newEvents)
          }
          showToast(
            `Imported ${newEvents.length} event${newEvents.length !== 1 ? 's' : ''} from JSON`
          )
          onDone?.()
        } catch (err) {
          setError(`Invalid JSON: ${err.message}`)
        }
      }
      reader.readAsText(file)
    } else if (ext === 'csv') {
      Papa.parse(file, {
        header: true,
        skipEmptyLines: true,
        complete: (results) => {
          if (results.errors.length > 0) {
            setError(`CSV error: ${results.errors[0].message}`)
            return
          }
          const newEvents = results.data.map(normalizeCSVEvent).filter((e) => e.dateStart)
          if (newEvents.length === 0) {
            setError('No valid events found in CSV (need at least a dateStart column)')
            return
          }
          if (hasExisting) {
            appendEvents(newEvents)
          } else {
            setEvents(newEvents)
          }
          showToast(
            `Imported ${newEvents.length} event${newEvents.length !== 1 ? 's' : ''} from CSV`
          )
          onDone?.()
        },
        error: (err) => setError(`CSV error: ${err.message}`),
      })
    } else {
      setError('Unsupported file type. Please use .csv or .json')
    }
  }

  const handleDrop = (e) => {
    e.preventDefault()
    setIsDragging(false)
    const file = e.dataTransfer.files[0]
    if (file) processFile(file)
  }

  const handleChange = (e) => {
    const file = e.target.files?.[0]
    if (file) processFile(file)
    e.target.value = ''
  }

  return (
    <div>
      <div
        onDrop={handleDrop}
        onDragOver={(e) => {
          e.preventDefault()
          setIsDragging(true)
        }}
        onDragLeave={() => setIsDragging(false)}
        className={`flex flex-col items-center justify-center rounded-xl border-2 border-dashed px-4 py-10 text-center transition-all ${
          isDragging
            ? 'border-secondary bg-soft-accent/50'
            : 'border-gray-200 bg-gray-50 hover:bg-gray-100/50'
        }`}
      >
        <Upload size={28} className="text-gray-400 mb-3" />
        <p className="text-sm text-gray-600 font-medium mb-1">Drag & drop a CSV or JSON file</p>
        <p className="text-sm text-gray-500">
          or{' '}
          <label className="text-secondary cursor-pointer hover:underline">
            browse
            <input
              ref={fileRef}
              type="file"
              accept=".csv,.json"
              className="hidden"
              onChange={handleChange}
            />
          </label>
        </p>
        <div className="flex items-center gap-2 mt-4">
          <span className="text-[11px] text-gray-400 bg-gray-100 px-2 py-0.5 rounded-md font-mono">
            .csv
          </span>
          <span className="text-[11px] text-gray-400 bg-gray-100 px-2 py-0.5 rounded-md font-mono">
            .json
          </span>
        </div>
      </div>

      <p className="text-xs text-gray-400 mt-3">
        CSV should have columns: title, dateStart, description, people, tags. JSON should contain an
        events array.
      </p>

      {error && (
        <div className="rounded-lg bg-red-50 border border-red-200 px-4 py-3 text-sm text-error mt-4">
          {error}
        </div>
      )}
    </div>
  )
}
