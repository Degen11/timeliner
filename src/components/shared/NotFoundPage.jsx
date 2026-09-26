import { Link } from 'react-router-dom'
import { Home } from 'lucide-react'
import useDocumentMeta from '@/hooks/useDocumentMeta'
import EmptyState from './EmptyState'

export default function NotFoundPage() {
  // The SPA rewrite serves every unknown path with a 200, so tell crawlers
  // explicitly not to index it (avoids soft-404s).
  useDocumentMeta({
    title: 'Page not found — Timeliner',
    description: "The page you're looking for doesn't exist or has been moved.",
    noindex: true,
  })

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
