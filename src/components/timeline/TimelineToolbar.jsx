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
  Pencil,
  Check,
  X,
} from 'lucide-react'
import useTimelineStore from '@/store/useTimelineStore'
import { VIEWS } from '@/utils/constants'
import Tooltip from '@/components/shared/Tooltip'
import AnimatedCount from '@/components/shared/AnimatedCount'
import ImportMenu from './ImportMenu'
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
          className={`rounded-md p-1.5 transition-all cursor-pointer ${
            canUndo
              ? 'text-gray-500 hover:text-gray-900 hover:bg-gray-100'
              : 'text-gray-200 cursor-default'
          }`}
        >
          <Undo2 size={15} />
        </button>
      </Tooltip>
      <Tooltip label="Redo" shortcut={isMac ? '\u2318\u21e7Z' : 'Ctrl+Shift+Z'}>
        <button
          onClick={redo}
          disabled={!canRedo}
          className={`rounded-md p-1.5 transition-all cursor-pointer ${
            canRedo
              ? 'text-gray-500 hover:text-gray-900 hover:bg-gray-100'
              : 'text-gray-200 cursor-default'
          }`}
        >
          <Redo2 size={15} />
        </button>
      </Tooltip>
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
}) {
  const [isRenaming, setIsRenaming] = useState(false)
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
            className="lg:hidden flex items-center gap-1.5 rounded-lg border border-gray-200 px-2.5 py-1.5 text-sm text-gray-600 hover:bg-gray-50 transition-colors cursor-pointer"
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
                className="font-display text-base font-semibold text-gray-900 leading-tight bg-white border border-secondary rounded-md px-2 py-0.5 w-48 focus:outline-none focus:ring-2 focus:ring-secondary/20"
              />
              <button
                onClick={handleSaveName}
                className="rounded-md p-1 text-success hover:bg-green-50 transition-colors cursor-pointer"
              >
                <Check size={14} className="pointer-events-none" />
              </button>
              <button
                onClick={handleCancelRename}
                className="rounded-md p-1 text-gray-400 hover:text-error hover:bg-red-50 transition-colors cursor-pointer"
              >
                <X size={14} className="pointer-events-none" />
              </button>
            </div>
          ) : (
            <button
              onClick={() => setIsRenaming(true)}
              className="group flex items-center gap-1.5 cursor-pointer rounded-md px-1 -mx-1 hover:bg-gray-100 transition-colors"
            >
              <h1 className="font-display text-base font-semibold text-gray-900 leading-tight truncate">
                {timelineName}
              </h1>
              <Pencil
                size={12}
                className="text-gray-300 group-hover:text-gray-500 transition-colors shrink-0"
              />
            </button>
          )}
          <p className="text-xs text-gray-400 mt-0.5">
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
                className={`relative rounded-lg p-2 transition-colors cursor-pointer ${
                  activeView === key ? 'text-gray-900' : 'text-gray-400 hover:text-gray-600'
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

          {activeView === VIEWS.VERTICAL && (
            <div className="ml-1.5 hidden sm:flex items-center bg-gray-100/80 rounded-lg p-0.5 border border-gray-200/60">
              <button
                onClick={() => setVerticalCompact(false)}
                className={`rounded-md px-2.5 py-1 text-xs font-medium transition-all cursor-pointer ${
                  !verticalCompact
                    ? 'bg-white text-gray-900 shadow-sm border border-gray-200/60'
                    : 'text-gray-500 hover:text-gray-700'
                }`}
              >
                Expanded
              </button>
              <button
                onClick={() => setVerticalCompact(true)}
                className={`rounded-md px-2.5 py-1 text-xs font-medium transition-all cursor-pointer ${
                  verticalCompact
                    ? 'bg-white text-gray-900 shadow-sm border border-gray-200/60'
                    : 'text-gray-500 hover:text-gray-700'
                }`}
              >
                Compact
              </button>
            </div>
          )}

          {(activeView === VIEWS.VERTICAL || activeView === VIEWS.GRID) && (
            <div className="ml-1.5 hidden sm:flex items-center bg-gray-100/80 rounded-lg p-0.5 border border-gray-200/60">
              <button
                onClick={() => setGroupZoom('year')}
                className={`rounded-md px-2.5 py-1 text-xs font-medium transition-all cursor-pointer ${
                  groupZoom === 'year'
                    ? 'bg-white text-gray-900 shadow-sm border border-gray-200/60'
                    : 'text-gray-500 hover:text-gray-700'
                }`}
              >
                Year
              </button>
              <button
                onClick={() => setGroupZoom('month')}
                className={`rounded-md px-2.5 py-1 text-xs font-medium transition-all cursor-pointer ${
                  groupZoom === 'month'
                    ? 'bg-white text-gray-900 shadow-sm border border-gray-200/60'
                    : 'text-gray-500 hover:text-gray-700'
                }`}
              >
                Month
              </button>
            </div>
          )}
        </div>

        <span className="h-4 w-px bg-gray-200 hidden sm:block" />

        <UndoRedoButtons />

        <span className="h-4 w-px bg-gray-200 hidden sm:block" />

        <div className="hidden sm:flex items-center gap-0.5 rounded-xl bg-gray-100/80 border border-gray-200/60 p-1">
          <Tooltip label="Add event" shortcut="N">
            <button
              onClick={() => setAddEventOpen(true)}
              className="rounded-md p-1.5 text-gray-500 hover:text-gray-900 hover:bg-gray-100 transition-colors cursor-pointer"
            >
              <Plus size={15} />
            </button>
          </Tooltip>
          <Tooltip label="Import text">
            <button
              onClick={() => setShowImport(!showImport)}
              className={`rounded-md p-1.5 transition-colors cursor-pointer ${
                showImport
                  ? 'text-secondary bg-white shadow-sm'
                  : 'text-gray-500 hover:text-gray-900 hover:bg-gray-100'
              }`}
            >
              <Type size={15} />
            </button>
          </Tooltip>
          <Tooltip label="Photo library">
            <button
              onClick={() => setPhotoLibOpen(true)}
              className="rounded-md p-1.5 text-gray-500 hover:text-gray-900 hover:bg-gray-100 transition-colors cursor-pointer"
            >
              <ImagePlus size={15} />
            </button>
          </Tooltip>
          <Tooltip label="Import timeline data">
            <ImportMenu compact />
          </Tooltip>
        </div>
      </div>
    </div>
  )
}
