import { Link } from 'react-router-dom'
import { Home } from 'lucide-react'
import EmptyState from './EmptyState'

export default function NotFoundPage() {
  return (
    <EmptyState
      title="Page not found"
      description="The page you're looking for doesn't exist or has been moved."
    >
      <Link
        to="/"
        className="text-sm text-secondary hover:underline inline-flex items-center gap-1.5"
      >
        <Home size={14} />
        Go to Timeliner
      </Link>
    </EmptyState>
  )
}
