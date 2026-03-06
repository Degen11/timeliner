import { useState, useEffect, useMemo, useRef, useCallback } from 'react'
import { X, Trash2, Plus, ImagePlus, ChevronDown, Check } from 'lucide-react'
import Button from '@/components/shared/Button'
import AnimatedModal from '@/components/shared/AnimatedModal'
import useTimelineStore from '@/store/useTimelineStore'
import { TAG_OPTIONS } from '@/utils/constants'
import { validateDateRange } from '@/utils/dateUtils'
import { getAllPeople } from '@/store/selectors'
import DatePicker from '@/components/shared/DatePicker'
import LocationInput from '@/components/shared/LocationInput'
import EventPhotoUploader from './EventPhotoUploader'
import { PhotoPreview } from './PhotoPreview'

export default function EditEventModal({ event, onClose }) {
  const updateEvent = useTimelineStore((s) => s.updateEvent)
  const deleteEvent = useTimelineStore((s) => s.deleteEvent)
  const showToast = useTimelineStore((s) => s.showToast)
  const customTags = useTimelineStore((s) => s.customTags)
  const addCustomTag = useTimelineStore((s) => s.addCustomTag)
  const events = useTimelineStore((s) => s.events)

  const knownPeople = useMemo(() => getAllPeople(events), [events])
  const [peopleSuggestions, setPeopleSuggestions] = useState([])
  const [activeSuggestion, setActiveSuggestion] = useState(-1)
  const peopleInputRef = useRef(null)
  const [photoUploaderOpen, setPhotoUploaderOpen] = useState(false)
  const [tagsOpen, setTagsOpen] = useState(false)
  const tagsRef = useRef(null)
  const addPhotoBtnRef = useRef(null)

  const [form, setForm] = useState({
    title: '',
    description: '',
    dateStart: '',
    dateEnd: '',
    datePrecision: 'day',
    people: '',
    location: '',
    tags: [],
  })
  const [newTag, setNewTag] = useState('')
  const [errors, setErrors] = useState({})
  const [confirmDelete, setConfirmDelete] = useState(false)
  const deleteTimerRef = useRef(null)

  // Populate form when event changes
  useEffect(() => {
    if (!event) return
    setForm({
      title: event.title || '',
      description: event.description || '',
      dateStart: event.dateStart || '',
      dateEnd: event.dateEnd || '',
      datePrecision: event.datePrecision || 'day',
      people: (event.people || []).join(', '),
      location: event.location || '',
      tags: event.tags || [],
    })
    setErrors({})
    setConfirmDelete(false)
    setPhotoUploaderOpen(false)
    setTagsOpen(false)
    clearTimeout(deleteTimerRef.current)
  }, [event])

  useEffect(() => () => clearTimeout(deleteTimerRef.current), [])

  // Close tags dropdown on click outside
  useEffect(() => {
    if (!tagsOpen) return
    const handler = (e) => {
      if (tagsRef.current && !tagsRef.current.contains(e.target)) setTagsOpen(false)
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [tagsOpen])

  // Get live event data for photos (may update after photo upload)
  const liveEvent = useMemo(() => {
    if (!event) return null
    return events.find((e) => e.id === event.id) || event
  }, [event, events])

  const handlePeopleChange = useCallback((value) => {
    setForm((prev) => ({ ...prev, people: value }))
    const parts = value.split(',')
    const current = parts[parts.length - 1].trim().toLowerCase()
    const alreadyAdded = parts.slice(0, -1).map((p) => p.trim().toLowerCase()).filter(Boolean)
    if (current.length > 0) {
      const matches = knownPeople.filter(
        (p) => p.toLowerCase().includes(current) && !alreadyAdded.includes(p.toLowerCase())
      )
      setPeopleSuggestions(matches.slice(0, 5))
    } else {
      setPeopleSuggestions([])
    }
    setActiveSuggestion(-1)
  }, [knownPeople])

  const acceptSuggestion = useCallback((person) => {
    setForm((prev) => {
      const parts = prev.people.split(',')
      parts[parts.length - 1] = ' ' + person
      return { ...prev, people: parts.join(',') + ', ' }
    })
    setPeopleSuggestions([])
    setActiveSuggestion(-1)
    peopleInputRef.current?.focus()
  }, [])

  const handlePeopleKeyDown = useCallback((e) => {
    if (peopleSuggestions.length === 0) return
    if (e.key === 'ArrowDown') {
      e.preventDefault()
      setActiveSuggestion((i) => Math.min(i + 1, peopleSuggestions.length - 1))
    } else if (e.key === 'ArrowUp') {
      e.preventDefault()
      setActiveSuggestion((i) => Math.max(i - 1, 0))
    } else if ((e.key === 'Enter' || e.key === 'Tab') && activeSuggestion >= 0) {
      e.preventDefault()
      acceptSuggestion(peopleSuggestions[activeSuggestion])
    }
  }, [peopleSuggestions, activeSuggestion, acceptSuggestion])

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

  const handleSave = (e) => {
    e.preventDefault()
    const errs = validate()
    if (Object.keys(errs).length > 0) {
      setErrors(errs)
      return
    }

    updateEvent(event.id, {
      title: form.title.trim(),
      description: form.description.trim() || null,
      dateStart: form.dateStart,
      dateEnd: form.dateEnd || null,
      datePrecision: form.datePrecision,
      people: form.people
        .split(',')
        .map((s) => s.trim())
        .filter(Boolean),
      location: form.location.trim() || null,
      tags: form.tags,
    })
    showToast('Event updated')
    onClose()
  }

  const handleDelete = () => {
    if (confirmDelete) {
      clearTimeout(deleteTimerRef.current)
      deleteEvent(event.id)
      showToast('Event deleted')
      onClose()
    } else {
      setConfirmDelete(true)
      deleteTimerRef.current = setTimeout(() => setConfirmDelete(false), 3000)
    }
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

  const inputCls = (field) =>
    `w-full rounded-lg px-3 py-2 text-sm text-text-default focus:outline-none focus:ring-2 focus:ring-secondary/20 edit-field-input ${
      errors[field] ? 'border-error' : ''
    }`

  const inputStyle = { border: '1px solid #94a3b8' }

  if (!event) return null

  return (
    <AnimatedModal
      open={!!event}
      onClose={onClose}
      className="bg-surface rounded-xl shadow-2xl max-w-lg w-full mx-4 max-h-[90vh] overflow-y-auto edit-modal-border"
    >
      <div className="flex items-center justify-between px-6 py-4 border-b edit-modal-divider">
        <h2 className="font-display text-lg font-semibold text-text-strong">Edit Event</h2>
        <button
          onClick={onClose}
          className="rounded-lg p-1.5 text-gray-400 hover:text-gray-700 hover:bg-gray-100 transition-colors cursor-pointer"
          aria-label="Close"
        >
          <X size={18} />
        </button>
      </div>

      <form onSubmit={handleSave} className="px-6 py-5 space-y-0 divide-y edit-modal-divide">
        {/* Title */}
        <div className="flex items-start gap-4 py-4 first:pt-0">
          <label className="shrink-0 w-28 text-sm font-semibold text-text-strong pt-2">
            Title <span className="text-error">*</span>
          </label>
          <div className="flex-1 min-w-0">
            <input
              type="text"
              value={form.title}
              onChange={(e) => setForm({ ...form, title: e.target.value })}
              className={inputCls('title')}
              style={inputStyle}
              placeholder="Event title"
            />
            {errors.title && <p className="text-xs text-error mt-1">{errors.title}</p>}
          </div>
        </div>

        {/* Description */}
        <div className="flex items-start gap-4 py-4">
          <label className="shrink-0 w-28 text-sm font-semibold text-text-strong pt-2">
            Description
          </label>
          <div className="flex-1 min-w-0">
            <textarea
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
              className={inputCls('description')}
              style={inputStyle}
              rows={3}
              placeholder="Optional description"
            />
          </div>
        </div>

        {/* Dates */}
        <div className="flex items-start gap-4 py-4">
          <label className="shrink-0 w-28 text-sm font-semibold text-text-strong pt-2">
            Dates <span className="text-error">*</span>
          </label>
          <div className="flex-1 min-w-0 space-y-3">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <span className="block text-xs text-text-muted mb-1">Start</span>
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
                <span className="block text-xs text-text-muted mb-1">End</span>
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
              <span className="block text-xs text-text-muted mb-1">Precision</span>
              <select
                value={form.datePrecision}
                onChange={(e) => setForm({ ...form, datePrecision: e.target.value })}
                className={inputCls('datePrecision')}
                style={inputStyle}
              >
                <option value="day">Exact day</option>
                <option value="month">Month</option>
                <option value="year">Year</option>
                <option value="decade">Decade</option>
                <option value="approximate">Approximate</option>
              </select>
            </div>
          </div>
        </div>

        {/* People */}
        <div className="flex items-start gap-4 py-4 relative">
          <label className="shrink-0 w-28 text-sm font-semibold text-text-strong pt-2">People</label>
          <div className="flex-1 min-w-0">
            <input
              ref={peopleInputRef}
              type="text"
              value={form.people}
              onChange={(e) => handlePeopleChange(e.target.value)}
              onKeyDown={handlePeopleKeyDown}
              onBlur={() => setTimeout(() => setPeopleSuggestions([]), 150)}
              className={inputCls('people')}
              style={inputStyle}
              placeholder="Comma-separated names"
              autoComplete="off"
            />
            {peopleSuggestions.length > 0 && (
              <div className="absolute z-10 mt-1 bg-surface rounded-lg shadow-lg py-1 max-h-40 overflow-y-auto" style={{ left: '7.5rem', right: 0, border: '1px solid #94a3b8' }}>
                {peopleSuggestions.map((person, i) => (
                  <button
                    key={person}
                    type="button"
                    onMouseDown={(e) => e.preventDefault()}
                    onClick={() => acceptSuggestion(person)}
                    className={`w-full text-left px-3 py-1.5 text-sm cursor-pointer transition-colors ${
                      i === activeSuggestion
                        ? 'bg-secondary/10 text-secondary'
                        : 'text-text-default hover:bg-gray-50'
                    }`}
                  >
                    {person}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Location */}
        <div className="flex items-start gap-4 py-4">
          <label className="shrink-0 w-28 text-sm font-semibold text-text-strong pt-2">Location</label>
          <div className="flex-1 min-w-0">
            <LocationInput
              value={form.location}
              onChange={(loc) => setForm((prev) => ({ ...prev, location: loc }))}
              placeholder="Search for a location..."
            />
          </div>
        </div>

        {/* Tags */}
        <div className="flex items-start gap-4 py-4">
          <label className="shrink-0 w-28 text-sm font-semibold text-text-strong pt-2">Tags</label>
          <div className="flex-1 min-w-0 relative" ref={tagsRef}>
            <button
              type="button"
              onClick={() => setTagsOpen((v) => !v)}
              className="w-full flex items-center gap-2 rounded-lg px-3 py-2 text-sm text-left cursor-pointer edit-field-input"
              style={inputStyle}
            >
              <span className="flex-1 min-w-0 truncate text-text-default">
                {form.tags.length > 0 ? (
                  <span className="flex flex-wrap gap-1">
                    {form.tags.map((t) => (
                      <span key={t} className="inline-flex items-center gap-1 rounded-md bg-secondary/10 text-secondary px-1.5 py-0.5 text-xs font-medium">
                        {t}
                        <button
                          type="button"
                          onClick={(e) => { e.stopPropagation(); toggleTag(t) }}
                          className="hover:text-error cursor-pointer"
                        >
                          <X size={10} />
                        </button>
                      </span>
                    ))}
                  </span>
                ) : (
                  <span className="text-gray-400">Select tags...</span>
                )}
              </span>
              <ChevronDown size={14} className={`text-gray-400 shrink-0 transition-transform ${tagsOpen ? 'rotate-180' : ''}`} />
            </button>

            {tagsOpen && (
              <div className="absolute z-20 left-0 right-0 mt-1 rounded-lg bg-surface shadow-lg py-1 max-h-52 overflow-y-auto" style={{ border: '1px solid #94a3b8' }}>
                {allTagOptions.map((tag) => {
                  const isActive = form.tags.includes(tag)
                  return (
                    <button
                      key={tag}
                      type="button"
                      onClick={() => toggleTag(tag)}
                      className={`w-full flex items-center gap-2 px-3 py-1.5 text-sm cursor-pointer transition-colors ${
                        isActive ? 'text-secondary bg-secondary/5' : 'text-text-default hover:bg-gray-50'
                      }`}
                    >
                      <span className={`w-4 h-4 rounded border flex items-center justify-center shrink-0 ${
                        isActive ? 'bg-secondary border-secondary' : ''
                      }`} style={!isActive ? { borderColor: '#94a3b8' } : undefined}>
                        {isActive && <Check size={10} className="text-white" />}
                      </span>
                      {tag}
                    </button>
                  )
                })}
                <div className="border-t mt-1 pt-1 px-2 pb-1" style={{ borderColor: '#94a3b8' }}>
                  <div className="flex items-center gap-1.5">
                    <input
                      value={newTag}
                      onChange={(e) => setNewTag(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          e.preventDefault()
                          handleAddCustomTag()
                        }
                      }}
                      placeholder="New tag..."
                      className="flex-1 min-w-0 rounded px-2 py-1 text-xs text-text-default focus:outline-none edit-field-input"
                      style={inputStyle}
                    />
                    <button
                      type="button"
                      onClick={handleAddCustomTag}
                      className="text-xs font-medium text-secondary hover:bg-secondary/10 rounded px-2 py-1 cursor-pointer"
                    >
                      Add
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Photos */}
        <div className="flex items-start gap-4 py-4">
          <label className="shrink-0 w-28 text-sm font-semibold text-text-strong pt-2">Photos</label>
          <div className="flex-1 min-w-0">
            <button
              ref={addPhotoBtnRef}
              type="button"
              onClick={() => setPhotoUploaderOpen(true)}
              className="flex items-center gap-1.5 rounded-lg px-2.5 py-1 text-xs font-medium text-secondary hover:bg-secondary/10 transition-colors cursor-pointer mb-2"
            >
              <ImagePlus size={13} />
              Add Photo
            </button>
            {liveEvent?.photos?.length > 0 ? (
              <PhotoPreview
                filenames={liveEvent.photos}
                onOpenLightbox={() => {}}
                editable
                eventId={event.id}
              />
            ) : (
              <p className="text-xs text-text-muted">No photos attached</p>
            )}
          </div>
        </div>

        {/* Actions */}
        <div className="flex items-center justify-between pt-5">
          <div>
            {confirmDelete ? (
              <button
                type="button"
                onClick={handleDelete}
                className="relative rounded-lg px-3 py-1.5 text-xs font-medium text-error bg-red-50 border border-red-200 hover:bg-red-100 transition-colors cursor-pointer overflow-hidden"
              >
                Confirm Delete
                <span className="absolute bottom-0 left-0 h-0.5 bg-error/40 animate-[countdown_3s_linear_forwards]" />
              </button>
            ) : (
              <button
                type="button"
                onClick={handleDelete}
                className="flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-medium text-gray-400 hover:text-error hover:bg-red-50 transition-colors cursor-pointer"
              >
                <Trash2 size={13} />
                Delete
              </button>
            )}
          </div>
          <div className="flex gap-3">
            <Button variant="secondary" type="button" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit">Save Changes</Button>
          </div>
        </div>
      </form>

      <EventPhotoUploader
        eventId={event.id}
        open={photoUploaderOpen}
        onClose={() => setPhotoUploaderOpen(false)}
        anchorRef={addPhotoBtnRef}
      />
    </AnimatedModal>
  )
}
