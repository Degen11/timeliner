import { useState, useEffect, useRef } from 'react'
import { Link } from 'react-router-dom'
import {
  List,
  GripHorizontal,
  LayoutGrid,
  MapPin,
  GitBranch,
  Plus,
  SlidersHorizontal,
  Undo2,
  Redo2,
  Type,
  ImagePlus,
  BarChart3,
  Sparkles,
  Pencil,
  Check,
  X,
  ChevronDown,
  MoreHorizontal,
  CopyCheck,
} from 'lucide-react'
import useTimelineStore from '@/store/useTimelineStore'
import { VIEWS } from '@/utils/constants'
import { getFilteredEvents, getYearSpan } from '@/store/selectors'
import { Button } from '@/components/ui/Button'
import { Tooltip } from '@/components/ui/Tooltip'
import { DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuRadioGroup, DropdownMenuRadioItem, DropdownMenuSeparator } from '@/components/ui/DropdownMenu'
import AnimatedCount from '@/components/shared/AnimatedCount'
import ImportMenu from './ImportMenu'
import StatsModal from './StatsModal'
import DuplicatesModal from './DuplicatesModal'
import { SaveStatus } from '@/components/layout/Header'
import { LogoIcon } from '@/components/layout/Logo'
import SearchInput from '@/components/filters/SearchInput'
import TimelineManager from './TimelineManager'

const VIEW_ICONS = {
  [VIEWS.VERTICAL]: <List size={16} />,
  [VIEWS.HORIZONTAL]: <GripHorizontal size={16} />,
  [VIEWS.GRID]: <LayoutGrid size={16} />,
  [VIEWS.MAP]: <MapPin size={16} />,
  [VIEWS.GRAPH]: <GitBranch size={16} />,
}

const VIEW_MENU = [
  {
    section: 'Vertical',
    items: [
      { label: 'Classic', triggerLabel: 'Vertical', view: VIEWS.VERTICAL, design: 'classic', compact: false, shortcut: '1' },
      { label: 'Compact', triggerLabel: 'Compact', view: VIEWS.VERTICAL, design: 'classic', compact: true },
      { label: 'Cinematic', view: VIEWS.VERTICAL, design: 'cinematic' },
      { label: 'Magazine', view: VIEWS.VERTICAL, design: 'magazine' },
      { label: 'Narrative', view: VIEWS.VERTICAL, design: 'narrative' },
    ],
  },
  {
    section: 'Horizontal',
    items: [
      { label: 'Classic', triggerLabel: 'Horizontal', view: VIEWS.HORIZONTAL, design: 'classic', shortcut: '2' },
      { label: 'Panoramic', view: VIEWS.HORIZONTAL, design: 'panoramic' },
      { label: 'Film Strip', view: VIEWS.HORIZONTAL, design: 'filmstrip' },
      { label: 'Wave', view: VIEWS.HORIZONTAL, design: 'wave' },
    ],
  },
  {
    section: 'Other',
    items: [
      { label: 'Grid', view: VIEWS.GRID, shortcut: '3' },
      { label: 'Map', view: VIEWS.MAP, shortcut: '4' },
      { label: 'Graph', view: VIEWS.GRAPH, shortcut: '5' },
    ],
  },
]

// Tiny shape-preview thumbnails for the view picker — sells the layout before
// you click it, rather than relying on the name alone. Keyed the same way as
// each row (`${view}-${design}-${compact}`), neutral grays only, so 12 of
// them sitting in a dense 3-column menu don't turn into visual noise.
const VIEW_THUMBS = {
  [`${VIEWS.VERTICAL}-classic-false`]: (
    <svg width="20" height="14" viewBox="0 0 20 14" aria-hidden="true">
      <line x1="3" y1="0" x2="3" y2="14" stroke="#a3a3a3" strokeWidth="1.4" />
      <circle cx="3" cy="2.5" r="1.4" fill="#525252" /><rect x="6" y="1.6" width="12" height="1.8" rx="0.9" fill="#d4d4d4" />
      <circle cx="3" cy="7" r="1.4" fill="#525252" /><rect x="6" y="6.1" width="9" height="1.8" rx="0.9" fill="#d4d4d4" />
      <circle cx="3" cy="11.5" r="1.4" fill="#525252" /><rect x="6" y="10.6" width="10.5" height="1.8" rx="0.9" fill="#d4d4d4" />
    </svg>
  ),
  [`${VIEWS.VERTICAL}-classic-true`]: (
    <svg width="20" height="14" viewBox="0 0 20 14" aria-hidden="true">
      <line x1="3" y1="0" x2="3" y2="14" stroke="#a3a3a3" strokeWidth="1.4" />
      {[1.6, 4.6, 7.6, 10.6, 13].map((y, i) => (
        <g key={i}>
          <circle cx="3" cy={y} r="1" fill="#525252" />
          <rect x="6" y={y - 0.6} width="12" height="1.2" rx="0.6" fill="#d4d4d4" />
        </g>
      ))}
    </svg>
  ),
  [`${VIEWS.VERTICAL}-cinematic-`]: (
    <svg width="20" height="14" viewBox="0 0 20 14" aria-hidden="true">
      <line x1="3" y1="0" x2="3" y2="14" stroke="#a3a3a3" strokeWidth="1.4" />
      <rect x="6" y="1" width="12" height="6" rx="1" fill="#e5e5e5" />
      <circle cx="3" cy="4" r="1.4" fill="#525252" />
      <rect x="6" y="10" width="10" height="1.8" rx="0.9" fill="#d4d4d4" />
      <circle cx="3" cy="11" r="1.4" fill="#525252" />
    </svg>
  ),
  [`${VIEWS.VERTICAL}-magazine-`]: (
    <svg width="20" height="14" viewBox="0 0 20 14" aria-hidden="true">
      <rect x="0.5" y="0.5" width="8" height="13" rx="1" fill="#e5e5e5" />
      <rect x="10.5" y="0.5" width="9" height="6" rx="1" fill="#d4d4d4" />
      <rect x="10.5" y="7.5" width="9" height="6" rx="1" fill="#d4d4d4" />
    </svg>
  ),
  [`${VIEWS.VERTICAL}-narrative-`]: (
    <svg width="20" height="14" viewBox="0 0 20 14" aria-hidden="true">
      <rect x="1" y="1.4" width="18" height="1.6" rx="0.8" fill="#d4d4d4" />
      <rect x="1" y="5" width="13" height="1.6" rx="0.8" fill="#d4d4d4" />
      <rect x="1" y="8.6" width="16" height="1.6" rx="0.8" fill="#d4d4d4" />
      <rect x="1" y="12.2" width="10" height="1.6" rx="0.8" fill="#e5e5e5" />
    </svg>
  ),
  [`${VIEWS.HORIZONTAL}-classic-`]: (
    <svg width="20" height="14" viewBox="0 0 20 14" aria-hidden="true">
      <line x1="0" y1="7" x2="20" y2="7" stroke="#a3a3a3" strokeWidth="1.4" />
      <circle cx="3" cy="7" r="1.6" fill="#525252" /><circle cx="10" cy="7" r="1.6" fill="#f97316" /><circle cx="17" cy="7" r="1.6" fill="#525252" />
    </svg>
  ),
  [`${VIEWS.HORIZONTAL}-panoramic-`]: (
    <svg width="20" height="14" viewBox="0 0 20 14" aria-hidden="true">
      <rect x="0.5" y="2.5" width="19" height="8" rx="1" fill="#e5e5e5" />
      <line x1="0.5" y1="10" x2="19.5" y2="10" stroke="#a3a3a3" strokeWidth="1" />
    </svg>
  ),
  [`${VIEWS.HORIZONTAL}-filmstrip-`]: (
    <svg width="20" height="14" viewBox="0 0 20 14" aria-hidden="true">
      <rect x="0.5" y="2" width="4" height="10" rx="0.6" fill="#d4d4d4" />
      <rect x="5.7" y="2" width="4" height="10" rx="0.6" fill="#e5e5e5" />
      <rect x="10.9" y="2" width="4" height="10" rx="0.6" fill="#d4d4d4" />
      <rect x="16.1" y="2" width="3.4" height="10" rx="0.6" fill="#e5e5e5" />
    </svg>
  ),
  [`${VIEWS.HORIZONTAL}-wave-`]: (
    <svg width="20" height="14" viewBox="0 0 20 14" aria-hidden="true">
      <path d="M0 9 Q5 2 10 9 T20 9" fill="none" stroke="#a3a3a3" strokeWidth="1.4" />
      <circle cx="5" cy="5.3" r="1.3" fill="#525252" /><circle cx="15" cy="5.3" r="1.3" fill="#525252" />
    </svg>
  ),
  [`${VIEWS.GRID}--`]: (
    <svg width="20" height="14" viewBox="0 0 20 14" aria-hidden="true">
      <rect x="0.5" y="0.5" width="8.5" height="6" rx="1" fill="#e5e5e5" /><rect x="10.5" y="0.5" width="9" height="6" rx="1" fill="#d4d4d4" />
      <rect x="0.5" y="7.5" width="8.5" height="6" rx="1" fill="#d4d4d4" /><rect x="10.5" y="7.5" width="9" height="6" rx="1" fill="#e5e5e5" />
    </svg>
  ),
  [`${VIEWS.MAP}--`]: (
    <svg width="20" height="14" viewBox="0 0 20 14" aria-hidden="true">
      <path d="M10 1c-3.3 0-5.5 2.4-5.5 5.4 0 4 5.5 7.6 5.5 7.6s5.5-3.6 5.5-7.6C15.5 3.4 13.3 1 10 1z" fill="#e5e5e5" />
      <circle cx="10" cy="6.4" r="1.8" fill="#525252" />
    </svg>
  ),
  [`${VIEWS.GRAPH}--`]: (
    <svg width="20" height="14" viewBox="0 0 20 14" aria-hidden="true">
      <line x1="4" y1="3.5" x2="16" y2="3.5" stroke="#a3a3a3" strokeWidth="1" />
      <line x1="4" y1="3.5" x2="10" y2="11" stroke="#a3a3a3" strokeWidth="1" />
      <line x1="16" y1="3.5" x2="10" y2="11" stroke="#a3a3a3" strokeWidth="1" />
      <circle cx="4" cy="3.5" r="1.8" fill="#525252" /><circle cx="16" cy="3.5" r="1.8" fill="#525252" /><circle cx="10" cy="11" r="1.8" fill="#f97316" />
    </svg>
  ),
}

function UndoRedoButtons() {
  const canUndo = useTimelineStore((s) => s.canUndo)
  const canRedo = useTimelineStore((s) => s.canRedo)
  const undo = useTimelineStore((s) => s.undo)
  const redo = useTimelineStore((s) => s.redo)
  const isMac = navigator.platform?.includes('Mac')

  return (
    <div className="hidden sm:flex items-center gap-0.5">
      <Tooltip label="Undo" shortcut={isMac ? '\u2318Z' : 'Ctrl+Z'}>
        <Button variant="ghost" size="icon" onClick={undo} disabled={!canUndo} aria-label="Undo">
          <Undo2 size={16} />
        </Button>
      </Tooltip>
      <Tooltip label="Redo" shortcut={isMac ? '\u2318\u21e7Z' : 'Ctrl+Shift+Z'}>
        <Button variant="ghost" size="icon" onClick={redo} disabled={!canRedo} aria-label="Redo">
          <Redo2 size={16} />
        </Button>
      </Tooltip>
    </div>
  )
}

function ViewSelector({ variant = 'segment' }) {
  const [open, setOpen] = useState(false)
  const activeView = useTimelineStore((s) => s.activeView)
  const setActiveView = useTimelineStore((s) => s.setActiveView)
  const verticalDesign = useTimelineStore((s) => s.verticalDesign)
  const setVerticalDesign = useTimelineStore((s) => s.setVerticalDesign)
  const horizontalDesign = useTimelineStore((s) => s.horizontalDesign)
  const setHorizontalDesign = useTimelineStore((s) => s.setHorizontalDesign)
  const verticalCompact = useTimelineStore((s) => s.verticalCompact)
  const setVerticalCompact = useTimelineStore((s) => s.setVerticalCompact)

  const isItemActive = (item) => {
    if (activeView !== item.view) return false
    if (item.view === VIEWS.VERTICAL) {
      const design = item.design || 'classic'
      if (design !== verticalDesign) return false
      if (design === 'classic' && item.compact !== undefined && item.compact !== verticalCompact) return false
    }
    if (item.view === VIEWS.HORIZONTAL) {
      const design = item.design || 'classic'
      if (design !== horizontalDesign) return false
    }
    return true
  }

  const selectItem = (item) => {
    setActiveView(item.view)
    if (item.view === VIEWS.VERTICAL && item.design) setVerticalDesign(item.design)
    if (item.view === VIEWS.HORIZONTAL && item.design) setHorizontalDesign(item.design)
    if (item.compact !== undefined) setVerticalCompact(item.compact)
    setOpen(false)
  }

  // Derive trigger label from currently active menu item
  let triggerLabel = 'View'
  for (const group of VIEW_MENU) {
    for (const item of group.items) {
      if (isItemActive(item)) {
        triggerLabel = item.triggerLabel || item.label
        break
      }
    }
  }

  const renderColumn = (group) => (
    <div className="flex flex-col">
      {group.section && (
        <span className="px-2.5 pt-1.5 pb-1 text-xs font-bold text-text-strong tracking-wide">
          {group.section}
        </span>
      )}
      {group.items.map((item) => {
        const active = isItemActive(item)
        const thumbKey = `${item.view}-${item.design || ''}-${item.compact ?? ''}`
        return (
          <button
            key={thumbKey}
            onClick={() => selectItem(item)}
            className={`flex items-center gap-2 rounded-lg px-2.5 py-1.5 text-sm cursor-pointer transition-colors duration-150 text-left ${
              active
                ? 'bg-surface-raised text-text-strong font-medium'
                : 'text-text-default hover:bg-surface-raised hover:text-text-strong'
            }`}
          >
            <span className="shrink-0 flex items-center justify-center w-7 h-5 rounded border border-gray-200/70 bg-surface overflow-hidden">
              {VIEW_THUMBS[thumbKey]}
            </span>
            <span className="flex-1 whitespace-nowrap">{item.label}</span>
            {item.shortcut && !active && (
              <kbd className="text-[10px] font-mono text-text-muted/60 ml-1">{item.shortcut}</kbd>
            )}
            {active && <Check size={14} className="shrink-0 text-text-muted" />}
          </button>
        )
      })}
    </div>
  )

  return (
    <DropdownMenu open={open} onOpenChange={setOpen}>
      <Tooltip label="Switch view" shortcut="1-5">
        <DropdownMenuTrigger asChild>
          {variant === 'icon' ? (
            <button
              aria-label={`Change view (${triggerLabel})`}
              className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border border-gray-200 bg-surface text-highlight transition-colors duration-150 cursor-pointer active:bg-surface-raised"
            >
              {VIEW_ICONS[activeView]}
            </button>
          ) : (
            <button className="flex h-full items-center gap-1.5 rounded-[9px] px-3 text-[13px] font-medium text-text-strong transition-colors duration-150 cursor-pointer hover:bg-surface-raised">
              <span className="text-highlight [&>svg]:h-[15px] [&>svg]:w-[15px]">{VIEW_ICONS[activeView]}</span>
              <span>{triggerLabel}</span>
              <ChevronDown size={12} className="text-text-muted" />
            </button>
          )}
        </DropdownMenuTrigger>
      </Tooltip>
      <DropdownMenuContent align={variant === 'icon' ? 'end' : 'start'} className="p-2 w-auto max-w-[calc(100vw-1.5rem)]">
        <div className="grid grid-cols-3 gap-px divide-x divide-gray-200">
          {VIEW_MENU.map((group, gi) => (
            <div key={gi} className={gi > 0 ? 'pl-2' : ''}>
              {renderColumn(group)}
            </div>
          ))}
        </div>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}

const GROUP_LABELS = { decade: 'Decade', year: 'Year', month: 'Month' }

function GroupBySelect() {
  const groupZoom = useTimelineStore((s) => s.groupZoom)
  const setGroupZoom = useTimelineStore((s) => s.setGroupZoom)

  return (
    <DropdownMenu>
      <Tooltip label="Group events by">
        <DropdownMenuTrigger asChild>
          <button
            aria-label={`Group by ${GROUP_LABELS[groupZoom].toLowerCase()}`}
            className="flex h-full items-center gap-1.5 rounded-[9px] px-3 text-[13px] text-text-default transition-colors duration-150 cursor-pointer hover:bg-surface-raised"
          >
            <span className="hidden lg:inline text-text-muted">Group</span>
            <span>{GROUP_LABELS[groupZoom]}</span>
            <ChevronDown size={12} className="text-text-muted" />
          </button>
        </DropdownMenuTrigger>
      </Tooltip>
      <DropdownMenuContent align="end" className="min-w-[160px]">
        <DropdownMenuLabel>Group by</DropdownMenuLabel>
        <DropdownMenuRadioGroup value={groupZoom} onValueChange={setGroupZoom}>
          {Object.entries(GROUP_LABELS).map(([value, label]) => (
            <DropdownMenuRadioItem key={value} value={value}>{label}</DropdownMenuRadioItem>
          ))}
        </DropdownMenuRadioGroup>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}

function AddSplitButton({ onAddEvent, onImportText, onPhotoLib }) {
  return (
    <div className="hidden sm:flex h-9 shrink-0 overflow-hidden rounded-[10px] bg-text-strong text-canvas shadow-sm">
      <Tooltip label="Add event" shortcut="N">
        <button
          onClick={onAddEvent}
          aria-label="Add event"
          className="flex items-center gap-1.5 px-3 text-[13px] font-semibold transition-colors duration-150 cursor-pointer hover:bg-white/10 dark:hover:bg-black/10"
        >
          <Plus size={15} strokeWidth={2.5} className="text-orange-400 dark:text-orange-600" />
          <span className="hidden lg:inline">Add event</span>
        </button>
      </Tooltip>
      <span className="my-2 w-px bg-white/20 dark:bg-black/15" aria-hidden="true" />
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <button
            aria-label="More ways to add: import text, photos, files"
            className="flex w-8 items-center justify-center transition-colors duration-150 cursor-pointer hover:bg-white/10 dark:hover:bg-black/10"
          >
            <ChevronDown size={14} />
          </button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="min-w-[200px]">
          <DropdownMenuItem onClick={onImportText}>
            <Type size={14} className="text-text-muted" />
            <span className="flex-1">Import text</span>
          </DropdownMenuItem>
          <DropdownMenuItem onClick={onPhotoLib}>
            <ImagePlus size={14} className="text-text-muted" />
            <span className="flex-1">Photo library</span>
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <ImportMenu compact={false} inline />
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  )
}

function DesktopToolsMenu({ onShowStats, onFindDuplicates }) {
  return (
    <div className="hidden sm:block">
      <DropdownMenu>
        <Tooltip label="More tools">
          <DropdownMenuTrigger asChild>
            <Button variant="secondary" size="icon" aria-label="More tools" className="sm:h-9 sm:w-9 rounded-[10px]">
              <MoreHorizontal size={16} />
            </Button>
          </DropdownMenuTrigger>
        </Tooltip>
        <DropdownMenuContent align="end" className="min-w-[180px]">
          <DropdownMenuItem onClick={onShowStats}>
            <BarChart3 size={14} className="text-text-muted" />
            <span className="flex-1">Stats</span>
          </DropdownMenuItem>
          <DropdownMenuItem onClick={onFindDuplicates}>
            <CopyCheck size={14} className="text-text-muted" />
            <span className="flex-1">Find duplicates</span>
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  )
}

function MoreMenu({ onOpenInsights, onShowStats, onFindDuplicates }) {
  const canUndo = useTimelineStore((s) => s.canUndo)
  const canRedo = useTimelineStore((s) => s.canRedo)
  const undo = useTimelineStore((s) => s.undo)
  const redo = useTimelineStore((s) => s.redo)
  const activeView = useTimelineStore((s) => s.activeView)
  const groupZoom = useTimelineStore((s) => s.groupZoom)
  const setGroupZoom = useTimelineStore((s) => s.setGroupZoom)

  // Group-by only applies to the grouped Vertical/Grid views. The desktop
  // control is hidden below sm:, so surface it here for mobile.
  const showGroupBy = activeView === VIEWS.VERTICAL || activeView === VIEWS.GRID

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon" aria-label="More actions" className="shrink-0 -mr-2">
          <MoreHorizontal size={18} />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="min-w-[180px]">
        <DropdownMenuItem onClick={onOpenInsights}>
          <Sparkles size={14} className="text-text-muted" />
          <span className="flex-1">Insights</span>
        </DropdownMenuItem>
        <DropdownMenuItem onClick={onShowStats}>
          <BarChart3 size={14} className="text-text-muted" />
          <span className="flex-1">Stats</span>
        </DropdownMenuItem>
        <DropdownMenuItem onClick={onFindDuplicates}>
          <CopyCheck size={14} className="text-text-muted" />
          <span className="flex-1">Find duplicates</span>
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem onClick={undo} disabled={!canUndo}>
          <Undo2 size={14} className="text-text-muted" />
          <span className="flex-1">Undo</span>
        </DropdownMenuItem>
        <DropdownMenuItem onClick={redo} disabled={!canRedo}>
          <Redo2 size={14} className="text-text-muted" />
          <span className="flex-1">Redo</span>
        </DropdownMenuItem>
        {showGroupBy && (
          <>
            <DropdownMenuSeparator />
            <DropdownMenuLabel>Group by</DropdownMenuLabel>
            <DropdownMenuRadioGroup value={groupZoom} onValueChange={setGroupZoom}>
              {Object.entries(GROUP_LABELS).map(([value, label]) => (
                <DropdownMenuRadioItem key={value} value={value}>{label}</DropdownMenuRadioItem>
              ))}
            </DropdownMenuRadioGroup>
          </>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  )
}

export default function ToolbarContent({
  setAddEventOpen,
  showImport,
  setShowImport,
  setPhotoLibOpen,
  setDrawerOpen,
  timelineName,
  onRenameTimeline,
  photoCount = 0,
  onOpenInsights,
}) {
  const events = useTimelineStore((s) => s.events)
  const activeView = useTimelineStore((s) => s.activeView)
  const filters = useTimelineStore((s) => s.filters)
  const setFilters = useTimelineStore((s) => s.setFilters)
  const filtered = getFilteredEvents(events, filters)
  const yearSpan = getYearSpan(events)
  const showGroupBy = activeView === VIEWS.VERTICAL || activeView === VIEWS.GRID
  // Search has its own field in the mobile header, so the drawer badge skips it
  const drawerFilterCount =
    filters.people.length + filters.tags.length + (filters.dateFrom || filters.dateTo ? 1 : 0)

  const [isRenaming, setIsRenaming] = useState(false)
  const [showStats, setShowStats] = useState(false)
  const [showDuplicates, setShowDuplicates] = useState(false)
  const [nameInput, setNameInput] = useState(timelineName)
  const nameInputRef = useRef(null)

  // Mirror the timeline name into the editable draft when it changes upstream
  // (rename elsewhere, timeline switch). Skip while the user is actively
  // renaming so a remote sync doesn't clobber their in-progress draft.
  const [prevTimelineName, setPrevTimelineName] = useState(timelineName)
  if (timelineName !== prevTimelineName) {
    setPrevTimelineName(timelineName)
    if (!isRenaming) setNameInput(timelineName)
  }

  useEffect(() => {
    if (isRenaming && nameInputRef.current) {
      nameInputRef.current.focus()
      nameInputRef.current.select()
    }
  }, [isRenaming])

  const renameContainerRef = useRef(null)

  const handleSaveName = () => {
    const trimmed = nameInput.trim()
    if (trimmed && trimmed !== timelineName) {
      onRenameTimeline(trimmed)
    } else {
      setNameInput(timelineName)
    }
    setIsRenaming(false)
  }

  const handleCancelRename = () => {
    setNameInput(timelineName)
    setIsRenaming(false)
  }

  const handleNameBlur = (e) => {
    if (renameContainerRef.current?.contains(e.relatedTarget)) return
    handleSaveName()
  }

  const handleNameKeyDown = (e) => {
    if (e.key === 'Enter') {
      e.preventDefault()
      handleSaveName()
    }
    if (e.key === 'Escape') handleCancelRename()
  }

  const handleSearchChange = (search) => {
    setFilters({ ...useTimelineStore.getState().filters, search })
  }

  const eventCountLabel = (
    <>
      <AnimatedCount value={filtered.length} />
      {filtered.length !== events.length && (
        <>
          {' '}of <AnimatedCount value={events.length} />
        </>
      )}{' '}
      event{events.length !== 1 ? 's' : ''}
    </>
  )
  const yearSpanLabel = yearSpan
    ? yearSpan.min === yearSpan.max
      ? String(yearSpan.min)
      : `${yearSpan.min}\u2013${yearSpan.max}`
    : null

  const metaLine = (
    <span className="flex items-center gap-1.5 text-xs text-text-muted min-w-0">
      <span className="whitespace-nowrap">{eventCountLabel}</span>
      {yearSpanLabel && (
        <>
          <span aria-hidden="true">·</span>
          <span className="whitespace-nowrap tabular-nums">{yearSpanLabel}</span>
        </>
      )}
      <SaveStatus />
    </span>
  )

  return (
    <div className="flex-1 min-w-0">
      {/* ── Mobile: name + menu, then search / filters / view ── */}
      <div className="sm:hidden flex flex-col gap-2 py-2">
        <div className="flex items-center gap-2.5">
          <Link to="/" aria-label="Home" className="shrink-0 text-text-strong no-underline">
            <LogoIcon size={28} />
          </Link>
          <TimelineManager>
            <button
              aria-label={`Switch timeline (current: ${timelineName})`}
              className="flex flex-1 min-w-0 flex-col items-start rounded-lg py-0.5 text-left cursor-pointer active:bg-surface-raised"
            >
              <span className="flex max-w-full items-center gap-1">
                <span className="truncate font-serif text-xl font-semibold leading-tight text-text-strong">
                  {timelineName}
                </span>
                <ChevronDown size={14} className="shrink-0 text-text-muted" aria-hidden="true" />
              </span>
              {metaLine}
            </button>
          </TimelineManager>
          <MoreMenu
            onOpenInsights={onOpenInsights}
            onShowStats={() => setShowStats(true)}
            onFindDuplicates={() => setShowDuplicates(true)}
          />
        </div>
        <div className="flex items-center gap-2">
          <div className="flex-1 min-w-0">
            <SearchInput
              value={filters.search}
              onChange={handleSearchChange}
              variant="outlined"
              placeholder={`Search ${events.length} event${events.length !== 1 ? 's' : ''}`}
              listenForFocusRequests={false}
            />
          </div>
          <button
            onClick={() => setDrawerOpen(true)}
            aria-label={drawerFilterCount > 0 ? `Filters (${drawerFilterCount} active)` : 'Filters'}
            className="relative flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border border-gray-200 bg-surface text-text-default transition-colors duration-150 cursor-pointer active:bg-surface-raised"
          >
            <SlidersHorizontal size={16} />
            {drawerFilterCount > 0 && (
              <span className="absolute -top-1 -right-1 inline-flex h-[18px] min-w-[18px] items-center justify-center rounded-full bg-text-strong px-1 text-[11px] font-semibold text-canvas">
                {drawerFilterCount}
              </span>
            )}
          </button>
          <ViewSelector variant="icon" />
        </div>
      </div>

      {/* ── Tablet / desktop ── */}
      <div className="hidden sm:flex items-center justify-between gap-3 min-h-16">
        <div className="flex flex-1 items-center gap-3 min-w-0">
          <Tooltip label="Filters">
            <button
              onClick={() => setDrawerOpen(true)}
              aria-label="Filters"
              className="lg:hidden flex items-center gap-1.5 rounded-lg border border-gray-200 px-2.5 py-1.5 text-sm text-text-default hover:bg-surface-raised active:bg-surface-raised transition-colors duration-150 cursor-pointer"
            >
              <SlidersHorizontal size={14} />
              <span className="hidden xl:inline">Filters</span>
            </button>
          </Tooltip>

          <div className="flex flex-1 min-w-0 flex-col items-start gap-0.5">
            {isRenaming ? (
              <div ref={renameContainerRef} className="flex items-center gap-1">
                <input
                  ref={nameInputRef}
                  value={nameInput}
                  onChange={(e) => setNameInput(e.target.value)}
                  onKeyDown={handleNameKeyDown}
                  onBlur={handleNameBlur}
                  aria-label="Timeline name"
                  className="font-serif text-lg font-semibold text-text-strong leading-tight bg-surface border border-secondary rounded-lg px-2 py-0.5 w-full max-w-[220px] lg:max-w-[320px] focus:outline-none focus:ring-2 focus:ring-secondary/15"
                />
                <button
                  onClick={handleSaveName}
                  aria-label="Save timeline name"
                  className="rounded-lg p-1 text-success hover:bg-green-50 active:bg-green-50 transition-colors duration-150 cursor-pointer"
                >
                  <Check size={14} className="pointer-events-none" />
                </button>
                <button
                  onClick={handleCancelRename}
                  aria-label="Cancel rename"
                  className="rounded-lg p-1 text-text-muted hover:text-error hover:bg-red-50 active:text-error active:bg-red-50 transition-colors duration-150 cursor-pointer"
                >
                  <X size={14} className="pointer-events-none" />
                </button>
              </div>
            ) : (
              <Tooltip label="Click to rename">
                <button
                  onClick={() => setIsRenaming(true)}
                  className="group flex items-center gap-1.5 cursor-pointer rounded-lg px-1 -mx-1 hover:bg-surface-raised active:bg-surface-raised transition-colors duration-150 max-w-full"
                  aria-label={`Rename timeline ${timelineName}`}
                >
                  <h1 className="font-serif text-lg lg:text-[22px] font-semibold text-text-strong leading-tight truncate">
                    {timelineName}
                  </h1>
                  <Pencil
                    size={12}
                    className="text-text-muted opacity-0 group-hover:opacity-100 group-focus-visible:opacity-100 transition-opacity duration-150 shrink-0"
                  />
                </button>
              </Tooltip>
            )}
            {metaLine}
          </div>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <div className="flex h-9 items-center rounded-[10px] border border-gray-200 bg-surface shadow-sm">
            <ViewSelector />
            {showGroupBy && (
              <>
                <span className="h-4 w-px bg-gray-200" aria-hidden="true" />
                <GroupBySelect />
              </>
            )}
          </div>

          <UndoRedoButtons />

          <Tooltip label="Insights" shortcut="I">
            <Button
              variant="secondary"
              size="sm"
              onClick={onOpenInsights}
              aria-label="Insights"
              className="sm:h-9 rounded-[10px] px-2.5 lg:px-3 text-[13px] text-text-strong"
            >
              <Sparkles size={15} className="text-highlight" />
              <span className="hidden lg:inline">Insights</span>
            </Button>
          </Tooltip>

          <DesktopToolsMenu
            onShowStats={() => setShowStats(true)}
            onFindDuplicates={() => setShowDuplicates(true)}
          />

          <AddSplitButton
            onAddEvent={() => setAddEventOpen(true)}
            onImportText={() => setShowImport(!showImport)}
            onPhotoLib={() => setPhotoLibOpen(true)}
          />
        </div>
      </div>

      <StatsModal
        open={showStats}
        onClose={() => setShowStats(false)}
        events={events}
        photoCount={photoCount}
      />

      <DuplicatesModal
        open={showDuplicates}
        onClose={() => setShowDuplicates(false)}
        events={events}
      />
    </div>
  )
}
