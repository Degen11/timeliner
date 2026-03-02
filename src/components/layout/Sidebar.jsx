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
  FileText,
  FileCode,
  Braces,
  Table,
  Link2,
  Printer,
  FileDown,
  HelpCircle,
} from 'lucide-react'
import useTimelineStore from '@/store/useTimelineStore'
import { TAG_COLORS, getTagColor } from '@/utils/constants'
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

// ─── Section heading ───────────────────────────────────────
function ZoneHeading({ icon: Icon, children, dark = false, count }) {
  return (
    <div className="flex items-center gap-1.5 mb-2 px-1">
      {Icon && <Icon size={12} className={dark ? 'text-sidebar-muted' : 'text-gray-400'} />}
      <span
        className={`text-[10px] font-semibold uppercase tracking-wider ${
          dark ? 'text-sidebar-heading' : 'text-gray-400'
        }`}
      >
        {children}
      </span>
      {count != null && (
        <span className="ml-auto inline-flex items-center justify-center min-w-[16px] h-[16px] rounded-full bg-secondary/20 text-secondary text-[9px] font-bold px-1">
          {count}
        </span>
      )}
    </div>
  )
}

// ─── Shared sidebar content (desktop + mobile drawer) ───

function SidebarContent({ photoCount, onPhotoLibOpen, onShowShortcuts, dark = false }) {
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

  // Build dynamic colorMap for all tags (built-in + custom)
  const tagColorMap = useMemo(() => {
    const map = { ...TAG_COLORS }
    for (const t of allTags) {
      if (!map[t]) map[t] = getTagColor(t)
    }
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
      // Brief shimmer delay before closing
      await new Promise((r) => setTimeout(r, 250))
      setExportingKey(null)
      setExportModalOpen(false)
    },
    [showToast]
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
          setExportModalOpen(false)
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
    [events, handleShare, handleExport]
  )

  return (
    <div className="flex flex-col h-full">
      <div className="flex-1 space-y-4">
        {/* ═══ TOP: Search ═══ */}
        <div className="px-1">
          <SearchInput value={filters.search} onChange={handleSearchChange} dark={dark} />
        </div>

        <ZoneDivider dark={dark} />

        {/* ═══ PRIMARY: Filters ═══ */}
        <div className="px-1">
          <ZoneHeading icon={SlidersHorizontal} dark={dark} count={activeFilterCount || null}>
            Filters
          </ZoneHeading>

          {(allPeople.length > 0 || allTags.length > 0) && (
            <div className="flex flex-wrap gap-1.5 mb-2">
              <MultiSelect
                label="People"
                options={allPeople}
                selected={filters.people}
                onChange={handlePeopleChange}
                dark={dark}
              />
              <MultiSelect
                label="Tags"
                options={allTags}
                selected={filters.tags}
                onChange={handleTagsChange}
                colorMap={tagColorMap}
                dark={dark}
              />
            </div>
          )}

          {/* Flagged dates — visually prominent */}
          {flaggedCount > 0 && (
            <button
              onClick={toggleReviewMode}
              className="flex items-center gap-2 w-full rounded-lg px-3 py-2 text-xs font-medium transition-all cursor-pointer bg-flag/10 border border-flag/20 text-flag hover:bg-flag/15"
            >
              <AlertTriangle size={13} />
              <span>
                {flaggedCount} flagged date{flaggedCount !== 1 ? 's' : ''}
              </span>
              <span className="ml-auto inline-flex items-center justify-center min-w-[18px] h-[18px] rounded-full bg-flag text-white text-[10px] font-bold px-1">
                {flaggedCount}
              </span>
            </button>
          )}

          {/* Active filter chips */}
          {hasActiveFilters && (
            <div className="mt-2">
              <div className="flex flex-wrap gap-1">
                {filters.people.map((p) => (
                  <Badge key={p} variant="accent" onRemove={() => handleRemovePerson(p)}>
                    {p}
                  </Badge>
                ))}
                {filters.tags.map((t) => (
                  <Badge key={t} variant={t} onRemove={() => handleRemoveTag(t)}>
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

        <ZoneDivider dark={dark} />

        {/* ═══ SECONDARY: Timeline Settings ═══ */}
        <div className="px-1">
          <ZoneHeading icon={Waypoints} dark={dark}>
            Timeline
          </ZoneHeading>
          <div className="space-y-2">
            <TimelineManager dark={dark} />
            <SortBar dark={dark} />
          </div>
        </div>

        <ZoneDivider dark={dark} />

        {/* ═══ CONTEXT: Photos ═══ */}
        <div className="px-1">
          <button
            onClick={onPhotoLibOpen}
            className={`flex items-center gap-2.5 w-full rounded-lg px-3 py-2 text-sm transition-all cursor-pointer ${
              dark ? 'text-sidebar-text hover:bg-sidebar-hover' : 'text-gray-600 hover:bg-gray-100'
            }`}
          >
            <Image size={15} className={dark ? 'text-sidebar-muted' : 'text-gray-400'} />
            <span>Photos</span>
            {photoCount > 0 && (
              <span className="ml-auto inline-flex items-center justify-center min-w-[20px] h-[20px] rounded-full bg-secondary/15 text-secondary text-[10px] font-bold px-1">
                {photoCount}
              </span>
            )}
          </button>
        </div>

        <ZoneDivider dark={dark} />

        {/* ═══ UTILITY: Export / Share ═══ */}
        <div className="px-1">
          <button
            onClick={() => setExportModalOpen(true)}
            className={`flex items-center gap-2.5 w-full rounded-lg px-3 py-2 text-sm transition-all cursor-pointer ${
              dark
                ? 'text-sidebar-muted hover:text-sidebar-text hover:bg-sidebar-hover'
                : 'text-gray-500 hover:text-gray-700 hover:bg-gray-100'
            }`}
          >
            <Download size={15} />
            <span>Export / Share</span>
          </button>
        </div>
      </div>

      {/* Export / Share Modal (stays light — it's a global modal) */}
      <AnimatedModal
        open={exportModalOpen}
        onClose={() => setExportModalOpen(false)}
        className="bg-white rounded-xl shadow-lg max-w-md w-full mx-4"
      >
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
            {exportItems.map(({ key, label, icon: Icon, iconColor, action }) => {
              // eslint-disable-line no-unused-vars -- Icon is used as JSX
              const isExporting = exportingKey === key
              return (
                <button
                  key={key}
                  onClick={action}
                  disabled={!!exportingKey}
                  className={`relative flex flex-col items-center gap-2 rounded-xl border border-gray-200 bg-gray-50 hover:bg-white hover:border-secondary/40 hover:shadow-sm px-4 py-4 text-sm text-gray-700 transition-all cursor-pointer overflow-hidden ${exportingKey && !isExporting ? 'opacity-50' : ''}`}
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

      {/* Help / Tips — pinned to bottom */}
      <div
        className={`pt-3 mt-2 border-t ${dark ? 'border-sidebar-border' : 'border-gray-200/60'}`}
      >
        <button
          onClick={onShowShortcuts}
          className={`flex items-center gap-2 w-full rounded-lg px-3 py-2 text-sm transition-all cursor-pointer ${
            dark
              ? 'text-sidebar-muted hover:text-sidebar-text hover:bg-sidebar-hover'
              : 'text-gray-400 hover:text-gray-600 hover:bg-white hover:shadow-sm border border-transparent hover:border-gray-100'
          }`}
        >
          <HelpCircle size={14} />
          Help & Shortcuts
        </button>
      </div>
    </div>
  )
}

// ─── Collapsed icon button ──────────────────────────────

function IconButton({ icon: Icon, label, onClick, badge, variant, dark = false }) {
  // eslint-disable-line no-unused-vars -- Icon is used as JSX
  const isFlagged = variant === 'flag'
  return (
    <button
      onClick={onClick}
      className={`relative rounded-lg p-2.5 transition-colors cursor-pointer ${
        isFlagged
          ? 'text-flag hover:bg-flag/10'
          : dark
            ? 'text-sidebar-muted hover:text-sidebar-text hover:bg-sidebar-hover'
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
  const activeFilterCount = (filters.search ? 1 : 0) + filters.people.length + filters.tags.length

  return (
    <aside
      className={`hidden lg:flex flex-col shrink-0 border-r border-sidebar-border bg-sidebar-bg sticky top-14 h-[calc(100vh-3.5rem)] transition-[width] duration-200 ease-in-out ${
        collapsed ? 'w-16' : 'w-[280px]'
      }`}
    >
      {/* Toggle header */}
      <div
        className={`flex items-center shrink-0 ${
          collapsed ? 'justify-center py-3' : 'justify-between px-4 py-3'
        }`}
      >
        {!collapsed && (
          <span className="text-[10px] font-semibold text-sidebar-heading uppercase tracking-wider">
            Controls
          </span>
        )}
        <button
          onClick={toggleSidebar}
          className="rounded-lg p-1.5 text-sidebar-muted hover:text-sidebar-text hover:bg-sidebar-hover transition-all cursor-pointer"
          title={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
        >
          {collapsed ? <PanelLeftOpen size={16} /> : <PanelLeftClose size={16} />}
        </button>
      </div>

      {collapsed ? (
        /* ─── Collapsed: icon-only ─── */
        <div className="flex flex-col items-center gap-1 py-3 flex-1">
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
          <div className="w-6 h-px bg-sidebar-border my-1" />
          <IconButton icon={Waypoints} label="Timelines" onClick={toggleSidebar} dark />
          <IconButton icon={ArrowUpDown} label="Sort" onClick={toggleSidebar} dark />
          {photoCount > 0 && (
            <IconButton
              icon={Image}
              label="Photos"
              onClick={onPhotoLibOpen}
              badge={photoCount}
              dark
            />
          )}
          <div className="w-6 h-px bg-sidebar-border my-1" />
          <IconButton icon={Download} label="Export / Share" onClick={toggleSidebar} dark />
          {/* Spacer to push help to bottom */}
          <div className="flex-1" />
          <div className="w-6 h-px bg-sidebar-border my-1" />
          <IconButton icon={HelpCircle} label="Help" onClick={onShowShortcuts} dark />
        </div>
      ) : (
        /* ─── Expanded: full controls ─── */
        <div className="flex-1 overflow-y-auto px-3 py-3">
          <SidebarContent
            photoCount={photoCount}
            onPhotoLibOpen={onPhotoLibOpen}
            onShowShortcuts={onShowShortcuts}
            dark
          />
        </div>
      )}
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
            className="fixed inset-y-0 left-0 z-40 w-full max-w-xs bg-sidebar-bg border-r border-sidebar-border shadow-2xl flex flex-col lg:hidden touch-pan-y"
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
            <div className="flex items-center justify-between border-b border-sidebar-border px-4 py-3 shrink-0">
              <h2 className="text-sm font-semibold text-sidebar-text">Controls</h2>
              <button
                onClick={onClose}
                className="rounded-lg p-1.5 text-sidebar-muted hover:text-sidebar-text hover:bg-sidebar-hover transition-colors cursor-pointer"
                aria-label="Close"
              >
                <X size={18} />
              </button>
            </div>
            <div className="flex-1 overflow-y-auto px-3 py-3">
              <SidebarContent
                photoCount={photoCount}
                onPhotoLibOpen={onPhotoLibOpen}
                onShowShortcuts={onShowShortcuts}
                dark
              />
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  )
}
