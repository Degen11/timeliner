import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { Clock, ExternalLink } from 'lucide-react'
import LZString from 'lz-string'
import VerticalView from '@/components/timeline/VerticalView'
import EmptyState from './EmptyState'

export default function SharedViewPage() {
  const [events, setEvents] = useState(null)
  const [error, setError] = useState(false)

  useEffect(() => {
    try {
      const hash = window.location.hash.slice(1)
      if (!hash) {
        setError(true)
        return
      }
      const json = LZString.decompressFromEncodedURIComponent(hash)
      const data = JSON.parse(json)
      setEvents(data.events || [])
    } catch {
      setError(true)
    }
  }, [])

  if (error) {
    return (
      <EmptyState
        icon={Clock}
        title="Invalid or missing timeline"
        description="This link doesn't contain valid timeline data."
      >
        <Link
          to="/"
          className="text-sm text-accent hover:underline inline-flex items-center gap-1"
        >
          Create your own timeline <ExternalLink size={12} />
        </Link>
      </EmptyState>
    )
  }

  if (!events) {
    return (
      <div className="flex items-center justify-center py-16">
        <span className="animate-spin h-6 w-6 border-2 border-gray-300 border-t-accent rounded-full" />
      </div>
    )
  }

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold text-gray-900">
            Shared Timeline
          </h1>
          <p className="text-sm text-gray-500">
            {events.length} event{events.length !== 1 ? 's' : ''}
          </p>
        </div>
        <Link
          to="/"
          className="text-sm text-accent hover:underline inline-flex items-center gap-1"
        >
          Create your own <ExternalLink size={12} />
        </Link>
      </div>
      <VerticalView events={events} />
    </div>
  )
}
