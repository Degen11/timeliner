import { useState } from 'react'
import { X, Link2, FileText, Table, FileCode, Braces, CalendarDays, Printer, FileDown, ImageDown, Copy, Check } from 'lucide-react'
import useTimelineStore from '@/store/useTimelineStore'
import {
  exportJSON,
  exportCSV,
  exportPlainText,
  exportMarkdown,
  exportICS,
  printTimeline,
  downloadPDF,
  downloadPoster,
} from '@/utils/exportHelpers'
import { encodeTimeline, createServerShare } from '@/utils/shareEncoder'
import AnimatedModal from '@/components/shared/AnimatedModal'
import { Button } from '@/components/ui/Button'
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from '@/components/ui/Select'
import { Tooltip } from '@/components/ui/Tooltip'

function ShareSection({ events, showToast }) {
  const [shareUrl, setShareUrl] = useState(null)
  const [isSharing, setIsSharing] = useState(false)
  const [copied, setCopied] = useState(false)
  const [expiresInDays, setExpiresInDays] = useState(90)

  const timelines = useTimelineStore((s) => s.timelines)
  const activeTimelineId = useTimelineStore((s) => s.activeTimelineId)
  const timelineName = (() => {
    if (activeTimelineId) {
      const tl = timelines.find((t) => t.id === activeTimelineId)
      return tl?.name || 'Timeline'
    }
    return 'Timeline'
  })()

  const handleShare = async () => {
    setIsSharing(true)
    try {
      const result = await createServerShare(
        events,
        { title: timelineName, eventCount: events.length },
        expiresInDays
      )
      setShareUrl(result.url)
      let copiedOk = true
      try {
        await navigator.clipboard.writeText(result.url)
      } catch {
        copiedOk = false
      }
      if (copiedOk) {
        setCopied(true)
        setTimeout(() => setCopied(false), 2000)
        showToast('Share link created and copied', { variant: 'success' })
      } else {
        // Don't claim it was copied when the clipboard write failed.
        showToast('Share link created — copy it from the field below')
      }
    } catch {
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
  }

  const handleCopy = async () => {
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
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2">
        <Link2 size={16} className="text-secondary shrink-0" />
        <span className="text-sm font-medium text-text-strong">Share link</span>
      </div>

      {shareUrl ? (
        <div className="flex items-center gap-2">
          <input
            type="text"
            readOnly
            value={shareUrl}
            className="flex-1 text-xs bg-surface-raised border border-gray-200 rounded-lg px-3 py-2 text-text-muted truncate"
            onClick={(e) => e.target.select()}
          />
          <Tooltip label={copied ? 'Copied!' : 'Copy link'}>
            <button
              onClick={handleCopy}
              className="shrink-0 rounded-lg p-2 border border-gray-200 hover:bg-surface-raised transition-colors duration-150 cursor-pointer"
              aria-label="Copy share link"
            >
              {copied ? (
                <Check size={14} className="text-success" />
              ) : (
                <Copy size={14} className="text-text-muted" />
              )}
            </button>
          </Tooltip>
        </div>
      ) : (
        <div className="space-y-2">
          <Select
            value={String(expiresInDays)}
            onValueChange={(v) => setExpiresInDays(Number(v))}
          >
            <SelectTrigger className="h-8 text-xs w-auto">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="30">Expires in 30 days</SelectItem>
              <SelectItem value="90">Expires in 90 days</SelectItem>
              <SelectItem value="365">Expires in 1 year</SelectItem>
            </SelectContent>
          </Select>
          <button
            onClick={handleShare}
            disabled={isSharing}
            className="w-full rounded-lg border border-secondary bg-secondary/5 hover:bg-secondary/10 px-4 py-2.5 text-sm font-medium text-secondary transition-colors duration-150 cursor-pointer disabled:opacity-50"
          >
            {isSharing ? 'Creating link...' : 'Create share link'}
          </button>
        </div>
      )}

      <p className="text-xs text-text-muted">
        Creates a read-only snapshot. Recipients can view and copy to their own workspace.
      </p>
    </div>
  )
}

export default function ExportModal({ open, onClose }) {
  const events = useTimelineStore((s) => s.events)
  const showToast = useTimelineStore((s) => s.showToast)
  const timelineName = useTimelineStore((s) => {
    const tl = s.activeTimelineId ? s.timelines.find((t) => t.id === s.activeTimelineId) : null
    return tl?.name || 'Timeline'
  })
  const [exportingKey, setExportingKey] = useState(null)

  const handleExport = async (key, fn, toastMsg) => {
    setExportingKey(key)
    try {
      await fn()
      showToast(toastMsg)
    } catch {
      // Keep the modal open so the user can retry without reopening it
      showToast('Export failed. Please try again.', { variant: 'error' })
      setExportingKey(null)
      return
    }
    await new Promise((r) => setTimeout(r, 250))
    setExportingKey(null)
    onClose()
  }

  const exportItems = [
    {
      key: 'txt',
      label: 'Plain text',
      icon: <FileText size={20} className="text-text-muted" />,
      action: () => handleExport('txt', () => exportPlainText(events), 'Exported as plain text'),
    },
    {
      key: 'csv',
      label: 'CSV',
      icon: <Table size={20} className="text-text-muted" />,
      action: () => handleExport('csv', () => exportCSV(events), 'Exported as CSV'),
    },
    {
      key: 'md',
      label: 'Markdown',
      icon: <FileCode size={20} className="text-text-muted" />,
      action: () => handleExport('md', () => exportMarkdown(events), 'Exported as Markdown'),
    },
    {
      key: 'json',
      label: 'JSON',
      icon: <Braces size={20} className="text-text-muted" />,
      action: () => handleExport('json', () => exportJSON(events), 'Exported as JSON'),
    },
    {
      key: 'ics',
      label: 'Calendar (.ics)',
      icon: <CalendarDays size={20} className="text-text-muted" />,
      action: () => handleExport('ics', () => exportICS(events), 'Exported as calendar'),
    },
    {
      key: 'print',
      label: 'Print',
      icon: <Printer size={20} className="text-text-muted" />,
      action: () => {
        printTimeline(events, showToast)
        onClose()
      },
    },
    {
      key: 'pdf',
      label: 'Download PDF',
      icon: <FileDown size={20} className="text-text-muted" />,
      action: () => handleExport('pdf', () => downloadPDF(events), 'PDF saved to downloads'),
    },
    {
      key: 'poster',
      label: 'Poster (PNG)',
      icon: <ImageDown size={20} className="text-text-muted" />,
      action: () => handleExport('poster', () => downloadPoster(events, timelineName), 'Poster saved to downloads'),
    },
  ]

  return (
    <AnimatedModal
      label="Share and export"
      open={open}
      onClose={onClose}
      className="bg-surface rounded-xl shadow-2xl max-w-md w-full mx-4 modal-surface"
    >
      <div className="flex items-center justify-between px-5 py-4 border-b border-gray-200">
        <h2 className="text-base font-semibold text-text-strong">Share & Export</h2>
        <Button variant="ghost" size="icon" onClick={onClose} aria-label="Close">
          <X size={16} />
        </Button>
      </div>
      <div className="px-5 py-4 space-y-5">
        <ShareSection events={events} showToast={showToast} />

        <div className="border-t border-gray-200 pt-4">
          <p className="text-xs font-medium text-text-muted uppercase tracking-wider mb-3">
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
                  className={`relative flex flex-col items-center gap-2 rounded-xl border border-gray-200 bg-surface hover:bg-surface-raised px-3 py-3 text-sm text-text-default transition-colors duration-150 cursor-pointer overflow-hidden ${exportingKey && !isExporting ? 'opacity-50' : ''}`}
                >
                  {isExporting && (
                    <div className="absolute inset-0 bg-gradient-to-r from-transparent via-gray-200/50 to-transparent animate-[shimmer_1s_ease-in-out_infinite]" />
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
