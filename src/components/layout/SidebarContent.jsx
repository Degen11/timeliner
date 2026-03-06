import { useMemo, useCallback } from 'react'
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
} from 'lucide-react'
import useTimelineStore from '@/store/useTimelineStore'
import { getAllPeople, getAllTags, getFlaggedEvents } from '@/store/selectors'
import SearchInput from '@/components/filters/SearchInput'
import MultiSelect from '@/components/filters/MultiSelect'
import Badge from '@/components/shared/Badge'
import TimelineManager from '@/components/timeline/TimelineManager'
import SortBar from '@/components/timeline/SortBar'

function ZoneHeading({ icon: Icon, children, dark = false, count, primary = false }) {
  return (
    <div className="flex items-center gap-2 mb-2 px-1">
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
        <span className="ml-auto inline-flex items-center justify-center min-w-[18px] h-[18px] rounded-full bg-secondary/20 text-secondary text-[11px] font-bold px-1">
          {count}
        </span>
      )}
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

  const allPeople = useMemo(() => getAllPeople(events), [events])
  const allTags = useMemo(() => getAllTags(events), [events])
  const flaggedCount = useMemo(() => getFlaggedEvents(events).length, [events])

  // All tags have palette colors, so always show color dots
  const showTagColors = allTags.length > 0

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

  const utilBtnClass = dark
    ? 'text-sidebar-text hover:bg-sidebar-hover active:bg-sidebar-active'
    : 'text-gray-600 hover:bg-gray-100 active:bg-gray-200/60'

  return (
    <div className="flex flex-col h-full">
      <div className="flex-1 space-y-1">
        <div className="px-1">
          <ZoneHeading icon={Waypoints} dark={dark} primary>
            Timeline
          </ZoneHeading>
          <div className="space-y-2">
            <TimelineManager dark={dark} />
            <SortBar dark={dark} />
          </div>
        </div>

        <div
          className={`mx-1 mt-3 rounded-xl px-3 py-3 space-y-2 ${
            dark ? 'bg-sidebar-surface border border-sidebar-border' : 'bg-gray-50/80'
          }`}
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
              showColors={showTagColors}
              dark={dark}
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
                className={`flex items-center gap-1 mt-2 text-[11px] cursor-pointer transition-colors ${
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

        {flaggedCount > 0 && (
          <div className="px-1 pt-2">
            <button
              onClick={toggleReviewMode}
              className="flex items-center gap-2 w-full rounded-xl px-3 py-2.5 text-xs font-semibold transition-colors cursor-pointer bg-flag/15 border border-flag/30 text-flag hover:bg-flag/20 active:bg-flag/25"
            >
              <AlertTriangle size={14} className="shrink-0" />
              <span>
                {flaggedCount} flagged date{flaggedCount !== 1 ? 's' : ''}
              </span>
              <span className="ml-auto inline-flex items-center justify-center min-w-[18px] h-[18px] rounded-full bg-flag text-white text-[11px] font-bold px-1">
                {flaggedCount}
              </span>
            </button>
          </div>
        )}

        <div className="px-1 pt-4 space-y-1">
          <button
            onClick={onPhotoLibOpen}
            className={`flex items-center gap-2.5 w-full rounded-lg px-3 py-2 text-sm transition-all cursor-pointer ${utilBtnClass}`}
          >
            <Image size={15} className={dark ? 'text-sidebar-muted' : 'text-gray-400'} />
            <span>Photos</span>
            {photoCount > 0 && (
              <span className="ml-auto inline-flex items-center justify-center min-w-[18px] h-[18px] rounded-full bg-secondary/15 text-secondary text-[11px] font-bold px-1">
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

      <div className="px-1 pt-4 mt-4 border-t border-sidebar-border space-y-1">
        <button
          onClick={toggleDarkMode}
          className={`flex items-center gap-2.5 w-full rounded-lg px-3 py-2 text-sm transition-all cursor-pointer ${utilBtnClass}`}
        >
          {darkMode
            ? <Sun size={15} className={dark ? 'text-sidebar-muted' : 'text-gray-400'} />
            : <Moon size={15} className={dark ? 'text-sidebar-muted' : 'text-gray-400'} />}
          <span>{darkMode ? 'Light Mode' : 'Dark Mode'}</span>
        </button>
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
