import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { X, Link2, FileText, Table, Braces, CalendarDays, Printer, FileDown, ImageDown, Copy, Check, Loader2 } from 'lucide-react'
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
import { Tooltip } from '@/components/ui/Tooltip'
import { SPRING } from '@/utils/constants'
import { getFilteredEvents } from '@/store/selectors'
import { pluralize } from '@/utils/ui'

const EXPIRY_OPTIONS = [
  { days: 30, label: '30 days' },
  { days: 90, label: '90 days' },
  { days: 365, label: '1 year' },
]

function Segmented({ name, legend, options, value, onChange }) {
  return (
    <fieldset className="inline-flex rounded-[9px] bg-soft-accent p-[3px] dark:bg-surface-raised">
      <legend className="sr-only">{legend}</legend>
      {options.map((o) => (
        <label key={o.value} className="relative">
          <input
            type="radio"
            name={name}
            value={o.value}
            checked={value === o.value}
            onChange={() => onChange(o.value)}
            className="peer sr-only"
          />
          <span className="flex h-8 sm:h-7 items-center whitespace-nowrap rounded-[6px] px-2.5 text-xs text-text-default transition-colors duration-150 cursor-pointer peer-checked:bg-surface peer-checked:font-semibold peer-checked:text-text-strong peer-checked:shadow-sm peer-focus-visible:ring-2 peer-focus-visible:ring-focus-ring dark:peer-checked:bg-surface">
            {o.label}
          </span>
        </label>
      ))}
    </fieldset>
  )
}

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
    <section aria-labelledby="share-heading" className="space-y-3 rounded-2xl border border-gray-200 p-4">
      <div className="flex items-start gap-3">
        <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-[10px] bg-orange-100 text-orange-800 dark:bg-orange-500/15 dark:text-orange-300" aria-hidden="true">
          <Link2 size={16} />
        </span>
        <div className="min-w-0 space-y-0.5">
          <h3 id="share-heading" className="text-[15px] font-semibold text-text-strong">Share a link</h3>
          <p className="text-[13px] text-text-default">
            A read-only snapshot of {pluralize(events.length, 'event')}. Anyone with the link can view it and copy it into their own Timeliner.
          </p>
        </div>
      </div>

      {shareUrl ? (
        <div className="flex items-center gap-2 sm:pl-12">
          <input
            type="text"
            readOnly
            value={shareUrl}
            aria-label="Share link"
            className="h-10 min-w-0 flex-1 truncate rounded-lg border border-gray-200 bg-surface-raised px-3 text-sm text-text-default"
            onClick={(e) => e.target.select()}
          />
          <Tooltip label={copied ? 'Copied!' : 'Copy link'}>
            <button
              onClick={handleCopy}
              className="flex h-10 shrink-0 items-center gap-1.5 rounded-lg border border-gray-200 px-3 text-[13px] font-medium text-text-strong hover:bg-surface-raised transition-colors duration-150 cursor-pointer"
              aria-label="Copy share link"
            >
              <AnimatePresence mode="wait" initial={false}>
                <motion.span
                  key={copied ? 'check' : 'copy'}
                  initial={{ scale: 0.5, rotate: -90, opacity: 0 }}
                  animate={{ scale: 1, rotate: 0, opacity: 1 }}
                  exit={{ scale: 0.5, rotate: 90, opacity: 0 }}
                  transition={SPRING.BOUNCY}
                  className="inline-flex"
                >
                  {copied ? <Check size={14} className="text-success" /> : <Copy size={14} className="text-text-muted" />}
                </motion.span>
              </AnimatePresence>
              {copied ? 'Copied' : 'Copy'}
            </button>
          </Tooltip>
        </div>
      ) : (
        <div className="flex flex-wrap items-center gap-x-2.5 gap-y-2 sm:pl-12">
          <span className="text-xs text-text-default" aria-hidden="true">Expires</span>
          <Segmented
            name="share-expiry"
            legend="Link expires in"
            options={EXPIRY_OPTIONS.map((o) => ({ value: o.days, label: o.label }))}
            value={expiresInDays}
            onChange={setExpiresInDays}
          />
          <span className="flex-1" />
          <button
            onClick={handleShare}
            disabled={isSharing || events.length === 0}
            className="inline-flex h-11 sm:h-9 items-center gap-2 rounded-[10px] bg-text-strong px-4 text-[13px] font-semibold text-canvas shadow-sm transition-opacity duration-150 hover:opacity-90 disabled:opacity-50 cursor-pointer disabled:cursor-default focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus-ring focus-visible:ring-offset-2"
          >
            {isSharing && <Loader2 size={14} className="animate-spin" aria-hidden="true" />}
            {isSharing ? 'Creating link…' : 'Create & copy link'}
          </button>
        </div>
      )}
    </section>
  )
}

function ExportRow({ item, exportingKey }) {
  const isExporting = exportingKey === item.key
  const Icon = item.icon
  return (
    <button
      onClick={item.action}
      disabled={!!exportingKey}
      className={`-mx-2 flex items-center gap-3 rounded-lg px-2 py-2 text-left transition-colors duration-150 hover:bg-surface-raised cursor-pointer disabled:cursor-default ${
        exportingKey && !isExporting ? 'opacity-50' : ''
      }`}
    >
      {isExporting ? (
        <Loader2 size={16} className="shrink-0 animate-spin text-text-default" aria-hidden="true" />
      ) : (
        <Icon size={16} className="shrink-0 text-text-default" aria-hidden="true" />
      )}
      <span className="flex min-w-0 flex-col">
        <span className="text-sm font-medium text-text-strong">{isExporting ? 'Exporting…' : item.label}</span>
        <span className="text-xs text-text-default">{item.hint}</span>
      </span>
    </button>
  )
}

export default function ExportModal({ open, onClose }) {
  const allEvents = useTimelineStore((s) => s.events)
  const filters = useTimelineStore((s) => s.filters)
  const showToast = useTimelineStore((s) => s.showToast)
  const timelineName = useTimelineStore((s) => {
    const tl = s.activeTimelineId ? s.timelines.find((t) => t.id === s.activeTimelineId) : null
    return tl?.name || 'Timeline'
  })
  const [exportingKey, setExportingKey] = useState(null)
  const [scope, setScope] = useState('all')

  // Only offer "filtered" when filters actually narrow the timeline
  const filtered = open ? getFilteredEvents(allEvents, filters) : allEvents
  const canScope = open && filtered.length !== allEvents.length
  const events = canScope && scope === 'filtered' ? filtered : allEvents

  const handleExport = async (key, fn, toastMsg) => {
    setExportingKey(key)
    try {
      await fn()
      showToast(toastMsg, { variant: 'success' })
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

  const readItems = [
    { key: 'pdf', label: 'PDF', hint: 'Formatted pages', icon: FileDown, action: () => handleExport('pdf', () => downloadPDF(events), 'PDF saved to downloads') },
    { key: 'poster', label: 'Poster image', hint: 'One PNG to post or frame', icon: ImageDown, action: () => handleExport('poster', () => downloadPoster(events, timelineName), 'Poster saved to downloads') },
    {
      key: 'print',
      label: 'Print',
      hint: `Opens the print dialog · ${navigator.platform?.includes('Mac') ? '⌘P' : 'Ctrl+P'}`,
      icon: Printer,
      action: () => {
        printTimeline(events, showToast)
        onClose()
      },
    },
  ]

  const dataItems = [
    { key: 'csv', label: 'Spreadsheet', hint: 'CSV for Excel or Google Sheets', icon: Table, action: () => handleExport('csv', () => exportCSV(events), 'Exported as CSV') },
    { key: 'ics', label: 'Calendar', hint: '.ics for Google, Apple or Outlook', icon: CalendarDays, action: () => handleExport('ics', () => exportICS(events), 'Exported as calendar') },
    { key: 'json', label: 'Backup', hint: 'JSON you can import back here', icon: Braces, action: () => handleExport('json', () => exportJSON(events), 'Exported as JSON') },
  ]

  const minorItems = [
    { key: 'md', label: 'Markdown', action: () => handleExport('md', () => exportMarkdown(events), 'Exported as Markdown') },
    { key: 'txt', label: 'Plain text', action: () => handleExport('txt', () => exportPlainText(events), 'Exported as plain text') },
  ]

  return (
    <AnimatedModal
      label="Share and export"
      open={open}
      onClose={onClose}
      className="bg-surface sm:rounded-2xl shadow-2xl max-w-xl w-full sm:mx-4 max-h-[92dvh] sm:max-h-[88vh] flex flex-col overflow-hidden modal-surface"
    >
      <div className="flex shrink-0 items-start justify-between gap-4 px-5 sm:px-6 pt-4 sm:pt-5 pb-3">
        <div className="min-w-0 space-y-1">
          <h2 className="font-serif text-2xl font-semibold text-text-strong">Share &amp; export</h2>
          <p className="truncate text-[13px] text-text-default">
            {timelineName} · {pluralize(allEvents.length, 'event')}
          </p>
        </div>
        <Button variant="ghost" size="icon" onClick={onClose} aria-label="Close" className="-mr-2">
          <X size={16} />
        </Button>
      </div>

      <div className="min-h-0 flex-1 space-y-5 overflow-y-auto px-5 sm:px-6 pb-6 app-scroll">
        {canScope && (
          <div className="flex flex-wrap items-center gap-x-3 gap-y-2 rounded-[10px] bg-soft-accent py-2 pl-3 pr-2 dark:bg-surface-raised">
            <span className="min-w-0 flex-1 text-[13px] text-text-default">Filters are on. What should go out?</span>
            <Segmented
              name="export-scope"
              legend="Events to include"
              options={[
                { value: 'all', label: `All ${allEvents.length} events` },
                { value: 'filtered', label: `Only ${filtered.length} filtered` },
              ]}
              value={scope}
              onChange={setScope}
            />
          </div>
        )}

        <ShareSection events={events} showToast={showToast} />

        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
          <section aria-labelledby="export-read" className="flex flex-col gap-0.5">
            <h3 id="export-read" className="mb-1.5 text-xs font-semibold text-text-default">To read or print</h3>
            {readItems.map((item) => <ExportRow key={item.key} item={item} exportingKey={exportingKey} />)}
          </section>
          <section aria-labelledby="export-data" className="flex flex-col gap-0.5">
            <h3 id="export-data" className="mb-1.5 text-xs font-semibold text-text-default">To use in other apps</h3>
            {dataItems.map((item) => <ExportRow key={item.key} item={item} exportingKey={exportingKey} />)}
            <p className="flex items-center gap-3 pl-7 pt-1.5 text-[13px] text-text-default">
              <FileText size={13} className="-ml-5 text-text-muted" aria-hidden="true" />
              {minorItems.map((item) => (
                <button
                  key={item.key}
                  onClick={item.action}
                  disabled={!!exportingKey}
                  className="underline underline-offset-2 hover:text-text-strong disabled:opacity-50 cursor-pointer"
                >
                  {exportingKey === item.key ? 'Exporting…' : item.label}
                </button>
              ))}
            </p>
          </section>
        </div>
      </div>
    </AnimatedModal>
  )
}
