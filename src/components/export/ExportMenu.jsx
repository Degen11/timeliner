import { useState, useRef, useEffect, useMemo, useCallback } from 'react'
import { Download, FileText, Table, FileCode, Braces, Link2, Check, AlertCircle, Printer } from 'lucide-react'
import useTimelineStore from '@/store/useTimelineStore'
import { exportJSON, exportCSV, exportPlainText, exportMarkdown, printTimeline } from '@/utils/exportHelpers'
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
    function handleKeyDown(e) {
      if (e.key === 'Escape') setIsOpen(false)
    }
    document.addEventListener('mousedown', handleClick)
    document.addEventListener('keydown', handleKeyDown)
    return () => {
      document.removeEventListener('mousedown', handleClick)
      document.removeEventListener('keydown', handleKeyDown)
    }
  }, [])

  const handleShare = useCallback(async () => {
    const { url, tooLarge } = encodeTimeline(events)
    if (tooLarge) {
      setShareError('Timeline too large for URL. Use file export instead.')
      setTimeout(() => setShareError(null), 3000)
      return
    }
    try {
      await navigator.clipboard.writeText(url)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch {
      const input = document.createElement('input')
      input.value = url
      document.body.appendChild(input)
      input.select()
      document.execCommand('copy')
      document.body.removeChild(input)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    }
  }, [events])

  const items = useMemo(() => [
    {
      label: 'Copy share link',
      icon: copied ? Check : Link2,
      action: handleShare,
      sublabel: copied ? 'Copied!' : null,
    },
    { label: 'Plain text', icon: FileText, action: () => exportPlainText(events) },
    { label: 'CSV', icon: Table, action: () => exportCSV(events) },
    { label: 'Markdown', icon: FileCode, action: () => exportMarkdown(events) },
    { label: 'JSON', icon: Braces, action: () => exportJSON(events) },
    { label: 'Print / PDF', icon: Printer, action: () => printTimeline(events) },
  ], [copied, events, handleShare])

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
