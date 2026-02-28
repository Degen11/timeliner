import { useMemo, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion' // eslint-disable-line no-unused-vars -- motion is used as JSX motion.div
import {
  Search,
  SlidersHorizontal,
  AlertTriangle,
  FolderOpen,
  ArrowUpDown,
  Image,
  PanelLeftClose,
  PanelLeftOpen,
  X,
  MoreHorizontal,
} from 'lucide-react'
import useTimelineStore from '@/store/useTimelineStore'
import { getAllPeople, getAllTags, getFlaggedEvents } from '@/store/selectors'
import SearchInput from '@/components/filters/SearchInput'
import MultiSelect from '@/components/filters/MultiSelect'
import Badge from '@/components/shared/Badge'
import TimelineManager from '@/components/timeline/TimelineManager'
import SortBar from '@/components/timeline/SortBar'
import MoreActionsMenu from '@/components/timeline/MoreActionsMenu'

// ─── Shared sidebar content (desktop + mobile drawer) ───

function SidebarContent({ photoCount, onPhotoLibOpen }) {
  const events = useTimelineStore((s) => s.events)
  const filters = useTimelineStore((s) => s.filters)
  const setFilters = useTimelineStore((s) => s.setFilters)
  const clearFilters = useTimelineStore((s) => s.clearFilters)
  const toggleReviewMode = useTimelineStore((s) => s.toggleReviewMode)

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

  return (
    <div className="space-y-5">
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
              className="flex items-center gap-1 text-xs text-gray-400 hover:text-gray-600 cursor-pointer"
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

      {/* Actions */}
      <div>
        <SectionLabel>Actions</SectionLabel>
        <div className="flex items-center gap-2">
          <MoreActionsMenu />
          {photoCount > 0 && (
            <button
              onClick={onPhotoLibOpen}
              className="flex items-center gap-1.5 rounded-lg border border-gray-200 bg-white px-3 py-1.5 text-sm text-gray-700 hover:border-gray-300 hover:shadow-sm transition-all cursor-pointer"
              title="Photo library"
            >
              <Image size={14} />
              Photos
              <span className="ml-0.5 inline-flex items-center justify-center min-w-[18px] h-[18px] rounded-full bg-soft-accent text-secondary text-[10px] font-semibold px-1">
                {photoCount}
              </span>
            </button>
          )}
        </div>
      </div>
    </div>
  )
}

function SectionLabel({ children }) {
  return (
    <div className="text-[11px] font-medium text-gray-400 uppercase tracking-wider mb-2">
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

export default function Sidebar({ photoCount, onPhotoLibOpen }) {
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
          <span className="text-xs font-medium text-gray-400 uppercase tracking-wider">
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
        <div className="flex flex-col items-center gap-1 py-3">
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
          <IconButton icon={FolderOpen} label="Projects" onClick={toggleSidebar} />
          <IconButton icon={ArrowUpDown} label="Sort" onClick={toggleSidebar} />
          <IconButton icon={MoreHorizontal} label="Actions" onClick={toggleSidebar} />
          {photoCount > 0 && (
            <>
              <div className="w-6 h-px bg-gray-200 my-1" />
              <IconButton
                icon={Image}
                label="Photos"
                onClick={onPhotoLibOpen}
                badge={photoCount}
              />
            </>
          )}
        </div>
      ) : (
        /* ─── Expanded: full controls ─── */
        <div className="flex-1 overflow-y-auto px-4 py-4">
          <SidebarContent photoCount={photoCount} onPhotoLibOpen={onPhotoLibOpen} />
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

export function SidebarDrawer({ open, onClose, photoCount, onPhotoLibOpen }) {
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
              <SidebarContent photoCount={photoCount} onPhotoLibOpen={onPhotoLibOpen} />
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  )
}
