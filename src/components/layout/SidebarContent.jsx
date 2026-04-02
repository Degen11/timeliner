import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  SlidersHorizontal,
  AlertTriangle,
  Waypoints,
  Image,
  X,
  Download,
  HelpCircle,
  Moon,
  Sun,
  ChevronRight,
} from 'lucide-react'
import useTimelineStore from '@/store/useTimelineStore'
import { getAllPeople, getAllTags, getFlaggedEvents } from '@/store/selectors'
import { countByField } from '@/utils/ui'
import SearchInput from '@/components/filters/SearchInput'
import MultiSelect from '@/components/filters/MultiSelect'
import Badge from '@/components/shared/Badge'
import TimelineManager from '@/components/timeline/TimelineManager'
import SortBar from '@/components/timeline/SortBar'
import { SPRING } from '@/utils/constants'

const SIDEBAR_COLLAPSE_KEY = 'timeliner_sidebar_sections'

function readCollapsedSections() {
  try { return JSON.parse(localStorage.getItem(SIDEBAR_COLLAPSE_KEY)) || {} } catch { return {} }
}

function CollapsibleSection({ icon: Icon, title, dark = false, count, defaultOpen = true, children }) {
  const [open, setOpen] = useState(() => {
    const saved = readCollapsedSections()
    return title in saved ? saved[title] : defaultOpen
  })

  const handleToggle = () => {
    const next = !open
    setOpen(next)
    try {
      const saved = readCollapsedSections()
      saved[title] = next
      localStorage.setItem(SIDEBAR_COLLAPSE_KEY, JSON.stringify(saved))
    } catch { /* quota exceeded — non-critical */ }
  }

  return (
    <div>
      <button
        onClick={handleToggle}
        className={`flex items-center gap-2 w-full px-1 py-1.5 rounded-lg transition-colors duration-150 cursor-pointer ${
          dark ? 'hover:bg-sidebar-hover' : 'hover:bg-surface-raised'
        }`}
      >
        <motion.span
          animate={{ rotate: open ? 90 : 0 }}
          transition={{ duration: 0.2, ease: [0.16, 1, 0.3, 1] }}
          className="inline-flex"
        >
          <ChevronRight
            size={12}
            className={dark ? 'text-sidebar-muted shrink-0' : 'text-text-muted shrink-0'}
          />
        </motion.span>
        {Icon && (
          <Icon
            size={14}
            className={dark ? 'text-sidebar-muted shrink-0' : 'text-text-muted shrink-0'}
          />
        )}
        <span
          className={`text-xs font-bold uppercase tracking-wider ${
            dark ? 'text-sidebar-text' : 'text-text-muted'
          }`}
        >
          {title}
        </span>
        {count != null && (
          <span className="ml-auto inline-flex items-center justify-center min-w-[18px] h-[18px] rounded-full bg-secondary/20 text-secondary text-xs font-bold px-1">
            {count}
          </span>
        )}
      </button>
      <AnimatePresence initial={false}>
        {open && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
            className="overflow-hidden"
          >
            <div className="mt-1">{children}</div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

export default function SidebarContent({
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
  const darkMode = useTimelineStore((s) => s.darkMode)
  const toggleDarkMode = useTimelineStore((s) => s.toggleDarkMode)

  const allPeople = getAllPeople(events)
  const allTags = getAllTags(events)
  const flaggedCount = getFlaggedEvents(events).length

  const peopleCounts = countByField(events, 'people')
  const tagCounts = countByField(events, 'tags')

  const showTagColors = allTags.length > 0

  const hasActiveFilters = filters.search || filters.people.length > 0 || filters.tags.length > 0
  const activeFilterCount = (filters.search ? 1 : 0) + filters.people.length + filters.tags.length

  const handleSearchChange = (search) => {
    const current = useTimelineStore.getState().filters
    setFilters({ ...current, search })
  }

  const handlePeopleChange = (people) => {
    const current = useTimelineStore.getState().filters
    setFilters({ ...current, people })
  }

  const handleTagsChange = (tags) => {
    const current = useTimelineStore.getState().filters
    setFilters({ ...current, tags })
  }

  const handleRemovePerson = (p) => {
    const current = useTimelineStore.getState().filters
    setFilters({ ...current, people: current.people.filter((x) => x !== p) })
  }

  const handleRemoveTag = (t) => {
    const current = useTimelineStore.getState().filters
    setFilters({ ...current, tags: current.tags.filter((x) => x !== t) })
  }

  const utilBtnClass = dark
    ? 'text-sidebar-text hover:bg-sidebar-hover active:bg-sidebar-active'
    : 'text-text-default hover:bg-surface-raised active:bg-gray-200'

  const iconClass = dark ? 'text-sidebar-muted' : 'text-text-muted'

  return (
    <div className="flex flex-col h-full overflow-y-auto overflow-x-hidden sidebar-scroll">
      <div className="flex-1 space-y-2">
        <CollapsibleSection icon={Waypoints} title="Timeline" dark={dark} defaultOpen>
          <div className="space-y-2 px-1">
            <TimelineManager dark={dark} />
            <SortBar dark={dark} />
          </div>
        </CollapsibleSection>

        <CollapsibleSection
          icon={SlidersHorizontal}
          title="Filters"
          dark={dark}
          count={activeFilterCount || null}
          defaultOpen
        >
          <div
            className={`mx-1 rounded-xl px-3 py-3 space-y-2 ${
              dark ? 'bg-sidebar-surface border border-sidebar-border' : 'bg-gray-50/80'
            }`}
          >
            <SearchInput value={filters.search} onChange={handleSearchChange} dark={dark} />

            {allPeople.length > 0 && (
              <MultiSelect
                label="People"
                options={allPeople}
                selected={filters.people}
                onChange={handlePeopleChange}
                dark={dark}
                counts={peopleCounts}
              />
            )}
            {allTags.length > 0 && (
              <MultiSelect
                label="Tags"
                options={allTags}
                selected={filters.tags}
                onChange={handleTagsChange}
                showColors={showTagColors}
                dark={dark}
                counts={tagCounts}
              />
            )}

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
                  className={`flex items-center gap-1 mt-2 text-xs cursor-pointer transition-colors duration-150 ${
                    dark
                      ? 'text-sidebar-muted hover:text-sidebar-text'
                      : 'text-text-muted hover:text-text-default'
                  }`}
                >
                  <X size={12} />
                  Clear all
                </button>
              </div>
            )}
          </div>
        </CollapsibleSection>

        {flaggedCount > 0 && (
          <div className="px-1">
            <button
              onClick={toggleReviewMode}
              className="flex items-center gap-2 w-full rounded-lg px-3 py-2 text-xs font-semibold transition-colors duration-150 cursor-pointer bg-flag/15 border border-flag/30 text-flag hover:bg-flag/20 active:bg-flag/25"
            >
              <AlertTriangle size={14} className="shrink-0" />
              <span>
                {flaggedCount} flagged date{flaggedCount !== 1 ? 's' : ''}
              </span>
              <span className="ml-auto inline-flex items-center justify-center min-w-[18px] h-[18px] rounded-full bg-flag text-white text-xs font-bold px-1">
                {flaggedCount}
              </span>
            </button>
          </div>
        )}

        <CollapsibleSection icon={null} title="Tools" dark={dark} defaultOpen>
          <div className="px-1 space-y-0.5">
            <button
              onClick={onPhotoLibOpen}
              className={`flex items-center gap-2.5 w-full rounded-lg px-3 py-2 text-sm transition-colors duration-150 cursor-pointer ${utilBtnClass}`}
            >
              <Image size={14} className={iconClass} />
              <span>Photos</span>
              {photoCount > 0 && (
                <span className="ml-auto inline-flex items-center justify-center min-w-[18px] h-[18px] rounded-full bg-secondary/15 text-secondary text-xs font-bold px-1">
                  {photoCount}
                </span>
              )}
            </button>

            <button
              onClick={onExportOpen}
              className={`flex items-center gap-2.5 w-full rounded-lg px-3 py-2 text-sm transition-colors duration-150 cursor-pointer ${utilBtnClass}`}
            >
              <Download size={14} className={iconClass} />
              <span>Export / Share</span>
            </button>

            <button
              onClick={toggleDarkMode}
              className={`flex items-center gap-2.5 w-full rounded-lg px-3 py-2 text-sm transition-colors duration-150 cursor-pointer ${utilBtnClass}`}
            >
              <AnimatePresence mode="wait" initial={false}>
                <motion.span
                  key={darkMode ? 'sun' : 'moon'}
                  initial={{ rotate: -90, opacity: 0, scale: 0.8 }}
                  animate={{ rotate: 0, opacity: 1, scale: 1 }}
                  exit={{ rotate: 90, opacity: 0, scale: 0.8 }}
                  transition={SPRING.SNAPPY}
                  className="inline-flex"
                >
                  {darkMode ? <Sun size={14} className={iconClass} /> : <Moon size={14} className={iconClass} />}
                </motion.span>
              </AnimatePresence>
              <span>{darkMode ? 'Light Mode' : 'Dark Mode'}</span>
            </button>

            <button
              onClick={onShowShortcuts}
              className={`flex items-center gap-2.5 w-full rounded-lg px-3 py-2 text-sm transition-colors duration-150 cursor-pointer ${utilBtnClass}`}
            >
              <HelpCircle size={14} className={iconClass} />
              <span>Help & Shortcuts</span>
            </button>
          </div>
        </CollapsibleSection>
      </div>
    </div>
  )
}
