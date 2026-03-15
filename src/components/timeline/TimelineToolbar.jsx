import { useState, useEffect, useRef, useMemo } from 'react'
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
  AlignJustify,
  Film,
  Newspaper,
  BookOpen,
  Columns2,
  Maximize2,
  Clapperboard,
  Waves,
} from 'lucide-react'
import useTimelineStore from '@/store/useTimelineStore'
import { VIEWS } from '@/utils/constants'
import { getFilteredEvents } from '@/store/selectors'
import { Tooltip } from '@/components/ui/Tooltip'
import { DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuShortcut, DropdownMenuLabel } from '@/components/ui/DropdownMenu'
import AnimatedCount from '@/components/shared/AnimatedCount'
import ImportMenu from './ImportMenu'
import StatsModal from './StatsModal'
import { SaveStatus } from '@/components/layout/Header'

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
      { label: 'Classic', triggerLabel: 'Vertical', icon: <AlignJustify size={14} />, view: VIEWS.VERTICAL, design: 'classic', compact: false, shortcut: '1' },
      { label: 'Compact', triggerLabel: 'Compact', icon: <AlignJustify size={14} />, view: VIEWS.VERTICAL, design: 'classic', compact: true },
      { label: 'Cinematic', icon: <Film size={14} />, view: VIEWS.VERTICAL, design: 'cinematic' },
      { label: 'Magazine', icon: <Newspaper size={14} />, view: VIEWS.VERTICAL, design: 'magazine' },
      { label: 'Narrative', icon: <BookOpen size={14} />, view: VIEWS.VERTICAL, design: 'narrative' },
    ],
  },
  {
    section: 'Horizontal',
    items: [
      { label: 'Classic', triggerLabel: 'Horizontal', icon: <Columns2 size={14} />, view: VIEWS.HORIZONTAL, design: 'classic', shortcut: '2' },
      { label: 'Panoramic', icon: <Maximize2 size={14} />, view: VIEWS.HORIZONTAL, design: 'panoramic' },
      { label: 'Film Strip', icon: <Clapperboard size={14} />, view: VIEWS.HORIZONTAL, design: 'filmstrip' },
      { label: 'Wave', icon: <Waves size={14} />, view: VIEWS.HORIZONTAL, design: 'wave' },
    ],
  },
  {
    items: [
      { label: 'Grid', icon: <LayoutGrid size={14} />, view: VIEWS.GRID, shortcut: '3' },
      { label: 'Map', icon: <MapPin size={14} />, view: VIEWS.MAP, shortcut: '4' },
      { label: 'Graph', icon: <GitBranch size={14} />, view: VIEWS.GRAPH, shortcut: '5' },
    ],
  },
]

function UndoRedoButtons() {
  const canUndo = useTimelineStore((s) => s.canUndo)
  const canRedo = useTimelineStore((s) => s.canRedo)
  const undo = useTimelineStore((s) => s.undo)
  const redo = useTimelineStore((s) => s.redo)
  const isMac = navigator.platform?.includes('Mac')

  return (
    <div className="hidden sm:flex items-center gap-0.5">
      <Tooltip label="Undo" shortcut={isMac ? '\u2318Z' : 'Ctrl+Z'}>
        <button
          onClick={undo}
          disabled={!canUndo}
          className={`rounded-lg p-1.5 transition-colors duration-150 cursor-pointer ${
            canUndo
              ? 'text-text-muted hover:text-text-strong hover:bg-surface-raised'
              : 'text-gray-300 cursor-default'
          }`}
        >
          <Undo2 size={16} />
        </button>
      </Tooltip>
      <Tooltip label="Redo" shortcut={isMac ? '\u2318\u21e7Z' : 'Ctrl+Shift+Z'}>
        <button
          onClick={redo}
          disabled={!canRedo}
          className={`rounded-lg p-1.5 transition-colors duration-150 cursor-pointer ${
            canRedo
              ? 'text-text-muted hover:text-text-strong hover:bg-surface-raised'
              : 'text-gray-300 cursor-default'
          }`}
        >
          <Redo2 size={16} />
        </button>
      </Tooltip>
    </div>
  )
}

function ViewSelector() {
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

  return (
    <DropdownMenu>
      <Tooltip label="Switch view">
        <DropdownMenuTrigger asChild>
          <button className="flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-sm font-medium transition-colors duration-150 cursor-pointer border bg-gray-100/80 text-text-default hover:text-text-strong border-gray-200/60">
            {VIEW_ICONS[activeView]}
            <span>{triggerLabel}</span>
            <ChevronDown size={12} className="text-text-muted" />
          </button>
        </DropdownMenuTrigger>
      </Tooltip>
      <DropdownMenuContent align="start" className="min-w-[180px]">
        {VIEW_MENU.map((group, gi) => (
          <div key={gi}>
            {gi > 0 && <DropdownMenuSeparator />}
            {group.section && <DropdownMenuLabel>{group.section}</DropdownMenuLabel>}
            {group.items.map((item) => {
              const active = isItemActive(item)
              return (
                <DropdownMenuItem
                  key={`${item.view}-${item.design || ''}-${item.compact ?? ''}`}
                  onClick={() => selectItem(item)}
                  className={active ? 'bg-surface-raised text-text-strong' : ''}
                >
                  <span className="shrink-0 text-text-muted">{item.icon}</span>
                  <span className="flex-1">{item.label}</span>
                  {item.shortcut && <DropdownMenuShortcut>{item.shortcut}</DropdownMenuShortcut>}
                  {active && <Check size={14} className="shrink-0 text-text-muted" />}
                </DropdownMenuItem>
              )
            })}
          </div>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  )
}

function AddDropdown({ onAddEvent, onImportText, onPhotoLib }) {
  return (
    <div className="hidden sm:block">
      <DropdownMenu>
        <Tooltip label="Add content" shortcut="N">
          <DropdownMenuTrigger asChild>
            <button
              className="flex items-center justify-center rounded-lg p-2 transition-colors duration-150 cursor-pointer border bg-gray-100/80 text-text-muted hover:text-text-strong border-gray-200/60"
            >
              <Plus size={16} />
            </button>
          </DropdownMenuTrigger>
        </Tooltip>
        <DropdownMenuContent align="end" className="min-w-[180px]">
          <DropdownMenuItem onClick={onAddEvent}>
            <Plus size={14} className="text-text-muted" />
            <span className="flex-1">Add Event</span>
            <DropdownMenuShortcut>N</DropdownMenuShortcut>
          </DropdownMenuItem>
          <DropdownMenuItem onClick={onImportText}>
            <Type size={14} className="text-text-muted" />
            <span className="flex-1">Import Text</span>
          </DropdownMenuItem>
          <DropdownMenuItem onClick={onPhotoLib}>
            <ImagePlus size={14} className="text-text-muted" />
            <span className="flex-1">Photo Library</span>
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <ImportMenu compact={false} inline />
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
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
  const groupZoom = useTimelineStore((s) => s.groupZoom)
  const setGroupZoom = useTimelineStore((s) => s.setGroupZoom)
  const filters = useTimelineStore((s) => s.filters)
  const filtered = useMemo(() => getFilteredEvents(events, filters), [events, filters])

  const [isRenaming, setIsRenaming] = useState(false)
  const [showStats, setShowStats] = useState(false)
  const [nameInput, setNameInput] = useState(timelineName)
  const nameInputRef = useRef(null)

  useEffect(() => {
    setNameInput(timelineName)
  }, [timelineName])

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

  return (
    <div className="flex items-center justify-between gap-3 flex-1 min-w-0">
      <div className="flex items-center gap-3 shrink-0">
        <Tooltip label="Filters">
          <button
            onClick={() => setDrawerOpen(true)}
            className="lg:hidden flex items-center gap-1.5 rounded-lg border border-gray-200 px-2.5 py-1.5 text-sm text-text-default hover:bg-surface-raised transition-colors duration-150 cursor-pointer"
          >
            <SlidersHorizontal size={14} />
            <span>Filters</span>
          </button>
        </Tooltip>
      </div>

      <div className="flex-1 flex flex-col min-w-0 lg:hidden">
        <div className="min-w-0">
          {isRenaming ? (
            <div ref={renameContainerRef} className="flex items-center gap-1">
              <input
                ref={nameInputRef}
                value={nameInput}
                onChange={(e) => setNameInput(e.target.value)}
                onKeyDown={handleNameKeyDown}
                onBlur={handleNameBlur}
                className="text-base font-semibold text-text-strong leading-tight bg-surface border border-secondary rounded-lg px-2 py-0.5 w-48 focus:outline-none focus:ring-2 focus:ring-secondary/15"
              />
              <button
                onClick={handleSaveName}
                className="rounded-lg p-1 text-success hover:bg-green-50 transition-colors duration-150 cursor-pointer"
              >
                <Check size={14} className="pointer-events-none" />
              </button>
              <button
                onClick={handleCancelRename}
                className="rounded-lg p-1 text-text-muted hover:text-error hover:bg-red-50 transition-colors duration-150 cursor-pointer"
              >
                <X size={14} className="pointer-events-none" />
              </button>
            </div>
          ) : (
            <button
              onClick={() => setIsRenaming(true)}
              className="group flex items-center gap-1.5 cursor-pointer rounded-lg px-1 -mx-1 hover:bg-surface-raised transition-colors duration-150"
            >
              <h1 className="text-base font-semibold text-text-strong leading-tight truncate">
                {timelineName}
              </h1>
              <Pencil
                size={12}
                className="text-gray-300 group-hover:text-text-muted transition-colors duration-150 shrink-0"
              />
            </button>
          )}
          <p className="text-xs text-text-muted mt-0.5">
            <AnimatedCount value={filtered.length} /> event{filtered.length !== 1 ? 's' : ''}
            {filtered.length !== events.length && (
              <>
                {' '}
                of <AnimatedCount value={events.length} />
              </>
            )}
          </p>
        </div>
      </div>

      <div className="flex items-center gap-2 shrink-0">
        <SaveStatus />

        <ViewSelector />

        {(activeView === VIEWS.VERTICAL || activeView === VIEWS.GRID) && (
          <div className="hidden sm:flex items-center bg-gray-100/80 rounded-lg p-0.5 border border-gray-200/60">
            <Tooltip label="Group events by year">
              <button
                onClick={() => setGroupZoom('year')}
                className={`rounded-lg px-2.5 py-1 text-xs font-medium transition-colors duration-150 cursor-pointer ${
                  groupZoom === 'year'
                    ? 'bg-white text-text-strong shadow-sm border border-gray-200/60'
                    : 'text-text-muted hover:text-text-default'
                }`}
              >
                Year
              </button>
            </Tooltip>
            <Tooltip label="Group events by month">
              <button
                onClick={() => setGroupZoom('month')}
                className={`rounded-lg px-2.5 py-1 text-xs font-medium transition-colors duration-150 cursor-pointer ${
                  groupZoom === 'month'
                    ? 'bg-white text-text-strong shadow-sm border border-gray-200/60'
                    : 'text-text-muted hover:text-text-default'
                }`}
              >
                Month
              </button>
            </Tooltip>
          </div>
        )}

        <span className="h-4 w-px bg-gray-200 hidden sm:block" />

        <UndoRedoButtons />

        <Tooltip label="Timeline Insights">
          <button
            onClick={onOpenInsights}
            className="hidden sm:flex rounded-lg p-1.5 text-text-muted hover:text-secondary hover:bg-secondary/10 transition-colors duration-150 cursor-pointer"
          >
            <Sparkles size={16} />
          </button>
        </Tooltip>

        <Tooltip label="Stats">
          <button
            onClick={() => setShowStats(true)}
            className="hidden sm:flex rounded-lg p-1.5 text-text-muted hover:text-text-strong hover:bg-surface-raised transition-colors duration-150 cursor-pointer"
          >
            <BarChart3 size={16} />
          </button>
        </Tooltip>

        <span className="h-4 w-px bg-gray-200 hidden sm:block" />

        <AddDropdown
          onAddEvent={() => setAddEventOpen(true)}
          onImportText={() => setShowImport(!showImport)}
          onPhotoLib={() => setPhotoLibOpen(true)}
        />
      </div>

      <StatsModal
        open={showStats}
        onClose={() => setShowStats(false)}
        events={events}
        photoCount={photoCount}
      />
    </div>
  )
}
