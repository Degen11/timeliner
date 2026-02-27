import { useEffect } from 'react'
import { CheckCircle, X } from 'lucide-react'
import useTimelineStore from '@/store/useTimelineStore'

export default function Toast() {
  const toast = useTimelineStore((s) => s.toast)
  const clearToast = useTimelineStore((s) => s.clearToast)

  useEffect(() => {
    if (!toast) return
    const handleKey = (e) => {
      if (e.key === 'Escape') clearToast()
    }
    window.addEventListener('keydown', handleKey)
    return () => window.removeEventListener('keydown', handleKey)
  }, [toast, clearToast])

  if (!toast) return null

  return (
    <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 animate-fade-in">
      <div className="flex items-center gap-2 rounded-xl bg-gray-900 px-4 py-2.5 text-sm text-white shadow-lg">
        <CheckCircle size={16} className="text-green-400 flex-shrink-0" />
        <span>{toast}</span>
        <button
          onClick={clearToast}
          className="ml-1 rounded p-0.5 hover:bg-white/10 transition-colors cursor-pointer"
          aria-label="Dismiss"
        >
          <X size={14} />
        </button>
      </div>
    </div>
  )
}
