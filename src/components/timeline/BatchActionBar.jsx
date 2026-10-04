import { useState, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useHotkeys } from 'react-hotkeys-hook'
import clsx from 'clsx'
import { X, Tag, Trash2, UserPlus, CalendarClock, Check } from 'lucide-react'
import useTimelineStore from '@/store/useTimelineStore'
import { summarizeSelection } from '@/store/selectors'
import { TAG_OPTIONS, SPRING, BATCH_MENU_OFFSET, getTagPalette } from '@/utils/constants'
import useConfirmAction from '@/hooks/useConfirmAction'
import { isModalOpen } from '@/utils/modalStack'
import { Popover, PopoverTrigger, PopoverContent } from '@/components/ui/Popover'
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from '@/components/ui/Select'
import { Tooltip } from '@/components/ui/Tooltip'
import { haptic } from '@/utils/haptics'

const actionCls =
  'inline-flex h-11 sm:h-9 items-center gap-2 rounded-lg px-3 text-[13px] font-medium text-text-strong whitespace-nowrap hover:bg-soft-accent data-[state=open]:bg-soft-accent transition-colors duration-150 cursor-pointer'

const fieldCls =
  'min-w-0 rounded-lg border border-gray-200 bg-surface px-2.5 py-1.5 text-base sm:text-sm text-text-strong placeholder:text-text-muted focus:outline-none focus:border-gray-400 transition-colors duration-150'

const secondaryBtnCls =
  'rounded-lg border border-gray-200 bg-surface px-3 py-1.5 text-xs font-medium text-text-strong hover:bg-soft-accent transition-colors duration-150 cursor-pointer'

const primaryBtnCls =
  'rounded-lg bg-primary px-3 py-1.5 text-xs font-medium text-white dark:text-gray-50 hover:bg-primary-hover transition-colors duration-150 cursor-pointer'

// Keycap hint; hidden on touch-only devices where it can't be pressed
function Kbd({ children }) {
  return (
    <kbd className="hidden [@media(hover:hover)]:inline-flex min-w-[1.25rem] items-center justify-center rounded border border-b-2 border-gray-200 bg-surface-raised px-1 font-sans text-[11px] leading-4 text-text-muted">
      {children}
    </kbd>
  )
}

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
              className={clsx(
                'w-full flex items-center gap-2 px-3 py-1.5 text-xs capitalize transition-colors duration-150 cursor-pointer',
                selected ? 'text-text-strong bg-soft-accent' : 'text-text-default hover:bg-soft-accent'
              )}
              type="button"
              aria-pressed={selected}
            >
              <span className={clsx(
                'w-3.5 h-3.5 rounded border flex items-center justify-center shrink-0',
                selected
                  ? [actionColor === 'add' ? 'bg-primary border-primary text-white dark:text-gray-50' : 'bg-error border-error text-white']
                  : 'border-gray-300'
              )}>
                {selected && <Check size={10} strokeWidth={3} />}
              </span>
              <span
                className="size-2 shrink-0 rounded-[2px]"
                style={{ backgroundColor: getTagPalette(tag).activeBg }}
                aria-hidden="true"
              />
              {tag}
            </button>
          )
        })}
      </div>
      {pendingTags.length > 0 && (
        <div className="border-t border-gray-100 px-3 py-2">
          <button
            type="button"
            onClick={onApply}
            className={clsx(
              'w-full rounded-lg py-1.5 text-xs font-medium transition-colors duration-150 cursor-pointer',
              actionColor === 'add' ? 'bg-primary text-white dark:text-gray-50 hover:bg-primary-hover' : 'bg-error text-white hover:bg-red-700'
            )}
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
  const [tagMode, setTagMode] = useState('add')
  // Which action popover is open ('tag' | 'person' | 'dates' | null), so the
  // T / P / D shortcuts can open them
  const [openMenu, setOpenMenu] = useState(null)

  const events = useTimelineStore((s) => s.events)
  const deleteConfirm = useConfirmAction(batchDelete)

  const count = selectedEventIds.length

  const summary = (() => {
    if (count === 0) return null
    const selectedSet = new Set(selectedEventIds)
    return summarizeSelection(events.filter((e) => selectedSet.has(e.id)))
  })()

  const allTags = [...TAG_OPTIONS, ...customTags]

  const menuProps = (name, onOpenChange) => ({
    open: openMenu === name,
    onOpenChange: (open) => {
      setOpenMenu(open ? name : null)
      onOpenChange?.(open)
    },
  })

  const resetTagMenu = () => {
    setPendingTags([])
    setPendingRemoveTags([])
    setTagMode('add')
  }

  const hotkey = (name) => (e) => {
    if (isModalOpen()) return
    e.preventDefault()
    if (name === 'tag') resetTagMenu()
    setOpenMenu(name)
  }
  const hotkeyOptions = { enabled: count > 0, enableOnFormTags: false }
  useHotkeys('t', hotkey('tag'), hotkeyOptions)
  useHotkeys('p', hotkey('person'), hotkeyOptions)
  useHotkeys('d', hotkey('dates'), hotkeyOptions)

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
      haptic('heavy')
      deleteConfirm.confirm()
    } else {
      haptic('light')
      deleteConfirm.arm()
    }
  }

  return (
    <AnimatePresence>
    {count > 0 && (
    <motion.div
      ref={barRef}
      role="toolbar"
      aria-label="Selected events"
      initial={{ opacity: 0, y: 24 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: 24 }}
      transition={SPRING.SNAPPY}
      className="fixed bottom-20 sm:bottom-4 left-2 right-2 sm:left-1/2 sm:right-auto sm:-translate-x-1/2 sm:w-[36rem] sm:max-w-[calc(100vw-2rem)] z-[1090] flex flex-col overflow-hidden rounded-2xl border border-gray-200 bg-surface shadow-[0_20px_44px_-18px_rgba(60,45,20,0.32),0_2px_6px_-2px_rgba(60,45,20,0.08)] dark:shadow-[0_20px_44px_-12px_rgba(0,0,0,0.7)]"
    >
      {/* What's selected */}
      <div className="flex items-center gap-3 border-b border-gray-100 py-2 pl-4 pr-2">
        <span
          className="flex h-7 min-w-7 shrink-0 items-center justify-center rounded-full bg-primary px-2 text-[13px] font-semibold tabular-nums text-white dark:text-gray-50"
          aria-label={`${count} selected`}
        >
          {count}
        </span>
        <div className="flex min-w-0 flex-1 flex-col">
          <span className="truncate font-serif text-base font-medium leading-tight text-text-strong tabular-nums">
            {summary?.span || `${count} selected`}
          </span>
          {summary?.details.length > 0 && (
            <span className="truncate text-xs text-text-muted">{summary.details.join(' · ')}</span>
          )}
        </div>
        <Tooltip label="Deselect all" side="top">
          <button
            type="button"
            onClick={clearSelection}
            className="flex h-11 w-11 sm:h-9 sm:w-9 shrink-0 items-center justify-center rounded-lg text-text-muted hover:bg-soft-accent hover:text-text-strong transition-colors duration-150 cursor-pointer"
            aria-label="Deselect all events"
          >
            <X size={16} />
          </button>
        </Tooltip>
      </div>

      {/* Actions */}
      <div className="flex items-center gap-1 p-1.5 sm:p-2">
        {/* Tag (Add / Remove) */}
        <Popover {...menuProps('tag', resetTagMenu)}>
          <PopoverTrigger asChild>
            <button type="button" className={actionCls} aria-label="Manage tags on selected events" aria-keyshortcuts="T">
              <Tag size={15} className="text-text-muted" />
              <span className="hidden sm:inline">Tag</span>
              <Kbd>T</Kbd>
            </button>
          </PopoverTrigger>
          <PopoverContent side="top" align="start" sideOffset={BATCH_MENU_OFFSET} className="w-48 p-0">
            <div className="flex border-b border-gray-100">
              <button
                type="button"
                onClick={() => { setTagMode('add'); setPendingRemoveTags([]) }}
                className={clsx(
                  'flex-1 text-xs font-medium py-2 transition-colors duration-150 cursor-pointer',
                  tagMode === 'add' ? 'text-text-strong bg-soft-accent' : 'text-text-muted hover:bg-soft-accent'
                )}
                aria-pressed={tagMode === 'add'}
              >
                Add
              </button>
              <button
                type="button"
                onClick={() => { setTagMode('remove'); setPendingTags([]) }}
                className={clsx(
                  'flex-1 text-xs font-medium py-2 transition-colors duration-150 cursor-pointer',
                  tagMode === 'remove' ? 'text-text-strong bg-soft-accent' : 'text-text-muted hover:bg-soft-accent'
                )}
                aria-pressed={tagMode === 'remove'}
              >
                Remove
              </button>
            </div>
            <TagMenuContent
              allTags={allTags}
              pendingTags={tagMode === 'add' ? pendingTags : pendingRemoveTags}
              onToggle={tagMode === 'add' ? togglePendingTag : togglePendingRemoveTag}
              onApply={tagMode === 'add' ? applyAddTags : applyRemoveTags}
              actionLabel={tagMode === 'add' ? 'Add' : 'Remove'}
              actionColor={tagMode === 'add' ? 'add' : 'remove'}
            />
          </PopoverContent>
        </Popover>

        {/* Add person */}
        <Popover {...menuProps('person')}>
          <PopoverTrigger asChild>
            <button type="button" className={actionCls} aria-label="Add person to selected events" aria-keyshortcuts="P">
              <UserPlus size={15} className="text-text-muted" />
              <span className="hidden sm:inline">Add person</span>
              <Kbd>P</Kbd>
            </button>
          </PopoverTrigger>
          <PopoverContent side="top" align="start" sideOffset={BATCH_MENU_OFFSET} className="w-64 p-2">
            <div className="flex gap-1.5">
              <input
                type="text"
                value={personName}
                onChange={(e) => setPersonName(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleAddPerson()}
                placeholder="Person name"
                aria-label="Person name"
                className={clsx(fieldCls, 'flex-1')}
                autoFocus
              />
              <button type="button" onClick={handleAddPerson} className={clsx(primaryBtnCls, 'shrink-0')}>
                Add
              </button>
            </div>
          </PopoverContent>
        </Popover>

        {/* Shift dates */}
        <Popover {...menuProps('dates')}>
          <PopoverTrigger asChild>
            <button type="button" className={actionCls} aria-label="Shift dates of selected events" aria-keyshortcuts="D">
              <CalendarClock size={15} className="text-text-muted" />
              <span className="hidden sm:inline">Shift dates</span>
              <Kbd>D</Kbd>
            </button>
          </PopoverTrigger>
          <PopoverContent side="top" align="start" sideOffset={BATCH_MENU_OFFSET} className="w-60 p-3">
            <div className="flex gap-1.5 mb-2">
              <input
                type="number"
                min="1"
                inputMode="numeric"
                aria-label="Shift amount"
                value={shiftAmount}
                onChange={(e) => setShiftAmount(e.target.value)}
                className={clsx(fieldCls, 'w-16 tabular-nums')}
                autoFocus
              />
              <Select value={shiftUnit} onValueChange={setShiftUnit}>
                <SelectTrigger className="flex-1 h-auto py-1.5 text-sm" aria-label="Shift unit">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="day">Days</SelectItem>
                  <SelectItem value="month">Months</SelectItem>
                  <SelectItem value="year">Years</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="flex gap-1.5">
              <button type="button" onClick={() => handleShiftDates('back')} className={clsx(secondaryBtnCls, 'flex-1')}>
                &larr; Earlier
              </button>
              <button type="button" onClick={() => handleShiftDates('forward')} className={clsx(primaryBtnCls, 'flex-1')}>
                Later &rarr;
              </button>
            </div>
          </PopoverContent>
        </Popover>

        {/* Delete: set apart on the right, and says how many it removes */}
        <button
          type="button"
          onClick={handleDelete}
          className={clsx(
            'relative ml-auto inline-flex h-11 sm:h-9 items-center gap-2 overflow-hidden rounded-lg border px-3 text-[13px] font-medium whitespace-nowrap transition-colors duration-150 cursor-pointer',
            deleteConfirm.isArmed
              ? 'border-error bg-error text-white hover:bg-red-700'
              : 'border-red-200 text-error hover:bg-red-50 dark:border-red-500/30 dark:text-red-400 dark:hover:bg-red-500/10'
          )}
          aria-label={deleteConfirm.isArmed ? `Confirm delete ${count} selected events` : `Delete ${count} selected events`}
        >
          <Trash2 size={15} />
          <span>{deleteConfirm.isArmed ? 'Confirm' : `Delete ${count}`}</span>
          {deleteConfirm.isArmed && <span className="absolute bottom-0 left-0 h-0.5 bg-white/40 animate-[countdown_3s_linear_forwards]" />}
        </button>
      </div>
    </motion.div>
    )}
    </AnimatePresence>
  )
}
