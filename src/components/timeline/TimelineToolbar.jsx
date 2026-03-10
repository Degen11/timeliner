import { useState, useEffect, useRef } from 'react'
import { motion } from 'framer-motion'
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
  Palette,
  AlignJustify,
  Film,
  Newspaper,
  BookOpen,
  Columns2,
  Maximize2,
  Clapperboard,
  Waves,
  Upload,
} from 'lucide-react'
import useTimelineStore from '@/store/useTimelineStore'
import { VIEWS } from '@/utils/constants'
import { dropdownCls } from '@/utils/ui'
import Tooltip from '@/components/shared/Tooltip'
import Button from '@/components/shared/Button'
import AnimatedCount from '@/components/shared/AnimatedCount'
import ImportMenu from './ImportMenu'
import StatsModal from './StatsModal'
import { SaveStatus } from '@/components/layout/Header'

const VIEW_OPTIONS = [
  { key: VIEWS.VERTICAL, label: 'Vertical', icon: <List size={16} />, shortcut: '1' },
  { key: VIEWS.HORIZONTAL, label: 'Horizontal', icon: <GripHorizontal size={16} />, shortcut: '2' },
  { key: VIEWS.GRID, label: 'Grid', icon: <LayoutGrid size={16} />, shortcut: '3' },
  { key: VIEWS.MAP, label: 'Map', icon: <MapPin size={16} />, shortcut: '4' },
  { key: VIEWS.GRAPH, label: 'Graph', icon: <GitBranch size={16} />, shortcut: '5' },
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

const VERTICAL_DESIGNS = [
  { key: 'classic', label: 'Classic', icon: <AlignJustify size={12} /> },
  { key: 'cinematic', label: 'Cinematic', icon: <Film size={12} /> },
  { key: 'magazine', label: 'Magazine', icon: <Newspaper size={12} /> },
  { key: 'narrative', label: 'Narrative', icon: <BookOpen size={12} /> },
]

const HORIZONTAL_DESIGNS = [
  { key: 'classic', label: 'Classic', icon: <Columns2 size={12} /> },
  { key: 'panoramic', label: 'Panoramic', icon: <Maximize2 size={12} /> },
  { key: 'filmstrip', label: 'Film Strip', icon: <Clapperboard size={12} /> },
  { key: 'wave', label: 'Wave', icon: <Waves size={12} /> },
]

function DesignSelector({ designs, active, onChange }) {
  const [open, setOpen] = useState(false)
  const ref = useRef(null)

  useEffect(() => {
    if (!open) return
    const handler = (e) => {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false)
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [open])

  const activeLabel = designs.find((d) => d.key === active)?.label || 'Classic'

  return (
    <div className="relative hidden sm:block" ref={ref}>
      <Tooltip label="Design style">
        <button
          onClick={() => setOpen(!open)}
          className={`flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-xs font-medium transition-colors duration-150 cursor-pointer border ${
            open || active !== 'classic'
              ? 'bg-white text-secondary border-secondary/30 shadow-sm'
              : 'bg-gray-100/80 text-text-muted hover:text-text-default border-gray-200/60'
          }`}
        >
          <Palette size={14} />
          <span>{activeLabel}</span>
        </button>
      </Tooltip>
      {open && (
        <div className={`${dropdownCls} top-full right-0 min-w-[140px]`}>
          {designs.map(({ key, label, icon }) => (
            <button
              key={key}
              onClick={() => {
                onChange(key)
                setOpen(false)
              }}
              className={`w-full text-left px-3 py-2 text-xs font-medium transition-colors duration-150 cursor-pointer flex items-center gap-2 ${
                active === key
                  ? 'text-secondary bg-secondary/5'
                  : 'text-text-default hover:bg-surface-raised'
              }`}
            >
              {icon && <span className="shrink-0">{icon}</span>}
              <span className="flex-1">{label}</span>
              {active === key && (
                <span className="text-secondary shrink-0">
                  <Check size={12} />
                </span>
              )}
            </button>
          ))}
        </div>
      )}
    </div>
  )
}

function AddDropdown({ onAddEvent, onImportText, onPhotoLib }) {
  const [open, setOpen] = useState(false)
  const ref = useRef(null)

  useEffect(() => {
    if (!open) return
    const handler = (e) => {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false)
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [open])

  const items = [
    { label: 'Add Event', icon: <Plus size={14} />, action: onAddEvent, shortcut: 'N' },
    { label: 'Import Text', icon: <Type size={14} />, action: onImportText },
    { label: 'Photo Library', icon: <ImagePlus size={14} />, action: onPhotoLib },
  ]

  return (
    <div className="relative hidden sm:block" ref={ref}>
      <Tooltip label="Add content" shortcut="N">
        <button
          onClick={() => setOpen(!open)}
          className={`flex items-center justify-center rounded-lg p-2 transition-colors duration-150 cursor-pointer border ${
            open
              ? 'bg-white text-secondary border-secondary/30 shadow-sm'
              : 'bg-gray-100/80 text-text-muted hover:text-text-strong border-gray-200/60'
          }`}
        >
          <Plus size={16} />
        </button>
      </Tooltip>
      {open && (
        <div className={`${dropdownCls} top-full right-0 min-w-[180px]`}>
          {items.map(({ label, icon, action, shortcut }) => (
            <button
              key={label}
              onClick={() => {
                action()
                setOpen(false)
              }}
              className="w-full text-left px-3 py-2 text-sm font-medium transition-colors duration-150 cursor-pointer flex items-center gap-2.5 text-text-default hover:bg-surface-raised"
            >
              <span className="text-text-muted shrink-0">{icon}</span>
              <span className="flex-1">{label}</span>
              {shortcut && <span className="text-xs text-gray-300 font-mono">{shortcut}</span>}
            </button>
          ))}
          <div className="border-t border-gray-200 my-0.5" />
          <ImportMenu compact={false} inline />
        </div>
      )}
    </div>
  )
}

export default function ToolbarContent({
  timelineActive,
  hasEvents,
  filtered,
  events,
  activeView,
  setActiveView,
  verticalCompact,
  setVerticalCompact,
  groupZoom,
  setGroupZoom,
  setAddEventOpen,
  showImport,
  setShowImport,
  setPhotoLibOpen,
  setDrawerOpen,
  timelineName,
  onRenameTimeline,
  photoCount = 0,
  verticalDesign = 'classic',
  setVerticalDesign,
  horizontalDesign = 'classic',
  setHorizontalDesign,
  onOpenInsights,
}) {
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

  if (!timelineActive || !hasEvents) return null

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

        <div className="flex items-center gap-0.5 relative bg-gray-100/80 rounded-xl p-1 border border-gray-200/60">
          {VIEW_OPTIONS.map(({ key, label, icon, shortcut }) => (
            <Tooltip key={key} label={label} shortcut={shortcut}>
              <button
                onClick={() => setActiveView(key)}
                className={`relative rounded-lg p-2 transition-colors duration-150 cursor-pointer ${
                  activeView === key ? 'text-text-strong' : 'text-text-muted hover:text-text-default'
                }`}
              >
                {activeView === key && (
                  <motion.div
                    layoutId="view-pill"
                    className="absolute inset-0 bg-white rounded-lg shadow-sm border border-gray-200/60"
                    transition={{ type: 'spring', duration: 0.35, bounce: 0.15 }}
                  />
                )}
                <span className="relative z-10">{icon}</span>
              </button>
            </Tooltip>
          ))}
        </div>

        {activeView === VIEWS.VERTICAL && verticalDesign === 'classic' && (
          <div className="hidden sm:flex items-center bg-gray-100/80 rounded-lg p-0.5 border border-gray-200/60">
            <Tooltip label="Show full event details">
              <button
                onClick={() => setVerticalCompact(false)}
                className={`rounded-lg px-2.5 py-1 text-xs font-medium transition-colors duration-150 cursor-pointer ${
                  !verticalCompact
                    ? 'bg-white text-text-strong shadow-sm border border-gray-200/60'
                    : 'text-text-muted hover:text-text-default'
                }`}
              >
                Expanded
              </button>
            </Tooltip>
            <Tooltip label="Show condensed event rows">
              <button
                onClick={() => setVerticalCompact(true)}
                className={`rounded-lg px-2.5 py-1 text-xs font-medium transition-colors duration-150 cursor-pointer ${
                  verticalCompact
                    ? 'bg-white text-text-strong shadow-sm border border-gray-200/60'
                    : 'text-text-muted hover:text-text-default'
                }`}
              >
                Compact
              </button>
            </Tooltip>
          </div>
        )}

        {activeView === VIEWS.VERTICAL && (
          <DesignSelector
            designs={VERTICAL_DESIGNS}
            active={verticalDesign}
            onChange={setVerticalDesign}
          />
        )}

        {activeView === VIEWS.HORIZONTAL && (
          <DesignSelector
            designs={HORIZONTAL_DESIGNS}
            active={horizontalDesign}
            onChange={setHorizontalDesign}
          />
        )}

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
