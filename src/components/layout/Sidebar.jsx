import { useState, useMemo, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion' // eslint-disable-line no-unused-vars -- motion is used as JSX motion.div
import { Link } from 'react-router-dom'
import {
  Search,
  SlidersHorizontal,
  AlertTriangle,
  Waypoints,
  ArrowUpDown,
  Image,
  ChevronsLeft,
  ChevronsRight,
  X,
  Download,
  FileText,
  FileCode,
  Braces,
  Table,
  Link2,
  Printer,
  FileDown,
  HelpCircle,
  Globe,
  Github,
} from 'lucide-react'
import useTimelineStore from '@/store/useTimelineStore'
import { TAG_COLORS } from '@/utils/constants'
import { getAllPeople, getAllTags, getFlaggedEvents } from '@/store/selectors'
import {
  exportJSON,
  exportCSV,
  exportPlainText,
  exportMarkdown,
  printTimeline,
  downloadPDF,
} from '@/utils/exportHelpers'
import { encodeTimeline } from '@/utils/shareEncoder'
import SearchInput from '@/components/filters/SearchInput'
import MultiSelect from '@/components/filters/MultiSelect'
import Badge from '@/components/shared/Badge'
import AnimatedModal from '@/components/shared/AnimatedModal'
import TimelineManager from '@/components/timeline/TimelineManager'
import SortBar from '@/components/timeline/SortBar'

// ─── Zone divider ──────────────────────────────────────────
function ZoneDivider({ dark = false }) {
  return <div className={`h-px mx-1 ${dark ? 'bg-sidebar-border' : 'bg-gray-200/60'}`} />
}

// ─── Section heading (unified: 11px semibold uppercase tracking-wider) ───
function ZoneHeading({ icon: Icon, children, dark = false, count, primary = false }) {
  return (
    <div className="flex items-center gap-2 mb-2.5 px-1">
      {Icon && (
        <Icon
          size={14}
          className={
            primary
              ? dark
                ? 'text-sidebar-text'
                : 'text-gray-600'
              : dark
                ? 'text-sidebar-muted'
                : 'text-gray-400'
          }
        />
      )}
      <span
        className={`text-[11px] font-semibold uppercase tracking-wider ${
          primary
            ? dark
              ? 'text-sidebar-text'
              : 'text-gray-600'
            : dark
              ? 'text-sidebar-heading'
              : 'text-gray-400'
        }`}
      >
        {children}
      </span>
      {count != null && (
        <span className="ml-auto inline-flex items-center justify-center min-w-[18px] h-[18px] rounded-full bg-secondary/20 text-secondary text-[10px] font-bold px-1">
          {count}
        </span>
      )}
    </div>
  )
}

// ─── Sidebar footer (credit + social) ──────────────────────
function SidebarFooter({ collapsed = false }) {
  if (collapsed) {
    return (
      <div className="flex flex-col items-center gap-1.5 py-3 border-t border-sidebar-input-border">
        <a
          href="https://www.degenh.com"
          target="_blank"
          rel="noopener noreferrer"
          aria-label="Website"
          className="text-sidebar-muted hover:text-sidebar-text transition-colors p-1"
        >
          <Globe size={13} />
        </a>
        <a
          href="https://github.com/Degen11"
          target="_blank"
          rel="noopener noreferrer"
          aria-label="GitHub"
          className="text-sidebar-muted hover:text-sidebar-text transition-colors p-1"
        >
          <Github size={13} />
        </a>
      </div>
    )
  }

  return (
    <div className="px-4 py-3 border-t border-sidebar-input-border">
      <div className="flex items-center justify-between">
        <span className="text-[10px] text-sidebar-muted">Built by Degen Hill</span>
        <div className="flex items-center gap-2">
          <a
            href="https://www.degenh.com"
            target="_blank"
            rel="noopener noreferrer"
            aria-label="Website"
            className="text-sidebar-muted hover:text-sidebar-text transition-colors"
          >
            <Globe size={13} />
          </a>
          <a
            href="https://github.com/Degen11"
            target="_blank"
            rel="noopener noreferrer"
            aria-label="GitHub"
            className="text-sidebar-muted hover:text-sidebar-text transition-colors"
          >
            <Github size={13} />
          </a>
        </div>
      </div>
    </div>
  )
}

// ─── Export modal (rendered at sidebar level so it works when collapsed) ─────
function ExportModal({ open, onClose }) {
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
        icon: Link2,
        iconColor: 'text-secondary',
        action: handleShare,
      },
      {
        key: 'txt',
        label: 'Plain text',
        icon: FileText,
        iconColor: 'text-gray-500',
        action: () => handleExport('txt', () => exportPlainText(events), 'Exported as plain text'),
      },
      {
        key: 'csv',
        label: 'CSV',
        icon: Table,
        iconColor: 'text-emerald-600',
        action: () => handleExport('csv', () => exportCSV(events), 'Exported as CSV'),
      },
      {
        key: 'md',
        label: 'Markdown',
        icon: FileCode,
        iconColor: 'text-violet-600',
        action: () => handleExport('md', () => exportMarkdown(events), 'Exported as Markdown'),
      },
      {
        key: 'json',
        label: 'JSON',
        icon: Braces,
        iconColor: 'text-highlight',
        action: () => handleExport('json', () => exportJSON(events), 'Exported as JSON'),
      },
      {
        key: 'print',
        label: 'Print',
        icon: Printer,
        iconColor: 'text-primary',
        action: () => {
          printTimeline(events)
          onClose()
        },
      },
      {
        key: 'pdf',
        label: 'Download PDF',
        icon: FileDown,
        iconColor: 'text-rose-600',
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
          className="rounded-lg p-1.5 text-gray-400 hover:text-gray-700 hover:bg-gray-100 transition-colors cursor-pointer"
          aria-label="Close"
        >
          <X size={18} />
        </button>
      </div>
      <div className="p-5">
        <div className="grid grid-cols-2 gap-2">
          {/* eslint-disable-next-line no-unused-vars -- Icon is used as JSX */}
          {exportItems.map(({ key, label, icon: Icon, iconColor, action }) => {
            const isExporting = exportingKey === key
            return (
              <button
                key={key}
                onClick={action}
                disabled={!!exportingKey}
                className={`relative flex flex-col items-center gap-2 rounded-xl border border-gray-200 bg-white hover:bg-secondary/5 hover:border-secondary/50 hover:shadow-sm px-4 py-4 text-sm text-gray-700 transition-all cursor-pointer overflow-hidden ${exportingKey && !isExporting ? 'opacity-50' : ''}`}
              >
                {isExporting && (
                  <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/60 to-transparent animate-[shimmer_1s_ease-in-out_infinite]" />
                )}
                <Icon size={20} className={iconColor} />
                <span className="text-xs font-medium">{isExporting ? 'Exporting…' : label}</span>
              </button>
            )
          })}
        </div>
      </div>
    </AnimatedModal>
  )
}

// ─── Shared sidebar content (desktop + mobile drawer) ───

function SidebarContent({
  photoCount,
  onPhotoLibOpen,
  onShowShortcuts,
  onExportOpen,
  dark = false,
}) {
  const events = useTimelineStore((s) => s.events)
  const filters = useTimelineStore((s) => s.filters)
  const setFilters = useTimelineStore((s) => s.setFilters)
  const clearFilters = useTimelineStore((s) => s.clearFilters)
  const toggleReviewMode = useTimelineStore((s) => s.toggleReviewMode)

  const allPeople = useMemo(() => getAllPeople(events), [events])
  const allTags = useMemo(() => getAllTags(events), [events])
  const flaggedCount = useMemo(() => getFlaggedEvents(events).length, [events])

  // Build dynamic colorMap for all tags (built-in + custom)
  // This is now only used by MultiSelect to know which options are tags
  const tagColorMap = useMemo(() => {
    const map = {}
    for (const t of Object.keys(TAG_COLORS)) map[t] = true
    for (const t of allTags) map[t] = true
    return map
  }, [allTags])

  const hasActiveFilters = filters.search || filters.people.length > 0 || filters.tags.length > 0
  const activeFilterCount = (filters.search ? 1 : 0) + filters.people.length + filters.tags.length

  const handleSearchChange = useCallback(
    (search) => {
      const current = useTimelineStore.getState().filters
      setFilters({ ...current, search })
    },
    [setFilters]
  )

  const handlePeopleChange = useCallback(
    (people) => {
      const current = useTimelineStore.getState().filters
      setFilters({ ...current, people })
    },
    [setFilters]
  )

  const handleTagsChange = useCallback(
    (tags) => {
      const current = useTimelineStore.getState().filters
      setFilters({ ...current, tags })
    },
    [setFilters]
  )

  const handleRemovePerson = useCallback(
    (p) => {
      const current = useTimelineStore.getState().filters
      setFilters({ ...current, people: current.people.filter((x) => x !== p) })
    },
    [setFilters]
  )

  const handleRemoveTag = useCallback(
    (t) => {
      const current = useTimelineStore.getState().filters
      setFilters({ ...current, tags: current.tags.filter((x) => x !== t) })
    },
    [setFilters]
  )

  // Shared utility button styles for consistent interaction affordance
  const utilBtnClass = dark
    ? 'text-sidebar-text hover:bg-sidebar-hover active:bg-sidebar-active'
    : 'text-gray-600 hover:bg-gray-100 active:bg-gray-200/60'

  return (
    <div className="flex flex-col h-full">
      <div className="flex-1 space-y-1">
        {/* ═══ TOP: Timeline (primary control) ═══ */}
        <div className="px-1">
          <ZoneHeading icon={Waypoints} dark={dark} primary>
            Timeline
          </ZoneHeading>
          <div className="space-y-2">
            <TimelineManager dark={dark} />
            <SortBar dark={dark} />
          </div>
        </div>

        {/* ═══ Filters section (grouped: search + people/tags) ═══ */}
        <div
          className={`mx-1 mt-3 rounded-lg px-3 py-3.5 space-y-2.5 ${
            dark ? 'border border-white/[0.06]' : 'bg-gray-50/80'
          }`}
          style={dark ? { backgroundColor: '#162240' } : undefined}
        >
          <ZoneHeading icon={SlidersHorizontal} dark={dark} count={activeFilterCount || null}>
            Filters
          </ZoneHeading>

          <SearchInput value={filters.search} onChange={handleSearchChange} dark={dark} />

          {allPeople.length > 0 && (
            <MultiSelect
              label="People"
              options={allPeople}
              selected={filters.people}
              onChange={handlePeopleChange}
              dark={dark}
            />
          )}
          {allTags.length > 0 && (
            <MultiSelect
              label="Tags"
              options={allTags}
              selected={filters.tags}
              onChange={handleTagsChange}
              colorMap={tagColorMap}
              dark={dark}
            />
          )}

          {/* Active filter chips */}
          {hasActiveFilters && (
            <div className="min-w-0 overflow-hidden">
              <div className="flex flex-wrap gap-1">
                {filters.people.map((p) => (
                  <Badge
                    key={p}
                    variant="accent"
                    small
                    dark={dark}
                    onRemove={() => handleRemovePerson(p)}
                  >
                    {p}
                  </Badge>
                ))}
                {filters.tags.map((t) => (
                  <Badge key={t} variant={t} small dark={dark} onRemove={() => handleRemoveTag(t)}>
                    {t}
                  </Badge>
                ))}
              </div>
              <button
                onClick={clearFilters}
                className={`flex items-center gap-1 mt-1.5 text-[11px] cursor-pointer transition-colors ${
                  dark
                    ? 'text-sidebar-muted hover:text-sidebar-text'
                    : 'text-gray-400 hover:text-gray-600'
                }`}
              >
                <X size={11} />
                Clear all
              </button>
            </div>
          )}
        </div>

        {/* ═══ Flagged dates — standalone actionable alert ═══ */}
        {flaggedCount > 0 && (
          <div className="px-1 pt-2">
            <button
              onClick={toggleReviewMode}
              className="flex items-center gap-2 w-full rounded-lg px-3 py-2.5 text-xs font-semibold transition-all cursor-pointer bg-flag/15 border border-flag/30 text-flag hover:bg-flag/20 active:bg-flag/25"
            >
              <AlertTriangle size={14} className="shrink-0" />
              <span>
                {flaggedCount} flagged date{flaggedCount !== 1 ? 's' : ''}
              </span>
              <span className="ml-auto inline-flex items-center justify-center min-w-[18px] h-[18px] rounded-full bg-flag text-white text-[10px] font-bold px-1">
                {flaggedCount}
              </span>
            </button>
          </div>
        )}

        {/* ═══ Utilities (consistent styling) ═══ */}
        <div className="px-1 pt-3 space-y-0.5">
          <button
            onClick={onPhotoLibOpen}
            className={`flex items-center gap-2.5 w-full rounded-lg px-3 py-2 text-sm transition-all cursor-pointer ${utilBtnClass}`}
          >
            <Image size={15} className={dark ? 'text-sidebar-muted' : 'text-gray-400'} />
            <span>Photos</span>
            {photoCount > 0 && (
              <span className="ml-auto inline-flex items-center justify-center min-w-[18px] h-[18px] rounded-full bg-secondary/15 text-secondary text-[10px] font-bold px-1">
                {photoCount}
              </span>
            )}
          </button>

          <button
            onClick={onExportOpen}
            className={`flex items-center gap-2.5 w-full rounded-lg px-3 py-2 text-sm transition-all cursor-pointer ${utilBtnClass}`}
          >
            <Download size={15} className={dark ? 'text-sidebar-muted' : 'text-gray-400'} />
            <span>Export / Share</span>
          </button>
        </div>
      </div>

      {/* Help / Tips — pinned to bottom */}
      <div className="px-1 pt-2 mt-2">
        <button
          onClick={onShowShortcuts}
          className={`flex items-center gap-2.5 w-full rounded-lg px-3 py-2 text-sm transition-all cursor-pointer ${utilBtnClass}`}
        >
          <HelpCircle size={15} className={dark ? 'text-sidebar-muted' : 'text-gray-400'} />
          <span>Help & Shortcuts</span>
        </button>
      </div>
    </div>
  )
}

// ─── Collapsed icon button ──────────────────────────────

// eslint-disable-next-line no-unused-vars -- Icon is used as JSX
function IconButton({ icon: Icon, label, onClick, badge, variant, dark = false }) {
  const isFlagged = variant === 'flag'
  return (
    <button
      onClick={onClick}
      className={`relative rounded-lg p-2.5 transition-colors cursor-pointer ${
        isFlagged
          ? 'text-flag hover:bg-flag/10 active:bg-flag/20'
          : dark
            ? 'text-sidebar-muted hover:text-sidebar-text hover:bg-sidebar-hover active:bg-sidebar-active'
            : 'text-gray-400 hover:text-gray-700 hover:bg-gray-100 active:bg-gray-200'
      }`}
      title={label}
    >
      <Icon size={18} />
      {badge != null && (
        <span
          className={`absolute -top-0.5 -right-0.5 inline-flex items-center justify-center min-w-[18px] h-[18px] rounded-full text-[10px] font-bold px-0.5 ${
            isFlagged ? 'bg-flag text-white' : 'bg-secondary text-white'
          }`}
        >
          {badge}
        </span>
      )}
    </button>
  )
}

// ─── Desktop persistent sidebar ─────────────────────────

export default function Sidebar({ photoCount, onPhotoLibOpen, onShowShortcuts }) {
  const collapsed = useTimelineStore((s) => s.sidebarCollapsed)
  const toggleSidebar = useTimelineStore((s) => s.toggleSidebar)
  const filters = useTimelineStore((s) => s.filters)
  const events = useTimelineStore((s) => s.events)
  const toggleReviewMode = useTimelineStore((s) => s.toggleReviewMode)

  const flaggedCount = useMemo(() => getFlaggedEvents(events).length, [events])
  const activeFilterCount = (filters.search ? 1 : 0) + filters.people.length + filters.tags.length

  const [exportModalOpen, setExportModalOpen] = useState(false)

  return (
    <aside
      className={`hidden lg:flex flex-col shrink-0 bg-sidebar-bg sticky top-0 h-screen z-40 transition-[width] duration-200 ease-in-out overflow-hidden border-r border-sidebar-border ${
        collapsed ? 'w-16' : 'w-[280px]'
      }`}
    >
      {/* ─── Header: Logo + Toggle + Timeline name ─── */}
      {collapsed ? (
        <div className="shrink-0 flex flex-col items-center gap-2 py-3.5 border-b border-sidebar-border">
          <Link to="/" className="no-underline" aria-label="Home">
            <svg
              width={20}
              height={20}
              viewBox="0 0 24 24"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
              aria-hidden="true"
              className="text-sidebar-text"
            >
              <line
                x1="8"
                y1="3"
                x2="8"
                y2="21"
                stroke="currentColor"
                strokeWidth="1.5"
                strokeLinecap="round"
              />
              <circle cx="8" cy="6" r="2.5" fill="currentColor" />
              <circle cx="8" cy="13" r="2.5" fill="currentColor" opacity="0.5" />
              <circle cx="8" cy="20" r="2" fill="currentColor" opacity="0.25" />
              <line
                x1="12"
                y1="6"
                x2="20"
                y2="6"
                stroke="currentColor"
                strokeWidth="1.5"
                strokeLinecap="round"
              />
              <line
                x1="12"
                y1="13"
                x2="18"
                y2="13"
                stroke="currentColor"
                strokeWidth="1.5"
                strokeLinecap="round"
                opacity="0.5"
              />
            </svg>
          </Link>
          <button
            onClick={toggleSidebar}
            className="rounded-lg p-1 text-sidebar-muted hover:text-sidebar-text hover:bg-sidebar-hover transition-all cursor-pointer"
            title="Expand sidebar"
          >
            <ChevronsRight size={14} />
          </button>
        </div>
      ) : (
        <div className="shrink-0 px-4 py-3.5 border-b border-sidebar-border">
          <div className="flex items-center justify-between">
            <Link to="/" className="no-underline inline-flex" aria-label="Home">
              <span className="inline-flex items-center gap-2.5">
                <svg
                  width={18}
                  height={18}
                  viewBox="0 0 24 24"
                  fill="none"
                  xmlns="http://www.w3.org/2000/svg"
                  aria-hidden="true"
                  className="text-sidebar-text"
                >
                  <line
                    x1="8"
                    y1="3"
                    x2="8"
                    y2="21"
                    stroke="currentColor"
                    strokeWidth="1.5"
                    strokeLinecap="round"
                  />
                  <circle cx="8" cy="6" r="2.5" fill="currentColor" />
                  <circle cx="8" cy="13" r="2.5" fill="currentColor" opacity="0.5" />
                  <circle cx="8" cy="20" r="2" fill="currentColor" opacity="0.25" />
                  <line
                    x1="12"
                    y1="6"
                    x2="20"
                    y2="6"
                    stroke="currentColor"
                    strokeWidth="1.5"
                    strokeLinecap="round"
                  />
                  <line
                    x1="12"
                    y1="13"
                    x2="18"
                    y2="13"
                    stroke="currentColor"
                    strokeWidth="1.5"
                    strokeLinecap="round"
                    opacity="0.5"
                  />
                </svg>
                <span className="font-display font-bold tracking-tight text-sidebar-text text-base">
                  timeliner
                </span>
              </span>
            </Link>
            <button
              onClick={toggleSidebar}
              className="rounded-lg p-1 text-sidebar-muted hover:text-sidebar-text hover:bg-sidebar-hover transition-all cursor-pointer"
              title="Collapse sidebar"
            >
              <ChevronsLeft size={14} />
            </button>
          </div>
        </div>
      )}

      {collapsed ? (
        /* ─── Collapsed: icon-only ─── */
        <div className="flex flex-col items-center gap-0.5 py-2 flex-1">
          {/* Timeline + Sort group */}
          <IconButton icon={Waypoints} label="Timelines" onClick={toggleSidebar} dark />
          <IconButton icon={ArrowUpDown} label="Sort" onClick={toggleSidebar} dark />

          {/* Filters group */}
          <div className="w-6 h-px bg-sidebar-border my-1.5" />
          <IconButton icon={Search} label="Search" onClick={toggleSidebar} dark />
          <IconButton
            icon={SlidersHorizontal}
            label="Filters"
            onClick={toggleSidebar}
            badge={activeFilterCount || null}
            dark
          />
          {flaggedCount > 0 && (
            <IconButton
              icon={AlertTriangle}
              label="Flagged review"
              onClick={toggleReviewMode}
              badge={flaggedCount}
              variant="flag"
              dark
            />
          )}

          {/* Utilities group */}
          <div className="w-6 h-px bg-sidebar-border my-1.5" />
          <IconButton
            icon={Image}
            label="Photos"
            onClick={onPhotoLibOpen}
            badge={photoCount > 0 ? photoCount : null}
            dark
          />
          <IconButton
            icon={Download}
            label="Export / Share"
            onClick={() => setExportModalOpen(true)}
            dark
          />

          {/* Spacer to push help + footer to bottom */}
          <div className="flex-1" />
          <div className="w-6 h-px bg-sidebar-border my-1" />
          <IconButton icon={HelpCircle} label="Help" onClick={onShowShortcuts} dark />
        </div>
      ) : (
        /* ─── Expanded: full controls ─── */
        <div className="flex-1 overflow-y-auto overflow-x-hidden px-3 py-3">
          <SidebarContent
            photoCount={photoCount}
            onPhotoLibOpen={onPhotoLibOpen}
            onShowShortcuts={onShowShortcuts}
            onExportOpen={() => setExportModalOpen(true)}
            dark
          />
        </div>
      )}

      {/* ─── Export modal (works from both collapsed + expanded) ─── */}
      <ExportModal open={exportModalOpen} onClose={() => setExportModalOpen(false)} />

      {/* ─── Footer ─── */}
      <SidebarFooter collapsed={collapsed} />
    </aside>
  )
}

// ─── Mobile slide-over drawer ───────────────────────────

const backdropVariants = {
  hidden: { opacity: 0 },
  visible: { opacity: 0.4 },
}

const drawerVariants = {
  hidden: { x: '-100%' },
  visible: { x: 0 },
  exit: { x: '-100%' },
}

export function SidebarDrawer({ open, onClose, photoCount, onPhotoLibOpen, onShowShortcuts }) {
  const [exportModalOpen, setExportModalOpen] = useState(false)

  return (
    <AnimatePresence>
      {open && (
        <>
          <motion.div
            className="fixed inset-0 z-30 bg-black lg:hidden"
            variants={backdropVariants}
            initial="hidden"
            animate="visible"
            exit="hidden"
            transition={{ duration: 0.25 }}
            onClick={onClose}
          />
          <motion.div
            className="fixed inset-y-0 left-0 z-40 w-full max-w-xs bg-sidebar-bg shadow-2xl flex flex-col lg:hidden touch-pan-y"
            variants={drawerVariants}
            initial="hidden"
            animate="visible"
            exit="exit"
            transition={{ type: 'spring', duration: 0.4, bounce: 0.1 }}
            drag="x"
            dragConstraints={{ left: -320, right: 0 }}
            dragElastic={0.1}
            onDragEnd={(_e, info) => {
              if (info.offset.x < -80 || info.velocity.x < -300) onClose()
            }}
          >
            {/* Drawer header with logo */}
            <div className="flex items-center justify-between border-b border-sidebar-border px-4 py-3.5 shrink-0">
              <Link to="/" className="no-underline inline-flex" aria-label="Home">
                <span className="inline-flex items-center gap-2.5">
                  <svg
                    width={18}
                    height={18}
                    viewBox="0 0 24 24"
                    fill="none"
                    xmlns="http://www.w3.org/2000/svg"
                    aria-hidden="true"
                    className="text-sidebar-text"
                  >
                    <line
                      x1="8"
                      y1="3"
                      x2="8"
                      y2="21"
                      stroke="currentColor"
                      strokeWidth="1.5"
                      strokeLinecap="round"
                    />
                    <circle cx="8" cy="6" r="2.5" fill="currentColor" />
                    <circle cx="8" cy="13" r="2.5" fill="currentColor" opacity="0.5" />
                    <circle cx="8" cy="20" r="2" fill="currentColor" opacity="0.25" />
                    <line
                      x1="12"
                      y1="6"
                      x2="20"
                      y2="6"
                      stroke="currentColor"
                      strokeWidth="1.5"
                      strokeLinecap="round"
                    />
                    <line
                      x1="12"
                      y1="13"
                      x2="18"
                      y2="13"
                      stroke="currentColor"
                      strokeWidth="1.5"
                      strokeLinecap="round"
                      opacity="0.5"
                    />
                  </svg>
                  <span className="font-display font-bold tracking-tight text-sidebar-text text-base">
                    timeliner
                  </span>
                </span>
              </Link>
              <button
                onClick={onClose}
                className="rounded-lg p-1.5 text-sidebar-muted hover:text-sidebar-text hover:bg-sidebar-hover transition-colors cursor-pointer"
                aria-label="Close"
              >
                <X size={18} />
              </button>
            </div>
            <div className="flex-1 overflow-y-auto overflow-x-hidden px-3 py-3">
              <SidebarContent
                photoCount={photoCount}
                onPhotoLibOpen={onPhotoLibOpen}
                onShowShortcuts={onShowShortcuts}
                onExportOpen={() => setExportModalOpen(true)}
                dark
              />
            </div>
            <SidebarFooter />
            <ExportModal open={exportModalOpen} onClose={() => setExportModalOpen(false)} />
          </motion.div>
        </>
      )}
    </AnimatePresence>
  )
}
