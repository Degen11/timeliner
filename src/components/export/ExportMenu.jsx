import { useState, useRef, useEffect } from 'react'
import { Download, FileJson, FileSpreadsheet, FileCode, Link2, Check, AlertCircle } from 'lucide-react'
import useTimelineStore from '@/store/useTimelineStore'
import { exportJSON, exportCSV, exportHTML } from '@/utils/exportHelpers'
import { encodeTimeline } from '@/utils/shareEncoder'

export default function ExportMenu() {
  const [isOpen, setIsOpen] = useState(false)
  const [copied, setCopied] = useState(false)
  const [shareError, setShareError] = useState(null)
  const ref = useRef(null)
  const events = useTimelineStore((s) => s.events)

  useEffect(() => {
    function handleClick(e) {
      if (ref.current && !ref.current.contains(e.target)) {
        setIsOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [])

  const handleShare = async () => {
    const { url, tooLarge } = encodeTimeline(events)
    if (tooLarge) {
      setShareError('Timeline too large for URL. Use HTML export instead.')
      setTimeout(() => setShareError(null), 3000)
      return
    }
    try {
      await navigator.clipboard.writeText(url)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch {
      // Fallback: select a temporary input
      const input = document.createElement('input')
      input.value = url
      document.body.appendChild(input)
      input.select()
      document.execCommand('copy')
      document.body.removeChild(input)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    }
  }

  const items = [
    {
      label: 'Copy share link',
      icon: copied ? Check : Link2,
      action: handleShare,
      sublabel: copied ? 'Copied!' : null,
    },
    { label: 'Download JSON', icon: FileJson, action: () => exportJSON(events) },
    { label: 'Download CSV', icon: FileSpreadsheet, action: () => exportCSV(events) },
    { label: 'Download HTML', icon: FileCode, action: () => exportHTML(events) },
  ]

  return (
    <div ref={ref} className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-1.5 rounded-lg border border-gray-200 bg-white px-3 py-1.5 text-sm text-gray-700 hover:border-gray-300 hover:shadow-sm transition-all cursor-pointer"
      >
        <Download size={14} />
        Export
      </button>

      {isOpen && (
        <div className="absolute top-full right-0 z-20 mt-1.5 min-w-[200px] rounded-xl border border-gray-200 bg-white py-1.5 shadow-lg">
          {shareError && (
            <div className="flex items-center gap-1.5 px-3 py-1.5 text-xs text-error">
              <AlertCircle size={12} />
              {shareError}
            </div>
          )}
          {items.map(({ label, icon: Icon, action, sublabel }) => (
            <button
              key={label}
              onClick={() => {
                action()
                if (label !== 'Copy share link') setIsOpen(false)
              }}
              className="flex w-full items-center gap-2 px-3 py-2 text-sm text-gray-700 hover:bg-gray-50 transition-colors cursor-pointer"
            >
              <Icon size={14} className="text-gray-400" />
              {sublabel || label}
            </button>
          ))}
        </div>
      )}
    </div>
  )
}
