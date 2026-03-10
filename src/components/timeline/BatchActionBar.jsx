import { useState, useEffect, useRef } from 'react'
import { X, Tag, Trash2, UserPlus } from 'lucide-react'
import useTimelineStore from '@/store/useTimelineStore'
import { TAG_OPTIONS } from '@/utils/constants'

const popoverCls =
  'absolute bottom-full mb-2 left-0 rounded-xl border border-gray-200 bg-surface shadow-lg py-1.5 animate-[tooltip-in_0.15s_ease-out]'

export default function BatchActionBar() {
  const barRef = useRef(null)
  const deleteTimerRef = useRef(null)
  const selectedEventIds = useTimelineStore((s) => s.selectedEventIds)
  const clearSelection = useTimelineStore((s) => s.clearSelection)
  const batchAddTag = useTimelineStore((s) => s.batchAddTag)
  const batchRemoveTag = useTimelineStore((s) => s.batchRemoveTag)
  const batchDelete = useTimelineStore((s) => s.batchDelete)
  const batchAddPerson = useTimelineStore((s) => s.batchAddPerson)
  const customTags = useTimelineStore((s) => s.customTags)

  const [showTagMenu, setShowTagMenu] = useState(false)
  const [showRemoveTagMenu, setShowRemoveTagMenu] = useState(false)
  const [showPersonInput, setShowPersonInput] = useState(false)
  const [personName, setPersonName] = useState('')
  const [confirmDelete, setConfirmDelete] = useState(false)

  // Close menus on click outside
  useEffect(() => {
    if (!showTagMenu && !showRemoveTagMenu && !showPersonInput) return
    const handle = (e) => {
      if (barRef.current && !barRef.current.contains(e.target)) {
        setShowTagMenu(false)
        setShowRemoveTagMenu(false)
        setShowPersonInput(false)
      }
    }
    document.addEventListener('mousedown', handle)
    return () => document.removeEventListener('mousedown', handle)
  }, [showTagMenu, showRemoveTagMenu, showPersonInput])

  const count = selectedEventIds.length
  if (count === 0) return null

  const allTags = [...TAG_OPTIONS, ...customTags]

  const handleAddTag = (tag) => {
    batchAddTag(tag)
    setShowTagMenu(false)
  }

  const handleRemoveTag = (tag) => {
    batchRemoveTag(tag)
    setShowRemoveTagMenu(false)
  }

  const handleAddPerson = () => {
    const trimmed = personName.trim()
    if (trimmed) {
      batchAddPerson(trimmed)
      setPersonName('')
      setShowPersonInput(false)
    }
  }

  const handleDelete = () => {
    if (confirmDelete) {
      clearTimeout(deleteTimerRef.current)
      batchDelete()
      setConfirmDelete(false)
    } else {
      setConfirmDelete(true)
      deleteTimerRef.current = setTimeout(() => setConfirmDelete(false), 3000)
    }
  }

  return (
    <div ref={barRef} className="fixed bottom-4 left-1/2 -translate-x-1/2 z-50 flex items-center gap-2 bg-gray-900 text-white rounded-xl shadow-2xl px-4 py-3 max-w-lg animate-fade-in">
      <span className="text-sm font-medium whitespace-nowrap">
        {count} selected
      </span>

      <span className="h-4 w-px bg-gray-600" />

      {/* Add Tag */}
      <div className="relative">
        <button
          type="button"
          onClick={() => {
            setShowTagMenu(!showTagMenu)
            setShowRemoveTagMenu(false)
            setShowPersonInput(false)
          }}
          className="flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-xs font-medium hover:bg-gray-700 transition-colors duration-150 cursor-pointer"
          aria-label="Add tag to selected events"
          aria-expanded={showTagMenu}
        >
          <Tag size={14} />
          <span className="hidden sm:inline">Add Tag</span>
        </button>
        {showTagMenu && (
          <div className={`${popoverCls} w-36 max-h-48 overflow-y-auto app-scroll`}>
            {allTags.map((tag) => (
              <button
                key={tag}
                onClick={() => handleAddTag(tag)}
                className="w-full text-left px-3 py-1.5 text-xs text-text-default hover:bg-surface-raised transition-colors duration-150 cursor-pointer" type="button"
              >
                {tag}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Remove Tag */}
      <div className="relative">
        <button
          type="button"
          onClick={() => {
            setShowRemoveTagMenu(!showRemoveTagMenu)
            setShowTagMenu(false)
            setShowPersonInput(false)
          }}
          className="flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-xs font-medium hover:bg-gray-700 transition-colors duration-150 cursor-pointer"
          aria-label="Remove tag from selected events"
          aria-expanded={showRemoveTagMenu}
        >
          <Tag size={14} />
          <span className="hidden sm:inline">Remove Tag</span>
        </button>
        {showRemoveTagMenu && (
          <div className={`${popoverCls} w-36 max-h-48 overflow-y-auto app-scroll`}>
            {allTags.map((tag) => (
              <button
                key={tag}
                onClick={() => handleRemoveTag(tag)}
                className="w-full text-left px-3 py-1.5 text-xs text-text-default hover:bg-surface-raised transition-colors duration-150 cursor-pointer" type="button"
              >
                {tag}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Add Person */}
      <div className="relative">
        <button
          type="button"
          onClick={() => {
            setShowPersonInput(!showPersonInput)
            setShowTagMenu(false)
            setShowRemoveTagMenu(false)
          }}
          className="flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-xs font-medium hover:bg-gray-700 transition-colors duration-150 cursor-pointer"
          aria-label="Add person to selected events"
          aria-expanded={showPersonInput}
        >
          <UserPlus size={14} />
          <span className="hidden sm:inline">Add Person</span>
        </button>
        {showPersonInput && (
          <div className={`${popoverCls} p-2 w-48`}>
            <div className="flex gap-1">
              <input
                type="text"
                value={personName}
                onChange={(e) => setPersonName(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleAddPerson()}
                placeholder="Person name"
                className="flex-1 text-xs bg-canvas border border-gray-200 rounded-lg px-2 py-1.5 text-text-default focus:outline-none focus:border-secondary transition-colors duration-150"
                autoFocus
              />
              <button
                type="button"
                onClick={handleAddPerson}
                className="rounded-lg px-2 py-1.5 text-xs font-medium bg-secondary text-white hover:bg-secondary-hover transition-colors duration-150 cursor-pointer"
              >
                Add
              </button>
            </div>
          </div>
        )}
      </div>

      <span className="h-4 w-px bg-gray-600" />

      {/* Delete */}
      <button
        type="button"
        onClick={handleDelete}
        className={`relative flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-xs font-medium transition-colors duration-150 cursor-pointer overflow-hidden ${
          confirmDelete
            ? 'bg-red-500 hover:bg-red-600 text-white'
            : 'hover:bg-gray-700 text-red-400'
        }`}
        aria-label={confirmDelete ? 'Confirm delete selected events' : 'Delete selected events'}
      >
        <Trash2 size={14} />
        <span>{confirmDelete ? 'Confirm' : 'Delete'}</span>
        {confirmDelete && <span className="absolute bottom-0 left-0 h-0.5 bg-white/40 animate-[countdown_3s_linear_forwards]" />}
      </button>

      <span className="h-4 w-px bg-gray-600" />

      {/* Deselect */}
      <button
        type="button"
        onClick={clearSelection}
        className="rounded-lg p-1.5 hover:bg-gray-700 transition-colors duration-150 cursor-pointer"
        title="Deselect all"
        aria-label="Deselect all events"
      >
        <X size={14} />
      </button>
    </div>
  )
}
