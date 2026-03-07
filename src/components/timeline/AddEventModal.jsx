import { useState, useMemo, useCallback, useRef, useEffect } from 'react'
import { X, Plus, ChevronDown, Check } from 'lucide-react'
import Button from '@/components/shared/Button'
import AnimatedModal from '@/components/shared/AnimatedModal'
import useTimelineStore from '@/store/useTimelineStore'
import { TAG_OPTIONS, getTagButtonColor, getTagPalette, generateId } from '@/utils/constants'
import { validateDateRange } from '@/utils/dateUtils'
import { getAllPeople } from '@/store/selectors'
import DatePicker from '@/components/shared/DatePicker'
import LocationInput from '@/components/shared/LocationInput'
import usePeopleAutocomplete from '@/hooks/usePeopleAutocomplete'

function TagDropdown({ allTagOptions, selectedTags, onToggleTag, newTag, onNewTagChange, onAddCustomTag }) {
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

  return (
    <div className="relative" ref={ref}>
      <label className="block text-sm font-medium text-text-default mb-1">Tags</label>
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className="w-full rounded-lg border border-gray-200 bg-canvas px-3 py-2 text-sm text-left flex items-center gap-2 focus:outline-none focus:ring-2 focus:ring-secondary/20 focus:border-secondary cursor-pointer"
      >
        <div className="flex-1 flex flex-wrap gap-1 min-h-[20px]">
          {selectedTags.length === 0 ? (
            <span className="text-text-muted">Select tags...</span>
          ) : (
            selectedTags.map((tag) => {
              const palette = getTagPalette(tag)
              return (
                <span
                  key={tag}
                  className="inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-semibold border"
                  style={{ backgroundColor: palette.bg, color: palette.text, borderColor: palette.border }}
                >
                  {tag}
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation()
                      onToggleTag(tag)
                    }}
                    className="hover:opacity-70 cursor-pointer"
                  >
                    <X size={10} />
                  </button>
                </span>
              )
            })
          )}
        </div>
        <ChevronDown size={14} className={`text-text-muted shrink-0 transition-transform ${open ? 'rotate-180' : ''}`} />
      </button>

      {open && (
        <div className="absolute z-20 left-0 right-0 mt-1 bg-surface rounded-lg border border-gray-200 shadow-lg py-1 max-h-52 overflow-y-auto">
          {allTagOptions.map((tag) => {
            const isActive = selectedTags.includes(tag)
            const palette = getTagPalette(tag)
            return (
              <button
                key={tag}
                type="button"
                onClick={() => onToggleTag(tag)}
                className="w-full text-left px-3 py-1.5 text-sm cursor-pointer transition-colors flex items-center gap-2 hover:bg-surface-raised"
              >
                <span
                  className="w-2.5 h-2.5 rounded-full shrink-0"
                  style={{ backgroundColor: palette.activeBg }}
                />
                <span className="flex-1 text-text-default">{tag}</span>
                {isActive && <Check size={14} className="text-secondary shrink-0" />}
              </button>
            )
          })}
          <div className="border-t border-gray-100 mt-1 pt-1 px-3 pb-1">
            <div className="flex items-center gap-1.5">
              <input
                value={newTag}
                onChange={(e) => onNewTagChange(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault()
                    onAddCustomTag()
                  }
                }}
                placeholder="Create new tag..."
                className="flex-1 min-w-0 rounded-md border border-gray-200 bg-canvas px-2 py-1 text-sm text-text-default focus:outline-none focus:ring-2 focus:ring-secondary/20 focus:border-secondary"
                onClick={(e) => e.stopPropagation()}
              />
              <button
                type="button"
                onClick={onAddCustomTag}
                className="rounded-md px-2 py-1 text-sm font-medium text-secondary hover:bg-secondary/10 transition-colors cursor-pointer"
              >
                Add
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

const INITIAL_FORM = {
  title: '',
  description: '',
  dateStart: '',
  dateEnd: '',
  datePrecision: 'day',
  people: '',
  location: '',
  tags: [],
}

export default function AddEventModal({ open, onClose }) {
  const addEvent = useTimelineStore((s) => s.addEvent)
  const showToast = useTimelineStore((s) => s.showToast)
  const customTags = useTimelineStore((s) => s.customTags)
  const addCustomTag = useTimelineStore((s) => s.addCustomTag)
  const events = useTimelineStore((s) => s.events)
  const knownPeople = useMemo(() => getAllPeople(events), [events])
  const people = usePeopleAutocomplete(knownPeople)

  const [form, setForm] = useState(INITIAL_FORM)
  const [newTag, setNewTag] = useState('')
  const [errors, setErrors] = useState({})

  const setPeopleField = useCallback((valOrFn) => {
    if (typeof valOrFn === 'function') {
      setForm((prev) => ({ ...prev, people: valOrFn(prev.people) }))
    } else {
      setForm((prev) => ({ ...prev, people: valOrFn }))
    }
  }, [])

  const handleClose = () => {
    setForm(INITIAL_FORM)
    setNewTag('')
    setErrors({})
    people.reset()
    onClose()
  }

  const allTagOptions = useMemo(() => {
    const set = new Set([...TAG_OPTIONS, ...customTags])
    return [...set].sort()
  }, [customTags])

  const validate = () => {
    const errs = {}
    if (!form.title.trim()) errs.title = 'Title is required'
    if (!form.dateStart) errs.dateStart = 'Start date is required'
    if (form.dateStart && form.dateEnd) {
      const range = validateDateRange(form.dateStart, form.dateEnd)
      if (!range.valid) errs.dateEnd = range.error
    }
    return errs
  }

  const handleSubmit = (e) => {
    e.preventDefault()
    const errs = validate()
    if (Object.keys(errs).length > 0) {
      setErrors(errs)
      return
    }

    const event = {
      id: generateId(),
      title: form.title.trim(),
      description: form.description.trim() || null,
      dateStart: form.dateStart,
      dateEnd: form.dateEnd || null,
      dateRaw: form.dateStart,
      datePrecision: form.datePrecision,
      flagged: false,
      flagReason: null,
      people: form.people
        .split(',')
        .map((s) => s.trim())
        .filter(Boolean),
      location: form.location.trim() || null,
      tags: form.tags,
      photos: [],
    }

    addEvent(event)
    showToast('Event added')
    handleClose()
  }

  const toggleTag = (tag) => {
    setForm((prev) => ({
      ...prev,
      tags: prev.tags.includes(tag) ? prev.tags.filter((t) => t !== tag) : [...prev.tags, tag],
    }))
  }

  const handleAddCustomTag = () => {
    const trimmed = newTag.trim().toLowerCase()
    if (!trimmed) return
    addCustomTag(trimmed)
    if (!form.tags.includes(trimmed)) {
      setForm((prev) => ({ ...prev, tags: [...prev.tags, trimmed] }))
    }
    setNewTag('')
  }

  const fieldCls = (field) =>
    `w-full rounded-lg border px-3 py-2 text-sm text-text-default bg-canvas focus:outline-none focus:ring-2 focus:ring-secondary/20 ${
      errors[field] ? 'border-error focus:border-error' : 'border-gray-200 focus:border-secondary'
    }`

  return (
    <AnimatedModal
      open={open}
      onClose={handleClose}
      className="bg-surface rounded-xl shadow-2xl max-w-lg w-full mx-4 max-h-[90vh] overflow-y-auto modal-surface"
    >
      <div className="flex items-center justify-between p-5 border-b border-gray-200">
        <h2 className="font-display text-lg font-semibold text-text-strong">Add Event</h2>
        <button
          onClick={handleClose}
          className="rounded-lg p-1.5 text-gray-400 hover:text-gray-700 hover:bg-surface-raised transition-colors cursor-pointer"
          aria-label="Close"
        >
          <X size={18} />
        </button>
      </div>

      <form onSubmit={handleSubmit} className="p-5 space-y-4">
        <div>
          <label className="block text-sm font-medium text-text-default mb-1">
            Title <span className="text-error">*</span>
          </label>
          <input
            type="text"
            value={form.title}
            onChange={(e) => setForm({ ...form, title: e.target.value })}
            className={fieldCls('title')}
            placeholder="e.g., Graduated from college"
            autoFocus
          />
          {errors.title && <p className="text-xs text-error mt-1">{errors.title}</p>}
        </div>

        <div>
          <label className="block text-sm font-medium text-text-default mb-1">Description</label>
          <textarea
            value={form.description}
            onChange={(e) => setForm({ ...form, description: e.target.value })}
            className={fieldCls('description')}
            rows={2}
            placeholder="Optional description"
          />
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-sm font-medium text-text-default mb-1">
              Start Date <span className="text-error">*</span>
            </label>
            <DatePicker
              value={form.dateStart}
              onChange={(v, p) =>
                setForm({ ...form, dateStart: v, ...(p ? { datePrecision: p } : {}) })
              }
              precision={form.datePrecision}
              error={errors.dateStart}
              placeholder="Pick a date"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-text-default mb-1">End Date</label>
            <DatePicker
              value={form.dateEnd}
              onChange={(v) => setForm((prev) => ({ ...prev, dateEnd: v }))}
              precision={form.datePrecision}
              error={errors.dateEnd}
              placeholder="Optional"
            />
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-text-default mb-1">Date Precision</label>
          <select
            value={form.datePrecision}
            onChange={(e) => setForm({ ...form, datePrecision: e.target.value })}
            className={fieldCls('datePrecision')}
          >
            <option value="day">Exact day</option>
            <option value="month">Month</option>
            <option value="year">Year</option>
            <option value="decade">Decade</option>
            <option value="approximate">Approximate</option>
          </select>
        </div>

        <div className="relative">
          <label className="block text-sm font-medium text-text-default mb-1">People</label>
          <input
            ref={people.inputRef}
            type="text"
            value={form.people}
            onChange={(e) => people.handleChange(e.target.value, setPeopleField)}
            onKeyDown={(e) => people.handleKeyDown(e, (p) => people.accept(p, setPeopleField))}
            onBlur={people.dismiss}
            className={fieldCls('people')}
            placeholder="Comma-separated names: John, Jane"
            autoComplete="off"
          />
          {people.suggestions.length > 0 && (
            <div className="absolute z-10 left-0 right-0 mt-1 bg-surface rounded-lg border border-gray-200 shadow-lg py-1 max-h-40 overflow-y-auto">
              {people.suggestions.map((person, i) => (
                <button
                  key={person}
                  type="button"
                  onMouseDown={(e) => e.preventDefault()}
                  onClick={() => people.accept(person, setPeopleField)}
                  className={`w-full text-left px-3 py-1.5 text-sm cursor-pointer transition-colors ${
                    i === people.activeIndex
                      ? 'bg-secondary/10 text-secondary'
                      : 'text-text-default hover:bg-surface-raised'
                  }`}
                >
                  {person}
                </button>
              ))}
            </div>
          )}
        </div>

        <div>
          <label className="block text-sm font-medium text-text-default mb-1">Location</label>
          <LocationInput
            value={form.location}
            onChange={(loc) => setForm((prev) => ({ ...prev, location: loc }))}
            placeholder="Search for a location..."
          />
        </div>

        <TagDropdown
          allTagOptions={allTagOptions}
          selectedTags={form.tags}
          onToggleTag={toggleTag}
          newTag={newTag}
          onNewTagChange={setNewTag}
          onAddCustomTag={handleAddCustomTag}
        />

        <div className="flex justify-end gap-3 pt-2">
          <Button variant="secondary" type="button" onClick={handleClose}>
            Cancel
          </Button>
          <Button type="submit">
            <Plus size={14} />
            Add Event
          </Button>
        </div>
      </form>
    </AnimatedModal>
  )
}
