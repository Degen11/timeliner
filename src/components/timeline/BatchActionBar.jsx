import { useState, useRef, useCallback } from 'react'
import { X, Tag, Trash2, UserPlus, CalendarClock } from 'lucide-react'
import useTimelineStore from '@/store/useTimelineStore'
import { TAG_OPTIONS } from '@/utils/constants'
import useClickOutside from '@/hooks/useClickOutside'
import useConfirmAction from '@/hooks/useConfirmAction'

const popoverCls =
  'absolute bottom-full mb-2 left-0 rounded-xl border border-gray-700 bg-gray-800 shadow-lg py-1.5 animate-[tooltip-in_0.15s_ease-out]'

const btnCls =
  'flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-medium whitespace-nowrap hover:bg-white/10 transition-colors duration-150 cursor-pointer'

export default function BatchActionBar() {
  const barRef = useRef(null)
  const selectedEventIds = useTimelineStore((s) => s.selectedEventIds)
  const clearSelection = useTimelineStore((s) => s.clearSelection)
  const batchAddTag = useTimelineStore((s) => s.batchAddTag)
  const batchRemoveTag = useTimelineStore((s) => s.batchRemoveTag)
  const batchDelete = useTimelineStore((s) => s.batchDelete)
  const batchAddPerson = useTimelineStore((s) => s.batchAddPerson)
  const batchShiftDates = useTimelineStore((s) => s.batchShiftDates)
  const customTags = useTimelineStore((s) => s.customTags)

  const [showTagMenu, setShowTagMenu] = useState(false)
  const [showRemoveTagMenu, setShowRemoveTagMenu] = useState(false)
  const [showPersonInput, setShowPersonInput] = useState(false)
  const [showDateShift, setShowDateShift] = useState(false)
  const [personName, setPersonName] = useState('')
  const [shiftAmount, setShiftAmount] = useState('1')
  const [shiftUnit, setShiftUnit] = useState('day')

  const closeMenus = useCallback(() => {
    setShowTagMenu(false)
    setShowRemoveTagMenu(false)
    setShowPersonInput(false)
    setShowDateShift(false)
  }, [])
  useClickOutside(barRef, closeMenus, showTagMenu || showRemoveTagMenu || showPersonInput || showDateShift)

  const deleteConfirm = useConfirmAction(batchDelete)

  const count = selectedEventIds.length
  if (count === 0) return null

  const allTags = [...TAG_OPTIONS, ...customTags]

  const openMenu = (setter) => {
    closeMenus()
    setter(true)
  }

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

  const handleShiftDates = (direction) => {
    const n = parseInt(shiftAmount, 10)
    if (!n || n <= 0) return
    batchShiftDates(direction === 'forward' ? n : -n, shiftUnit)
    setShowDateShift(false)
    setShiftAmount('1')
  }

  const handleDelete = () => {
    if (deleteConfirm.isArmed) {
      deleteConfirm.confirm()
    } else {
      deleteConfirm.arm()
    }
  }

  return (
    <div ref={barRef} className="fixed bottom-4 left-1/2 -translate-x-1/2 z-50 flex items-center gap-1 bg-gray-900 text-gray-100 rounded-2xl shadow-2xl px-4 py-2.5 max-w-2xl animate-fade-in">
      <span className="text-sm font-semibold whitespace-nowrap tabular-nums px-1">
        {count} selected
      </span>

      <span className="h-4 w-px bg-gray-600 mx-1" />

      {/* Add Tag */}
      <div className="relative">
        <button
          type="button"
          onClick={() => openMenu(setShowTagMenu)}
          className={btnCls}
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
                className="w-full text-left px-3 py-1.5 text-xs text-gray-200 hover:bg-white/10 transition-colors duration-150 cursor-pointer" type="button"
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
          onClick={() => openMenu(setShowRemoveTagMenu)}
          className={btnCls}
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
                className="w-full text-left px-3 py-1.5 text-xs text-gray-200 hover:bg-white/10 transition-colors duration-150 cursor-pointer" type="button"
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
          onClick={() => openMenu(setShowPersonInput)}
          className={btnCls}
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
                className="flex-1 text-xs bg-gray-900 border border-gray-600 rounded-lg px-2 py-1.5 text-gray-100 placeholder:text-gray-500 focus:outline-none focus:border-secondary transition-colors duration-150"
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

      {/* Shift Dates */}
      <div className="relative">
        <button
          type="button"
          onClick={() => openMenu(setShowDateShift)}
          className={btnCls}
          aria-label="Shift dates of selected events"
          aria-expanded={showDateShift}
        >
          <CalendarClock size={14} />
          <span className="hidden sm:inline">Shift Dates</span>
        </button>
        {showDateShift && (
          <div className={`${popoverCls} p-3 w-56`}>
            <div className="flex gap-1.5 mb-2">
              <input
                type="number"
                min="1"
                value={shiftAmount}
                onChange={(e) => setShiftAmount(e.target.value)}
                className="w-16 text-xs bg-gray-900 border border-gray-600 rounded-lg px-2 py-1.5 text-gray-100 focus:outline-none focus:border-secondary transition-colors duration-150 tabular-nums"
                autoFocus
              />
              <select
                value={shiftUnit}
                onChange={(e) => setShiftUnit(e.target.value)}
                className="flex-1 text-xs bg-gray-900 border border-gray-600 rounded-lg px-2 py-1.5 text-gray-100 focus:outline-none focus:border-secondary transition-colors duration-150 cursor-pointer"
              >
                <option value="day">Days</option>
                <option value="month">Months</option>
                <option value="year">Years</option>
              </select>
            </div>
            <div className="flex gap-1.5">
              <button
                type="button"
                onClick={() => handleShiftDates('back')}
                className="flex-1 rounded-lg py-1.5 text-xs font-medium bg-gray-700 text-gray-200 hover:bg-gray-600 transition-colors duration-150 cursor-pointer"
              >
                &larr; Earlier
              </button>
              <button
                type="button"
                onClick={() => handleShiftDates('forward')}
                className="flex-1 rounded-lg py-1.5 text-xs font-medium bg-secondary text-white hover:bg-secondary-hover transition-colors duration-150 cursor-pointer"
              >
                Later &rarr;
              </button>
            </div>
          </div>
        )}
      </div>

      <span className="h-4 w-px bg-gray-600 mx-1" />

      {/* Delete */}
      <button
        type="button"
        onClick={handleDelete}
        className={`relative flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-medium whitespace-nowrap transition-colors duration-150 cursor-pointer overflow-hidden ${
          deleteConfirm.isArmed
            ? 'bg-red-500 hover:bg-red-600 text-white'
            : 'hover:bg-white/10 text-red-400'
        }`}
        aria-label={deleteConfirm.isArmed ? 'Confirm delete selected events' : 'Delete selected events'}
      >
        <Trash2 size={14} />
        <span>{deleteConfirm.isArmed ? 'Confirm' : 'Delete'}</span>
        {deleteConfirm.isArmed && <span className="absolute bottom-0 left-0 h-0.5 bg-white/40 animate-[countdown_3s_linear_forwards]" />}
      </button>

      <span className="h-4 w-px bg-gray-600 mx-1" />

      {/* Deselect */}
      <button
        type="button"
        onClick={clearSelection}
        className="rounded-lg p-1.5 hover:bg-white/10 transition-colors duration-150 cursor-pointer"
        title="Deselect all"
        aria-label="Deselect all events"
      >
        <X size={14} />
      </button>
    </div>
  )
}
