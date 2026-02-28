import { useState, useMemo, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion' // eslint-disable-line no-unused-vars -- motion is used as JSX motion.div
import {
  Search,
  SlidersHorizontal,
  AlertTriangle,
  Waypoints,
  ArrowUpDown,
  Image,
  PanelLeftClose,
  PanelLeftOpen,
  X,
  Download,
  Share2,
  FileText,
  FileCode,
  Braces,
  Table,
  Link2,
  Printer,
  HelpCircle,
  ChevronDown,
} from 'lucide-react'
import useTimelineStore from '@/store/useTimelineStore'
import { getAllPeople, getAllTags, getFlaggedEvents } from '@/store/selectors'
import { exportJSON, exportCSV, exportPlainText, exportMarkdown, printTimeline } from '@/utils/exportHelpers'
import { encodeTimeline } from '@/utils/shareEncoder'
import SearchInput from '@/components/filters/SearchInput'
import MultiSelect from '@/components/filters/MultiSelect'
import Badge from '@/components/shared/Badge'
import AnimatedModal from '@/components/shared/AnimatedModal'
import TimelineManager from '@/components/timeline/TimelineManager'
import SortBar from '@/components/timeline/SortBar'

// ─── Collapsible section ─────────────────────────────────

function CollapsibleSection({ label, icon: Icon, defaultOpen = false, children }) {
  const [open, setOpen] = useState(defaultOpen)
  return (
    <div>
      <button
        onClick={() => setOpen(!open)}
        className="flex items-center justify-between w-full group cursor-pointer"
      >
        <div className="flex items-center gap-1.5">
          {Icon && <Icon size={12} className="text-secondary" />}
          <span className="text-[11px] font-medium text-secondary uppercase tracking-wider">
            {label}
          </span>
        </div>
        <ChevronDown
          size={12}
          className={`text-gray-300 group-hover:text-gray-500 transition-transform duration-200 ${open ? 'rotate-180' : ''}`}
        />
      </button>
      {open && <div className="mt-2">{children}</div>}
    </div>
  )
}

// ─── Shared sidebar content (desktop + mobile drawer) ───

function SidebarContent({ photoCount, onPhotoLibOpen, onShowShortcuts }) {
  const events = useTimelineStore((s) => s.events)
  const filters = useTimelineStore((s) => s.filters)
  const setFilters = useTimelineStore((s) => s.setFilters)
  const clearFilters = useTimelineStore((s) => s.clearFilters)
  const toggleReviewMode = useTimelineStore((s) => s.toggleReviewMode)
  const [exportModalOpen, setExportModalOpen] = useState(false)
  const showToast = useTimelineStore((s) => s.showToast)

  const allPeople = useMemo(() => getAllPeople(events), [events])
  const allTags = useMemo(() => getAllTags(events), [events])
  const flaggedCount = useMemo(() => getFlaggedEvents(events).length, [events])

  const hasActiveFilters =
    filters.search || filters.people.length > 0 || filters.tags.length > 0

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

  // ─── Export handlers ───
  const handleShare = useCallback(async () => {
    const { url, tooLarge } = encodeTimeline(events)
    if (tooLarge) {
      showToast('Timeline too large for URL. Use file export instead.')
      setExportModalOpen(false)
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
    setExportModalOpen(false)
  }, [events, showToast])

  const exportItems = useMemo(() => [
    { label: 'Copy share link', icon: Link2, iconColor: 'text-secondary', action: handleShare },
    { label: 'Plain text', icon: FileText, iconColor: 'text-gray-500', action: () => { exportPlainText(events); setExportModalOpen(false) } },
    { label: 'CSV', icon: Table, iconColor: 'text-emerald-600', action: () => { exportCSV(events); setExportModalOpen(false) } },
    { label: 'Markdown', icon: FileCode, iconColor: 'text-violet-600', action: () => { exportMarkdown(events); setExportModalOpen(false) } },
    { label: 'JSON', icon: Braces, iconColor: 'text-highlight', action: () => { exportJSON(events); setExportModalOpen(false) } },
    { label: 'Print / PDF', icon: Printer, iconColor: 'text-primary', action: () => { printTimeline(events); setExportModalOpen(false) } },
  ], [events, handleShare])

  return (
    <div className="flex flex-col h-full">
      <div className="flex-1 space-y-5">
        {/* Search */}
        <div>
          <SectionLabel>Search</SectionLabel>
          <SearchInput value={filters.search} onChange={handleSearchChange} />
        </div>

        {/* Filters */}
        <div>
          <SectionLabel>Filters</SectionLabel>
          <div className="space-y-2">
            <MultiSelect
              label="People"
              options={allPeople}
              selected={filters.people}
              onChange={handlePeopleChange}
            />
            <MultiSelect
              label="Tags"
              options={allTags}
              selected={filters.tags}
              onChange={handleTagsChange}
            />
            {flaggedCount > 0 && (
              <button
                onClick={toggleReviewMode}
                className="flex items-center gap-1.5 rounded-lg border border-flag/30 bg-flag-light px-3 py-1.5 text-xs font-medium text-flag hover:bg-flag-light/80 transition-all cursor-pointer"
              >
                <AlertTriangle size={12} />
                {flaggedCount} flagged
              </button>
            )}
          </div>

          {/* Active filter badges */}
          {hasActiveFilters && (
            <div className="mt-3 space-y-2">
              <div className="flex flex-wrap gap-1.5">
                {filters.people.map((p) => (
                  <Badge key={p} variant="accent" onRemove={() => handleRemovePerson(p)}>
                    {p}
                  </Badge>
                ))}
                {filters.tags.map((t) => (
                  <Badge key={t} onRemove={() => handleRemoveTag(t)}>
                    {t}
                  </Badge>
                ))}
              </div>
              <button
                onClick={clearFilters}
                className="flex items-center gap-1 text-xs text-gray-500 hover:text-gray-700 cursor-pointer"
              >
                <X size={12} />
                Clear all
              </button>
            </div>
          )}
        </div>

        <div className="h-px bg-gray-200" />

        {/* Timeline management */}
        <div>
          <SectionLabel>Timeline</SectionLabel>
          <div className="space-y-2">
            <TimelineManager />
            <SortBar />
          </div>
        </div>

        <div className="h-px bg-gray-200" />

        {/* Photos */}
        {photoCount > 0 && (
          <>
            <div>
              <SectionLabel>Photos</SectionLabel>
              <button
                onClick={onPhotoLibOpen}
                className="flex items-center gap-1.5 rounded-lg border border-gray-200 bg-white px-3 py-1.5 text-sm text-gray-700 hover:border-gray-300 hover:shadow-sm transition-all cursor-pointer"
                title="Photo library"
              >
                <Image size={14} />
                Photo Library
                <span className="ml-auto inline-flex items-center justify-center min-w-[18px] h-[18px] rounded-full bg-soft-accent text-secondary text-[10px] font-semibold px-1">
                  {photoCount}
                </span>
              </button>
            </div>
            <div className="h-px bg-gray-200" />
          </>
        )}

        {/* Export / Share */}
        <div>
          <SectionLabel>Export / Share</SectionLabel>
          <button
            onClick={() => setExportModalOpen(true)}
            className="flex items-center gap-1.5 rounded-lg border border-gray-200 bg-white px-3 py-1.5 text-sm text-gray-700 hover:border-gray-300 hover:shadow-sm transition-all cursor-pointer w-full"
          >
            <Share2 size={14} />
            Share / Export
          </button>
        </div>

      </div>

      {/* Export / Share Modal */}
      <AnimatedModal open={exportModalOpen} onClose={() => setExportModalOpen(false)} className="bg-white rounded-xl shadow-2xl max-w-md w-full mx-4">
        <div className="flex items-center justify-between p-5 border-b border-gray-100">
          <h2 className="font-display text-lg font-semibold text-gray-900">Share & Export</h2>
          <button
            onClick={() => setExportModalOpen(false)}
            className="rounded-lg p-1.5 text-gray-400 hover:text-gray-700 hover:bg-gray-100 transition-colors cursor-pointer"
            aria-label="Close"
          >
            <X size={18} />
          </button>
        </div>
        <div className="p-5">
          <div className="grid grid-cols-2 gap-2">
            {exportItems.map(({ label, icon: Icon, iconColor, action }) => (
              <button
                key={label}
                onClick={action}
                className="flex flex-col items-center gap-2 rounded-xl border border-gray-200 bg-gray-50 hover:bg-white hover:border-secondary/40 hover:shadow-sm px-4 py-4 text-sm text-gray-700 transition-all cursor-pointer"
              >
                <Icon size={20} className={iconColor} />
                <span className="text-xs font-medium">{label}</span>
              </button>
            ))}
          </div>
        </div>
      </AnimatedModal>

      {/* Help / Tips — pinned to bottom */}
      <div className="pt-4 mt-4 border-t border-gray-200">
        <button
          onClick={onShowShortcuts}
          className="flex items-center gap-2 w-full rounded-lg px-2 py-1.5 text-sm text-gray-500 hover:text-gray-700 hover:bg-gray-50 transition-colors cursor-pointer"
        >
          <HelpCircle size={14} />
          Help & Keyboard Shortcuts
        </button>
      </div>
    </div>
  )
}

function SectionLabel({ children }) {
  return (
    <div className="text-[11px] font-medium text-secondary uppercase tracking-wider mb-2">
      {children}
    </div>
  )
}

// ─── Collapsed icon button ──────────────────────────────

function IconButton({ icon: Icon, label, onClick, badge, variant }) {
  const isFlagged = variant === 'flag'
  return (
    <button
      onClick={onClick}
      className={`relative rounded-lg p-2.5 transition-colors cursor-pointer ${
        isFlagged
          ? 'text-flag hover:bg-flag-light'
          : 'text-gray-400 hover:text-gray-700 hover:bg-gray-100'
      }`}
      title={label}
    >
      <Icon size={18} />
      {badge != null && (
        <span
          className={`absolute -top-0.5 -right-0.5 inline-flex items-center justify-center min-w-[16px] h-[16px] rounded-full text-[9px] font-bold px-0.5 ${
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
  const activeFilterCount =
    (filters.search ? 1 : 0) + filters.people.length + filters.tags.length

  return (
    <aside
      className={`hidden lg:flex flex-col shrink-0 border-r border-gray-200 bg-white sticky top-14 h-[calc(100vh-3.5rem)] transition-[width] duration-200 ease-in-out ${
        collapsed ? 'w-16' : 'w-[280px]'
      }`}
    >
      {/* Toggle header */}
      <div
        className={`flex items-center border-b border-gray-100 shrink-0 ${
          collapsed ? 'justify-center py-3' : 'justify-between px-4 py-3'
        }`}
      >
        {!collapsed && (
          <span className="text-xs font-medium text-gray-500 uppercase tracking-wider">
            Controls
          </span>
        )}
        <button
          onClick={toggleSidebar}
          className="rounded-lg p-1.5 text-gray-400 hover:text-gray-700 hover:bg-gray-100 transition-colors cursor-pointer"
          title={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
        >
          {collapsed ? <PanelLeftOpen size={16} /> : <PanelLeftClose size={16} />}
        </button>
      </div>

      {collapsed ? (
        /* ─── Collapsed: icon-only ─── */
        <div className="flex flex-col items-center gap-1 py-3 flex-1">
          <IconButton icon={Search} label="Search" onClick={toggleSidebar} />
          <IconButton
            icon={SlidersHorizontal}
            label="Filters"
            onClick={toggleSidebar}
            badge={activeFilterCount || null}
          />
          {flaggedCount > 0 && (
            <IconButton
              icon={AlertTriangle}
              label="Flagged review"
              onClick={toggleReviewMode}
              badge={flaggedCount}
              variant="flag"
            />
          )}
          <div className="w-6 h-px bg-gray-200 my-1" />
          <IconButton icon={Waypoints} label="Timelines" onClick={toggleSidebar} />
          <IconButton icon={ArrowUpDown} label="Sort" onClick={toggleSidebar} />
          {photoCount > 0 && (
            <IconButton
              icon={Image}
              label="Photos"
              onClick={onPhotoLibOpen}
              badge={photoCount}
            />
          )}
          <div className="w-6 h-px bg-gray-200 my-1" />
          <IconButton icon={Download} label="Export / Share" onClick={toggleSidebar} />
          {/* Spacer to push help to bottom */}
          <div className="flex-1" />
          <div className="w-6 h-px bg-gray-200 my-1" />
          <IconButton icon={HelpCircle} label="Help" onClick={onShowShortcuts} />
        </div>
      ) : (
        /* ─── Expanded: full controls ─── */
        <div className="flex-1 overflow-y-auto px-4 py-4">
          <SidebarContent photoCount={photoCount} onPhotoLibOpen={onPhotoLibOpen} onShowShortcuts={onShowShortcuts} />
        </div>
      )}
    </aside>
  )
}

// ─── Mobile slide-over drawer ───────────────────────────

const backdropVariants = {
  hidden: { opacity: 0 },
  visible: { opacity: 0.2 },
}

const drawerVariants = {
  hidden: { x: '-100%' },
  visible: { x: 0 },
  exit: { x: '-100%' },
}

export function SidebarDrawer({ open, onClose, photoCount, onPhotoLibOpen, onShowShortcuts }) {
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
            className="fixed inset-y-0 left-0 z-40 w-full max-w-xs bg-white border-r border-gray-200 shadow-lg flex flex-col lg:hidden"
            variants={drawerVariants}
            initial="hidden"
            animate="visible"
            exit="exit"
            transition={{ type: 'spring', duration: 0.4, bounce: 0.1 }}
          >
            <div className="flex items-center justify-between border-b border-gray-200 px-4 py-3 shrink-0">
              <h2 className="text-sm font-semibold text-gray-900">
                Filters & Actions
              </h2>
              <button
                onClick={onClose}
                className="rounded-lg p-1.5 text-gray-400 hover:text-gray-700 hover:bg-gray-100 transition-colors cursor-pointer"
                aria-label="Close"
              >
                <X size={18} />
              </button>
            </div>
            <div className="flex-1 overflow-y-auto px-4 py-4">
              <SidebarContent photoCount={photoCount} onPhotoLibOpen={onPhotoLibOpen} onShowShortcuts={onShowShortcuts} />
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  )
}
