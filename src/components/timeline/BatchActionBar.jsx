import { useState, useRef, useCallback, useMemo } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { X, Tag, Trash2, UserPlus, CalendarClock, Check } from 'lucide-react'
import useTimelineStore from '@/store/useTimelineStore'
import { TAG_OPTIONS } from '@/utils/constants'
import { safeGetUTCYear } from '@/utils/dateUtils'
import useClickOutside from '@/hooks/useClickOutside'
import useConfirmAction from '@/hooks/useConfirmAction'

const popoverCls =
  'absolute bottom-full mb-2 left-0 rounded-xl border border-gray-700 bg-gray-800 shadow-lg animate-[tooltip-in_0.15s_ease-out]'

const btnCls =
  'flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-medium whitespace-nowrap hover:bg-white/10 transition-colors duration-150 cursor-pointer'

// Inline styles beat browser's color-scheme:dark user-agent overrides on form controls
const inputStyle = { colorScheme: 'normal', backgroundColor: '#111827', color: '#f3f4f6' }
const selectStyle = { colorScheme: 'normal', backgroundColor: '#111827', color: '#f3f4f6' }
const earlierBtnStyle = { backgroundColor: '#374151', color: '#e5e7eb' }

export default function BatchActionBar() {
  const barRef = useRef(null)
  const selectedEventIds = useTimelineStore((s) => s.selectedEventIds)
  const clearSelection = useTimelineStore((s) => s.clearSelection)
  const batchAddTags = useTimelineStore((s) => s.batchAddTags)
  const batchRemoveTags = useTimelineStore((s) => s.batchRemoveTags)
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
  const [pendingTags, setPendingTags] = useState([])
  const [pendingRemoveTags, setPendingRemoveTags] = useState([])

  const closeMenus = useCallback(() => {
    setShowTagMenu(false)
    setShowRemoveTagMenu(false)
    setShowPersonInput(false)
    setShowDateShift(false)
    setPendingTags([])
    setPendingRemoveTags([])
  }, [])
  useClickOutside(barRef, closeMenus, showTagMenu || showRemoveTagMenu || showPersonInput || showDateShift)

  const events = useTimelineStore((s) => s.events)
  const deleteConfirm = useConfirmAction(batchDelete)

  const count = selectedEventIds.length

  const summary = useMemo(() => {
    if (count === 0) return null
    const selectedSet = new Set(selectedEventIds)
    const selected = events.filter((e) => selectedSet.has(e.id))
    const years = new Set(selected.map((e) => safeGetUTCYear(e.dateStart, null)).filter(Boolean))
    const people = new Set(selected.flatMap((e) => e.people || []))
    const parts = []
    if (years.size > 1) parts.push(`${years.size} years`)
    else if (years.size === 1) parts.push(`${[...years][0]}`)
    if (people.size > 0) parts.push(`${people.size} ${people.size === 1 ? 'person' : 'people'}`)
    return parts.length > 0 ? parts.join(', ') : null
  }, [count, selectedEventIds, events])

  if (count === 0) return null

  const allTags = [...TAG_OPTIONS, ...customTags]

  const openMenu = (setter) => {
    closeMenus()
    setter(true)
  }

  const togglePendingTag = (tag) => {
    setPendingTags((prev) => prev.includes(tag) ? prev.filter((t) => t !== tag) : [...prev, tag])
  }

  const togglePendingRemoveTag = (tag) => {
    setPendingRemoveTags((prev) => prev.includes(tag) ? prev.filter((t) => t !== tag) : [...prev, tag])
  }

  const applyAddTags = () => {
    if (pendingTags.length > 0) batchAddTags(pendingTags)
    setPendingTags([])
    setShowTagMenu(false)
  }

  const applyRemoveTags = () => {
    if (pendingRemoveTags.length > 0) batchRemoveTags(pendingRemoveTags)
    setPendingRemoveTags([])
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
    <AnimatePresence>
    <motion.div
      ref={barRef}
      initial={{ opacity: 0, y: 24 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: 24 }}
      transition={{ type: 'spring', duration: 0.35, bounce: 0.15 }}
      className="fixed bottom-4 left-1/2 -translate-x-1/2 z-50 flex items-center gap-1 bg-gray-900 text-gray-100 rounded-2xl shadow-2xl px-4 py-2.5 max-w-2xl"
    >
      <span className="text-sm font-semibold whitespace-nowrap tabular-nums px-1">
        {count} selected
      </span>
      {summary && (
        <span className="text-xs text-gray-400 whitespace-nowrap hidden sm:inline">
          ({summary})
        </span>
      )}

      <span className="h-4 w-px bg-gray-600 mx-1" />

      {/* Add Tag — multi-select */}
      <div className="relative">
        <button
          type="button"
          onClick={() => openMenu(setShowTagMenu)}
          className={btnCls}
          aria-label="Add tags to selected events"
          aria-expanded={showTagMenu}
        >
          <Tag size={14} />
          <span className="hidden sm:inline">Add Tag</span>
        </button>
        {showTagMenu && (
          <div className={`${popoverCls} w-44`}>
            <div className="max-h-48 overflow-y-auto app-scroll py-1.5">
              {allTags.map((tag) => {
                const selected = pendingTags.includes(tag)
                return (
                  <button
                    key={tag}
                    onClick={() => togglePendingTag(tag)}
                    className={`w-full flex items-center gap-2 px-3 py-1.5 text-xs transition-colors duration-150 cursor-pointer ${selected ? 'text-white bg-white/10' : 'text-gray-300 hover:bg-white/5'}`}
                    type="button"
                  >
                    <span className={`w-3.5 h-3.5 rounded border flex items-center justify-center shrink-0 ${selected ? 'bg-secondary border-secondary' : 'border-gray-500'}`}>
                      {selected && <Check size={10} strokeWidth={3} />}
                    </span>
                    {tag}
                  </button>
                )
              })}
            </div>
            {pendingTags.length > 0 && (
              <div className="border-t border-gray-700 px-3 py-2">
                <button
                  type="button"
                  onClick={applyAddTags}
                  className="w-full rounded-lg py-1.5 text-xs font-medium bg-secondary text-white hover:bg-secondary-hover transition-colors duration-150 cursor-pointer"
                >
                  Add {pendingTags.length} tag{pendingTags.length > 1 ? 's' : ''}
                </button>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Remove Tag — multi-select */}
      <div className="relative">
        <button
          type="button"
          onClick={() => openMenu(setShowRemoveTagMenu)}
          className={btnCls}
          aria-label="Remove tags from selected events"
          aria-expanded={showRemoveTagMenu}
        >
          <Tag size={14} />
          <span className="hidden sm:inline">Remove Tag</span>
        </button>
        {showRemoveTagMenu && (
          <div className={`${popoverCls} w-44`}>
            <div className="max-h-48 overflow-y-auto app-scroll py-1.5">
              {allTags.map((tag) => {
                const selected = pendingRemoveTags.includes(tag)
                return (
                  <button
                    key={tag}
                    onClick={() => togglePendingRemoveTag(tag)}
                    className={`w-full flex items-center gap-2 px-3 py-1.5 text-xs transition-colors duration-150 cursor-pointer ${selected ? 'text-white bg-white/10' : 'text-gray-300 hover:bg-white/5'}`}
                    type="button"
                  >
                    <span className={`w-3.5 h-3.5 rounded border flex items-center justify-center shrink-0 ${selected ? 'bg-red-500 border-red-500' : 'border-gray-500'}`}>
                      {selected && <Check size={10} strokeWidth={3} />}
                    </span>
                    {tag}
                  </button>
                )
              })}
            </div>
            {pendingRemoveTags.length > 0 && (
              <div className="border-t border-gray-700 px-3 py-2">
                <button
                  type="button"
                  onClick={applyRemoveTags}
                  className="w-full rounded-lg py-1.5 text-xs font-medium bg-red-500 text-white hover:bg-red-600 transition-colors duration-150 cursor-pointer"
                >
                  Remove {pendingRemoveTags.length} tag{pendingRemoveTags.length > 1 ? 's' : ''}
                </button>
              </div>
            )}
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
          <div className={`${popoverCls} p-2 w-56`}>
            <div className="flex gap-1.5">
              <input
                type="text"
                value={personName}
                onChange={(e) => setPersonName(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleAddPerson()}
                placeholder="Person name"
                className="flex-1 min-w-0 text-xs border border-gray-600 rounded-lg px-2 py-1.5 placeholder:text-gray-500 focus:outline-none focus:border-secondary transition-colors duration-150"
                style={inputStyle}
                autoFocus
              />
              <button
                type="button"
                onClick={handleAddPerson}
                className="shrink-0 rounded-lg px-3 py-1.5 text-xs font-medium bg-secondary text-white hover:bg-secondary-hover transition-colors duration-150 cursor-pointer"
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
                className="w-16 text-xs border border-gray-600 rounded-lg px-2 py-1.5 focus:outline-none focus:border-secondary transition-colors duration-150 tabular-nums"
                style={inputStyle}
                autoFocus
              />
              <select
                value={shiftUnit}
                onChange={(e) => setShiftUnit(e.target.value)}
                className="flex-1 text-xs border border-gray-600 rounded-lg px-2 py-1.5 focus:outline-none focus:border-secondary transition-colors duration-150 cursor-pointer"
                style={selectStyle}
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
                className="flex-1 rounded-lg py-1.5 text-xs font-medium hover:bg-gray-600 transition-colors duration-150 cursor-pointer"
                style={earlierBtnStyle}
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
    </motion.div>
    </AnimatePresence>
  )
}
