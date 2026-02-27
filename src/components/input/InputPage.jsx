import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Sparkles, FileText } from 'lucide-react'
import TextInput from './TextInput'
import PhotoUpload from './PhotoUpload'
import Button from '@/components/shared/Button'
import useTimelineStore from '@/store/useTimelineStore'

export default function InputPage() {
  const [text, setText] = useState('')
  const [photos, setPhotos] = useState([])
  const navigate = useNavigate()

  const {
    events,
    setEvents,
    setPhotos: storePhotos,
    isParsing,
    setIsParsing,
    parseError,
    setParseError,
  } = useTimelineStore()

  const canSubmit = text.trim().length > 0 && !isParsing

  const handleSubmit = async () => {
    if (!canSubmit) return

    setIsParsing(true)
    setParseError(null)

    try {
      const photoFilenames = photos.map((p) => p.name)

      const res = await fetch('/api/parse', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text, photoFilenames }),
      })

      if (!res.ok) {
        throw new Error(`Parsing failed (${res.status})`)
      }

      const data = await res.json()
      setEvents(data.events || [])
      storePhotos(photos)
      navigate('/timeline')
    } catch (err) {
      setParseError(err.message)
    } finally {
      setIsParsing(false)
    }
  }

  return (
    <div className="max-w-2xl mx-auto">
      <div className="mb-8">
        <h1 className="text-2xl font-semibold text-gray-900 mb-2">
          Create a timeline
        </h1>
        <p className="text-sm text-gray-500">
          Paste journal entries, family history, research notes, or any text with dates.
          We'll extract the events and build a structured timeline.
        </p>
      </div>

      <div className="flex flex-col gap-6">
        <TextInput value={text} onChange={setText} />
        <PhotoUpload photos={photos} onPhotosChange={setPhotos} />

        {parseError && (
          <div className="rounded-md bg-red-50 border border-red-200 px-4 py-3 text-sm text-error">
            {parseError}
          </div>
        )}

        <div className="flex items-center gap-3">
          <Button onClick={handleSubmit} disabled={!canSubmit} size="lg">
            {isParsing ? (
              <>
                <span className="animate-spin inline-block h-4 w-4 border-2 border-white/30 border-t-white rounded-full" />
                Parsing…
              </>
            ) : (
              <>
                <Sparkles size={16} />
                Generate Timeline
              </>
            )}
          </Button>

          {events.length > 0 && (
            <Button variant="secondary" onClick={() => navigate('/timeline')}>
              <FileText size={16} />
              View Existing Timeline
            </Button>
          )}
        </div>
      </div>
    </div>
  )
}
