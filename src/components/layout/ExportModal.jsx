import { useState, useMemo, useCallback } from 'react'
import { X, Link2, FileText, Table, FileCode, Braces, Printer, FileDown } from 'lucide-react'
import useTimelineStore from '@/store/useTimelineStore'
import {
  exportJSON,
  exportCSV,
  exportPlainText,
  exportMarkdown,
  printTimeline,
  downloadPDF,
} from '@/utils/exportHelpers'
import { encodeTimeline } from '@/utils/shareEncoder'
import AnimatedModal from '@/components/shared/AnimatedModal'

export default function ExportModal({ open, onClose }) {
  const events = useTimelineStore((s) => s.events)
  const showToast = useTimelineStore((s) => s.showToast)
  const [exportingKey, setExportingKey] = useState(null)

  const handleShare = useCallback(async () => {
    const { url, tooLarge } = encodeTimeline(events)
    if (tooLarge) {
      showToast('Timeline too large for URL. Use file export instead.')
      onClose()
      return
    }
    try {
      await navigator.clipboard.writeText(url)
    } catch {
      const input = document.createElement('input')
      input.value = url
      document.body.appendChild(input)
      input.select()
      document.execCommand('copy')
      document.body.removeChild(input)
    }
    showToast('Share link copied to clipboard')
    onClose()
  }, [events, showToast, onClose])

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
        key: 'share',
        label: 'Copy share link',
        icon: <Link2 size={20} className="text-secondary" />,
        action: handleShare,
      },
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
    [events, handleShare, handleExport, onClose]
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
      <div className="p-5">
        <div className="grid grid-cols-2 gap-2">
          {exportItems.map(({ key, label, icon, action }) => {
            const isExporting = exportingKey === key
            return (
              <button
                key={key}
                onClick={action}
                disabled={!!exportingKey}
                className={`relative flex flex-col items-center gap-2 rounded-xl border border-gray-200 bg-white hover:bg-gray-50 px-4 py-4 text-sm text-gray-700 transition-colors cursor-pointer overflow-hidden ${exportingKey && !isExporting ? 'opacity-50' : ''}`}
              >
                {isExporting && (
                  <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/60 to-transparent animate-[shimmer_1s_ease-in-out_infinite]" />
                )}
                {icon}
                <span className="text-xs font-medium">{isExporting ? 'Exporting…' : label}</span>
              </button>
            )
          })}
        </div>
      </div>
    </AnimatedModal>
  )
}
