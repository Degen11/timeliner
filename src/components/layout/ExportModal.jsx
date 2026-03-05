import { useState, useMemo, useCallback } from 'react'
import { X, Link2, FileText, Table, FileCode, Braces, Printer, FileDown, Copy, Check } from 'lucide-react'
import useTimelineStore from '@/store/useTimelineStore'
import {
  exportJSON,
  exportCSV,
  exportPlainText,
  exportMarkdown,
  printTimeline,
  downloadPDF,
} from '@/utils/exportHelpers'
import { encodeTimeline, createServerShare } from '@/utils/shareEncoder'
import AnimatedModal from '@/components/shared/AnimatedModal'

function ShareSection({ events, showToast }) {
  const [shareUrl, setShareUrl] = useState(null)
  const [isSharing, setIsSharing] = useState(false)
  const [copied, setCopied] = useState(false)
  const [expiresInDays, setExpiresInDays] = useState(90)

  const timelines = useTimelineStore((s) => s.timelines)
  const activeTimelineId = useTimelineStore((s) => s.activeTimelineId)
  const timelineName = useMemo(() => {
    if (activeTimelineId) {
      const tl = timelines.find((t) => t.id === activeTimelineId)
      return tl?.name || 'Timeline'
    }
    return 'Timeline'
  }, [activeTimelineId, timelines])

  const handleShare = useCallback(async () => {
    setIsSharing(true)
    try {
      // Try server-side share first
      const result = await createServerShare(
        events,
        { title: timelineName, eventCount: events.length },
        expiresInDays
      )
      setShareUrl(result.url)
      await navigator.clipboard.writeText(result.url).catch(() => {})
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
      showToast('Share link created and copied')
    } catch {
      // Fallback to client-side LZ encoding
      const { url, tooLarge } = encodeTimeline(events)
      if (tooLarge) {
        showToast('Timeline too large for sharing. Try exporting as a file instead.', {
          variant: 'error',
        })
      } else {
        setShareUrl(url)
        try {
          await navigator.clipboard.writeText(url)
        } catch {
          // clipboard fallback handled by copy button
        }
        setCopied(true)
        setTimeout(() => setCopied(false), 2000)
        showToast('Share link copied (local fallback)')
      }
    }
    setIsSharing(false)
  }, [events, showToast, timelineName, expiresInDays])

  const handleCopy = useCallback(async () => {
    if (!shareUrl) return
    try {
      await navigator.clipboard.writeText(shareUrl)
    } catch {
      const input = document.createElement('input')
      input.value = shareUrl
      document.body.appendChild(input)
      input.select()
      document.execCommand('copy')
      document.body.removeChild(input)
    }
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
    showToast('Link copied')
  }, [shareUrl, showToast])

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2">
        <Link2 size={18} className="text-secondary shrink-0" />
        <span className="text-sm font-medium text-gray-900">Share link</span>
      </div>

      {shareUrl ? (
        <div className="flex items-center gap-2">
          <input
            type="text"
            readOnly
            value={shareUrl}
            className="flex-1 text-xs bg-gray-50 border border-gray-200 rounded-lg px-3 py-2 text-gray-600 truncate"
            onClick={(e) => e.target.select()}
          />
          <button
            onClick={handleCopy}
            className="shrink-0 rounded-lg p-2 border border-gray-200 hover:bg-gray-50 transition-colors cursor-pointer"
            title="Copy link"
          >
            {copied ? (
              <Check size={14} className="text-success" />
            ) : (
              <Copy size={14} className="text-gray-500" />
            )}
          </button>
        </div>
      ) : (
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <select
              value={expiresInDays}
              onChange={(e) => setExpiresInDays(Number(e.target.value))}
              className="text-xs bg-gray-50 border border-gray-200 rounded-lg px-2 py-1.5 text-gray-600"
            >
              <option value={30}>Expires in 30 days</option>
              <option value={90}>Expires in 90 days</option>
              <option value={365}>Expires in 1 year</option>
            </select>
          </div>
          <button
            onClick={handleShare}
            disabled={isSharing}
            className="w-full rounded-lg border border-secondary bg-secondary/5 hover:bg-secondary/10 px-4 py-2.5 text-sm font-medium text-secondary transition-colors cursor-pointer disabled:opacity-50"
          >
            {isSharing ? 'Creating link...' : 'Create share link'}
          </button>
        </div>
      )}

      <p className="text-[11px] text-gray-400">
        Creates a read-only snapshot. Recipients can view and copy to their own workspace.
      </p>
    </div>
  )
}

export default function ExportModal({ open, onClose }) {
  const events = useTimelineStore((s) => s.events)
  const showToast = useTimelineStore((s) => s.showToast)
  const [exportingKey, setExportingKey] = useState(null)

  const handleExport = useCallback(
    async (key, fn, toastMsg) => {
      setExportingKey(key)
      try {
        await fn()
        showToast(toastMsg)
      } catch {
        showToast('Export failed. Please try again.', { variant: 'error' })
      }
      await new Promise((r) => setTimeout(r, 250))
      setExportingKey(null)
      onClose()
    },
    [showToast, onClose]
  )

  const exportItems = useMemo(
    () => [
      {
        key: 'txt',
        label: 'Plain text',
        icon: <FileText size={20} className="text-gray-500" />,
        action: () => handleExport('txt', () => exportPlainText(events), 'Exported as plain text'),
      },
      {
        key: 'csv',
        label: 'CSV',
        icon: <Table size={20} className="text-gray-500" />,
        action: () => handleExport('csv', () => exportCSV(events), 'Exported as CSV'),
      },
      {
        key: 'md',
        label: 'Markdown',
        icon: <FileCode size={20} className="text-gray-500" />,
        action: () => handleExport('md', () => exportMarkdown(events), 'Exported as Markdown'),
      },
      {
        key: 'json',
        label: 'JSON',
        icon: <Braces size={20} className="text-gray-500" />,
        action: () => handleExport('json', () => exportJSON(events), 'Exported as JSON'),
      },
      {
        key: 'print',
        label: 'Print',
        icon: <Printer size={20} className="text-gray-500" />,
        action: () => {
          printTimeline(events)
          onClose()
        },
      },
      {
        key: 'pdf',
        label: 'Download PDF',
        icon: <FileDown size={20} className="text-gray-500" />,
        action: () => handleExport('pdf', () => downloadPDF(events), 'PDF saved to downloads'),
      },
    ],
    [events, handleExport, onClose]
  )

  return (
    <AnimatedModal
      open={open}
      onClose={onClose}
      className="bg-white rounded-xl shadow-lg max-w-md w-full mx-4"
    >
      <div className="flex items-center justify-between p-5 border-b border-gray-100">
        <h2 className="font-display text-lg font-semibold text-gray-900">Share & Export</h2>
        <button
          onClick={onClose}
          className="rounded-lg p-1.5 text-gray-400 hover:text-gray-900 hover:bg-gray-100 transition-colors cursor-pointer"
          aria-label="Close"
        >
          <X size={18} />
        </button>
      </div>
      <div className="p-5 space-y-5">
        <ShareSection events={events} showToast={showToast} />

        <div className="border-t border-gray-100 pt-4">
          <p className="text-xs font-medium text-gray-500 uppercase tracking-wider mb-3">
            Export as file
          </p>
          <div className="grid grid-cols-3 gap-2">
            {exportItems.map(({ key, label, icon, action }) => {
              const isExporting = exportingKey === key
              return (
                <button
                  key={key}
                  onClick={action}
                  disabled={!!exportingKey}
                  className={`relative flex flex-col items-center gap-2 rounded-xl border border-gray-200 bg-white hover:bg-gray-50 px-3 py-3 text-sm text-gray-700 transition-colors cursor-pointer overflow-hidden ${exportingKey && !isExporting ? 'opacity-50' : ''}`}
                >
                  {isExporting && (
                    <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/60 to-transparent animate-[shimmer_1s_ease-in-out_infinite]" />
                  )}
                  {icon}
                  <span className="text-xs font-medium">{isExporting ? 'Exporting...' : label}</span>
                </button>
              )
            })}
          </div>
        </div>
      </div>
    </AnimatedModal>
  )
}
