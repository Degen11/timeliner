import { useState, useRef, useMemo } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { X, Tag, Trash2, UserPlus, CalendarClock, Check } from 'lucide-react'
import useTimelineStore from '@/store/useTimelineStore'
import { TAG_OPTIONS } from '@/utils/constants'
import { safeGetUTCYear } from '@/utils/dateUtils'
import useConfirmAction from '@/hooks/useConfirmAction'
import { Popover, PopoverTrigger, PopoverContent } from '@/components/ui/Popover'

const btnCls =
  'flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-medium whitespace-nowrap hover:bg-white/10 transition-colors duration-150 cursor-pointer'

// Inline styles beat browser's color-scheme:dark user-agent overrides on form controls
const inputStyle = { colorScheme: 'normal', backgroundColor: '#1c1c1c', color: '#f0f0f0' }

function TagMenuContent({ allTags, pendingTags, onToggle, onApply, actionLabel, actionColor }) {
  return (
    <>
      <div className="max-h-48 overflow-y-auto app-scroll py-1.5">
        {allTags.map((tag) => {
          const selected = pendingTags.includes(tag)
          return (
            <button
              key={tag}
              onClick={() => onToggle(tag)}
              className={`w-full flex items-center gap-2 px-3 py-1.5 text-xs transition-colors duration-150 cursor-pointer ${selected ? 'text-white bg-white/10' : 'text-[#a1a1aa] hover:bg-white/5'}`}
              type="button"
            >
              <span className={`w-3.5 h-3.5 rounded border flex items-center justify-center shrink-0 ${selected ? `${actionColor === 'add' ? 'bg-[#52525b]' : 'bg-red-500'} text-white border-current` : 'border-[#52525b]'}`}>
                {selected && <Check size={10} strokeWidth={3} />}
              </span>
              {tag}
            </button>
          )
        })}
      </div>
      {pendingTags.length > 0 && (
        <div className="border-t border-[#3f3f46] px-3 py-2">
          <button
            type="button"
            onClick={onApply}
            className={`w-full rounded-lg py-1.5 text-xs font-medium text-white transition-colors duration-150 cursor-pointer ${actionColor === 'add' ? 'bg-[#52525b] hover:bg-[#71717a]' : 'bg-red-500 hover:bg-red-600'}`}
          >
            {actionLabel} {pendingTags.length} tag{pendingTags.length > 1 ? 's' : ''}
          </button>
        </div>
      )}
    </>
  )
}

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

  const [personName, setPersonName] = useState('')
  const [shiftAmount, setShiftAmount] = useState('1')
  const [shiftUnit, setShiftUnit] = useState('day')
  const [pendingTags, setPendingTags] = useState([])
  const [pendingRemoveTags, setPendingRemoveTags] = useState([])

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

  const togglePendingTag = (tag) => {
    setPendingTags((prev) => prev.includes(tag) ? prev.filter((t) => t !== tag) : [...prev, tag])
  }

  const togglePendingRemoveTag = (tag) => {
    setPendingRemoveTags((prev) => prev.includes(tag) ? prev.filter((t) => t !== tag) : [...prev, tag])
  }

  const applyAddTags = () => {
    if (pendingTags.length > 0) batchAddTags(pendingTags)
    setPendingTags([])
  }

  const applyRemoveTags = () => {
    if (pendingRemoveTags.length > 0) batchRemoveTags(pendingRemoveTags)
    setPendingRemoveTags([])
  }

  const handleAddPerson = () => {
    const trimmed = personName.trim()
    if (trimmed) {
      batchAddPerson(trimmed)
      setPersonName('')
    }
  }

  const handleShiftDates = (direction) => {
    const n = parseInt(shiftAmount, 10)
    if (!n || n <= 0) return
    batchShiftDates(direction === 'forward' ? n : -n, shiftUnit)
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
      className="fixed bottom-20 sm:bottom-4 left-2 right-2 sm:left-1/2 sm:right-auto sm:-translate-x-1/2 z-[1100] flex items-center gap-1 bg-[#27272a] text-[#f0f0f0] rounded-2xl shadow-2xl ring-1 ring-[#3f3f46] px-3 sm:px-4 py-2.5 max-w-2xl overflow-x-auto mobile-hide-scrollbar"
    >
      <span className="text-sm font-semibold whitespace-nowrap tabular-nums px-1">
        {count} selected
      </span>
      {summary && (
        <span className="text-xs text-[#a1a1aa] whitespace-nowrap hidden sm:inline">
          ({summary})
        </span>
      )}

      <span className="h-4 w-px bg-[#3f3f46] mx-1" />

      {/* Add Tag */}
      <Popover onOpenChange={() => setPendingTags([])}>
        <PopoverTrigger asChild>
          <button type="button" className={btnCls} aria-label="Add tags to selected events">
            <Tag size={14} />
            <span className="hidden sm:inline">Add Tag</span>
          </button>
        </PopoverTrigger>
        <PopoverContent side="top" className="w-44 p-0 border-[#3f3f46] bg-[#27272a]">
          <TagMenuContent
            allTags={allTags}
            pendingTags={pendingTags}
            onToggle={togglePendingTag}
            onApply={applyAddTags}
            actionLabel="Add"
            actionColor="add"
          />
        </PopoverContent>
      </Popover>

      {/* Remove Tag */}
      <Popover onOpenChange={() => setPendingRemoveTags([])}>
        <PopoverTrigger asChild>
          <button type="button" className={btnCls} aria-label="Remove tags from selected events">
            <Tag size={14} />
            <span className="hidden sm:inline">Remove Tag</span>
          </button>
        </PopoverTrigger>
        <PopoverContent side="top" className="w-44 p-0 border-[#3f3f46] bg-[#27272a]">
          <TagMenuContent
            allTags={allTags}
            pendingTags={pendingRemoveTags}
            onToggle={togglePendingRemoveTag}
            onApply={applyRemoveTags}
            actionLabel="Remove"
            actionColor="bg-red-500"
          />
        </PopoverContent>
      </Popover>

      {/* Add Person */}
      <Popover>
        <PopoverTrigger asChild>
          <button type="button" className={btnCls} aria-label="Add person to selected events">
            <UserPlus size={14} />
            <span className="hidden sm:inline">Add Person</span>
          </button>
        </PopoverTrigger>
        <PopoverContent side="top" className="w-56 p-2 border-[#3f3f46] bg-[#27272a]">
          <div className="flex gap-1.5">
            <input
              type="text"
              value={personName}
              onChange={(e) => setPersonName(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleAddPerson()}
              placeholder="Person name"
              className="flex-1 min-w-0 text-xs border border-[#3f3f46] rounded-lg px-2 py-1.5 placeholder:text-[#71717a] focus:outline-none focus:border-[#71717a] transition-colors duration-150"
              style={inputStyle}
              autoFocus
            />
            <button
              type="button"
              onClick={handleAddPerson}
              className="shrink-0 rounded-lg px-3 py-1.5 text-xs font-medium bg-[#52525b] text-white hover:bg-[#71717a] transition-colors duration-150 cursor-pointer"
            >
              Add
            </button>
          </div>
        </PopoverContent>
      </Popover>

      {/* Shift Dates */}
      <Popover>
        <PopoverTrigger asChild>
          <button type="button" className={btnCls} aria-label="Shift dates of selected events">
            <CalendarClock size={14} />
            <span className="hidden sm:inline">Shift Dates</span>
          </button>
        </PopoverTrigger>
        <PopoverContent side="top" className="w-56 p-3 border-[#3f3f46] bg-[#27272a]">
          <div className="flex gap-1.5 mb-2">
            <input
              type="number"
              min="1"
              value={shiftAmount}
              onChange={(e) => setShiftAmount(e.target.value)}
              className="w-16 text-xs border border-[#3f3f46] rounded-lg px-2 py-1.5 focus:outline-none focus:border-[#71717a] transition-colors duration-150 tabular-nums"
              style={inputStyle}
              autoFocus
            />
            <select
              value={shiftUnit}
              onChange={(e) => setShiftUnit(e.target.value)}
              className="flex-1 text-xs border border-[#3f3f46] rounded-lg px-2 py-1.5 focus:outline-none focus:border-[#71717a] transition-colors duration-150 cursor-pointer appearance-none"
              style={inputStyle}
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
              className="flex-1 rounded-lg py-1.5 text-xs font-medium bg-[#3f3f46] text-[#e4e4e7] hover:bg-[#3f3f46] transition-colors duration-150 cursor-pointer"
            >
              &larr; Earlier
            </button>
            <button
              type="button"
              onClick={() => handleShiftDates('forward')}
              className="flex-1 rounded-lg py-1.5 text-xs font-medium bg-[#52525b] text-white hover:bg-[#71717a] transition-colors duration-150 cursor-pointer"
            >
              Later &rarr;
            </button>
          </div>
        </PopoverContent>
      </Popover>

      <span className="h-4 w-px bg-[#3f3f46] mx-1" />

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

      <span className="h-4 w-px bg-[#3f3f46] mx-1" />

      {/* Deselect */}
      <button
        type="button"
        onClick={clearSelection}
        className="rounded-lg p-2 sm:p-1.5 hover:bg-white/10 active:bg-white/10 transition-colors duration-150 cursor-pointer touch-target"
        title="Deselect all"
        aria-label="Deselect all events"
      >
        <X size={14} />
      </button>
    </motion.div>
    </AnimatePresence>
  )
}
