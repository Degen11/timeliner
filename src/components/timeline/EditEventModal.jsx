import { useState, useEffect, useMemo, useRef, useCallback } from 'react'
import { X, Trash2, Copy, ImagePlus, ChevronDown, Check } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { Input, Textarea } from '@/components/ui/Input'
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from '@/components/ui/Select'
import Badge from '@/components/shared/Badge'
import AnimatedModal from '@/components/shared/AnimatedModal'
import useTimelineStore from '@/store/useTimelineStore'
import { getTagPalette, DATE_PRECISION_OPTIONS } from '@/utils/constants'
import { getAllPeople } from '@/store/selectors'
import { inputCls, dropdownCls } from '@/utils/ui'
import DatePicker from '@/components/shared/DatePicker'
import LocationInput from '@/components/shared/LocationInput'
import EventPhotoUploader from './EventPhotoUploader'
import { PhotoPreview } from './PhotoPreview'
import PeopleInput from '@/components/shared/PeopleInput'
import usePeopleAutocomplete from '@/hooks/usePeopleAutocomplete'
import useEventForm from '@/hooks/useEventForm'
import useClickOutside from '@/hooks/useClickOutside'
import useConfirmAction from '@/hooks/useConfirmAction'

export default function EditEventModal({ event, onClose }) {
  const updateEvent = useTimelineStore((s) => s.updateEvent)
  const deleteEvent = useTimelineStore((s) => s.deleteEvent)
  const duplicateEvent = useTimelineStore((s) => s.duplicateEvent)
  const showToast = useTimelineStore((s) => s.showToast)
  const events = useTimelineStore((s) => s.events)

  const knownPeople = useMemo(() => getAllPeople(events), [events])
  const people = usePeopleAutocomplete(knownPeople)
  const [photoUploaderOpen, setPhotoUploaderOpen] = useState(false)
  const [tagsOpen, setTagsOpen] = useState(false)
  const tagsRef = useRef(null)
  const addPhotoBtnRef = useRef(null)

  const closeTags = useCallback(() => setTagsOpen(false), [])
  useClickOutside(tagsRef, closeTags, tagsOpen)

  const {
    form, setForm, errors, setErrors, newTag, setNewTag,
    allTagOptions, validate, toggleTag, handleAddCustomTag,
    setPeopleField, getPeople, resetForm,
  } = useEventForm()

  const deleteConfirm = useConfirmAction(
    useCallback(() => {
      deleteEvent(event?.id)
      onClose()
    }, [event?.id, deleteEvent, onClose])
  )

  useEffect(() => {
    if (!event) return
    resetForm({
      title: event.title || '',
      description: event.description || '',
      dateStart: event.dateStart || '',
      dateEnd: event.dateEnd || '',
      datePrecision: event.datePrecision || 'day',
      people: (event.people || []).join(', '),
      location: event.location || '',
      tags: event.tags || [],
    })
    setPhotoUploaderOpen(false)
    setTagsOpen(false)
    people.reset()
    deleteConfirm.reset()
  }, [event])

  const liveEvent = useMemo(() => {
    if (!event) return null
    return events.find((e) => e.id === event.id) || event
  }, [event, events])

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
      people: getPeople(),
      location: form.location.trim() || null,
      tags: form.tags,
    })
    showToast('Event updated')
    onClose()
  }

  const handleDelete = () => {
    if (deleteConfirm.isArmed) {
      deleteConfirm.confirm()
    } else {
      deleteConfirm.arm()
    }
  }

  if (!event) return null

  return (
    <AnimatedModal
      open={!!event}
      onClose={onClose}
      className="bg-surface rounded-xl shadow-2xl max-w-lg w-full mx-4 max-h-[90vh] overflow-y-auto app-scroll modal-surface"
    >
      <div className="flex items-center justify-between px-5 py-4 border-b border-gray-200">
        <h2 className="text-base font-semibold text-text-strong">Edit Event</h2>
        <Button variant="ghost" size="icon" onClick={onClose} aria-label="Close">
          <X size={16} />
        </Button>
      </div>

      <form onSubmit={handleSave} className="px-5 py-4 space-y-0 divide-y divide-gray-200">
        {/* Title */}
        <div className="flex items-start gap-4 py-4 first:pt-0">
          <label className="shrink-0 w-28 text-sm font-semibold text-text-strong pt-2">
            Title <span className="text-error">*</span>
          </label>
          <div className="flex-1 min-w-0">
            <Input
              value={form.title}
              onChange={(e) => setForm({ ...form, title: e.target.value })}
              className={errors.title ? 'border-error focus-visible:border-error' : ''}
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
            <Textarea
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
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
              <Select
                value={form.datePrecision}
                onValueChange={(v) => setForm({ ...form, datePrecision: v })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {DATE_PRECISION_OPTIONS.map(({ value, label }) => (
                    <SelectItem key={value} value={value}>{label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>

        {/* People */}
        <div className="flex items-start gap-4 py-4 relative">
          <label className="shrink-0 w-28 text-sm font-semibold text-text-strong pt-2">People</label>
          <div className="flex-1 min-w-0">
            <PeopleInput
              people={people}
              value={form.people}
              onChange={setPeopleField}
              className={inputCls()}
            />
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
              className={`${inputCls()} text-left flex items-center gap-2 cursor-pointer`}
            >
              <span className="flex-1 min-w-0 truncate text-text-default">
                {form.tags.length > 0 ? (
                  <span className="flex flex-wrap gap-1">
                    {form.tags.map((t) => (
                      <Badge key={t} variant={t}>
                        {t}
                        <button
                          type="button"
                          onClick={(e) => { e.stopPropagation(); toggleTag(t) }}
                          className="hover:opacity-70 cursor-pointer ml-0.5"
                        >
                          <X size={10} />
                        </button>
                      </Badge>
                    ))}
                  </span>
                ) : (
                  <span className="text-text-muted">Select tags...</span>
                )}
              </span>
              <ChevronDown size={14} className={`text-text-muted shrink-0 transition-transform duration-150 ${tagsOpen ? 'rotate-180' : ''}`} />
            </button>

            {tagsOpen && (
              <div className={`${dropdownCls} left-0 right-0 max-h-52 overflow-y-auto app-scroll`}>
                {allTagOptions.map((tag) => {
                  const isActive = form.tags.includes(tag)
                  const palette = getTagPalette(tag)
                  return (
                    <button
                      key={tag}
                      type="button"
                      onClick={() => toggleTag(tag)}
                      className={`w-full flex items-center gap-2 px-3 py-2 text-sm cursor-pointer transition-colors duration-150 ${
                        isActive ? 'text-secondary bg-secondary/5' : 'text-text-default hover:bg-surface-raised'
                      }`}
                    >
                      <span
                        className="w-2.5 h-2.5 rounded-full shrink-0"
                        style={{ backgroundColor: palette.activeBg }}
                      />
                      <span className="flex-1">{tag}</span>
                      {isActive && <Check size={14} className="text-secondary shrink-0" />}
                    </button>
                  )
                })}
                <div className="border-t border-gray-200 mt-1 pt-1 px-3 pb-1">
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
                      className="flex-1 min-w-0 rounded-lg border border-gray-200 bg-canvas px-2 py-1 text-sm text-text-default focus:outline-none focus:ring-2 focus:ring-secondary/15 focus:border-secondary transition-colors"
                    />
                    <button
                      type="button"
                      onClick={handleAddCustomTag}
                      className="text-sm font-medium text-secondary hover:bg-secondary/10 rounded-lg px-2 py-1 cursor-pointer transition-colors duration-150"
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
              className="flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-xs font-medium text-secondary hover:bg-secondary/10 transition-colors duration-150 cursor-pointer mb-2"
            >
              <ImagePlus size={14} />
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
          <div className="flex items-center gap-1">
            {deleteConfirm.isArmed ? (
              <button
                type="button"
                onClick={handleDelete}
                className="relative rounded-lg px-3 py-1.5 text-xs font-medium text-error bg-red-50 border border-red-200 hover:bg-red-100 transition-colors duration-150 cursor-pointer overflow-hidden"
              >
                Confirm Delete
                <span className="absolute bottom-0 left-0 h-0.5 bg-error/40 animate-[countdown_3s_linear_forwards]" />
              </button>
            ) : (
              <button
                type="button"
                onClick={handleDelete}
                className="flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-medium text-text-muted hover:text-error hover:bg-red-50 transition-colors duration-150 cursor-pointer"
              >
                <Trash2 size={14} />
                Delete
              </button>
            )}
            <button
              type="button"
              onClick={() => {
                duplicateEvent(event.id)
                onClose()
              }}
              className="flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-medium text-text-muted hover:text-secondary hover:bg-secondary/10 transition-colors duration-150 cursor-pointer"
            >
              <Copy size={14} />
              Duplicate
            </button>
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
