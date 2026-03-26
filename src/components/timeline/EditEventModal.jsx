import { useState, useEffect, useRef } from 'react'
import { X, Trash2, Copy, ImagePlus } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import AnimatedModal from '@/components/shared/AnimatedModal'
import EventFormFields from '@/components/shared/EventFormFields'
import useTimelineStore from '@/store/useTimelineStore'
import { getAllPeople } from '@/store/selectors'
import EventPhotoUploader from './EventPhotoUploader'
import { PhotoPreview } from './PhotoPreview'
import usePeopleAutocomplete from '@/hooks/usePeopleAutocomplete'
import useEventForm from '@/hooks/useEventForm'
import useConfirmAction from '@/hooks/useConfirmAction'
import { haptic } from '@/utils/haptics'

export default function EditEventModal({ event, onClose }) {
  const updateEvent = useTimelineStore((s) => s.updateEvent)
  const deleteEvent = useTimelineStore((s) => s.deleteEvent)
  const duplicateEvent = useTimelineStore((s) => s.duplicateEvent)
  const showToast = useTimelineStore((s) => s.showToast)
  const events = useTimelineStore((s) => s.events)

  const knownPeople = getAllPeople(events)
  const people = usePeopleAutocomplete(knownPeople)
  const [photoUploaderOpen, setPhotoUploaderOpen] = useState(false)
  const addPhotoBtnRef = useRef(null)

  const {
    form, setForm, errors, setErrors, newTag, setNewTag,
    allTagOptions, validate, toggleTag, handleAddCustomTag,
    setPeopleField, getPeople, resetForm,
  } = useEventForm()

  const deleteConfirm = useConfirmAction(() => {
    haptic('heavy')
    deleteEvent(event?.id)
    onClose()
  })

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
    people.reset()
    deleteConfirm.reset()
  }, [event, resetForm, people, deleteConfirm])

  const liveEvent = (() => {
    if (!event) return null
    return events.find((e) => e.id === event.id) || event
  })()

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

  const sectionCls = 'flex flex-col sm:flex-row sm:items-start gap-1 sm:gap-4 py-3 sm:py-4'
  const labelCls = 'shrink-0 sm:w-28 text-sm font-semibold text-text-strong sm:pt-2'

  return (
    <AnimatedModal
      open={!!event}
      onClose={onClose}
      className="bg-surface sm:rounded-xl shadow-2xl max-w-lg w-full sm:mx-4 max-h-[85vh] sm:max-h-[90vh] overflow-y-auto app-scroll modal-surface"
    >
      <div className="flex items-center justify-between px-5 py-4 border-b border-gray-200">
        <h2 className="text-base font-semibold text-text-strong">Edit Event</h2>
        <Button variant="ghost" size="icon" onClick={onClose} aria-label="Close">
          <X size={16} />
        </Button>
      </div>

      <form onSubmit={handleSave} className="px-4 sm:px-5 py-4">
        <EventFormFields
          form={form}
          setForm={setForm}
          errors={errors}
          people={people}
          setPeopleField={setPeopleField}
          newTag={newTag}
          setNewTag={setNewTag}
          allTagOptions={allTagOptions}
          toggleTag={toggleTag}
          handleAddCustomTag={handleAddCustomTag}
          layout="horizontal"
        />

        {/* Photos — edit-only */}
        <div className={`${sectionCls} border-t border-gray-200`}>
          <label className={labelCls}>Photos</label>
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
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 pt-4 pb-2 sm:pb-0 border-t border-gray-200">
          <div className="flex items-center gap-1 order-2 sm:order-1">
            {deleteConfirm.isArmed ? (
              <button
                type="button"
                onClick={handleDelete}
                className="relative rounded-lg px-3 py-2 sm:py-1.5 text-xs font-medium text-error bg-red-50 border border-red-200 hover:bg-red-100 active:bg-red-100 transition-colors duration-150 cursor-pointer overflow-hidden touch-target"
              >
                Confirm Delete
                <span className="absolute bottom-0 left-0 h-0.5 bg-error/40 animate-[countdown_3s_linear_forwards]" />
              </button>
            ) : (
              <button
                type="button"
                onClick={handleDelete}
                className="flex items-center gap-1.5 rounded-lg px-3 py-2 sm:py-1.5 text-xs font-medium text-text-muted hover:text-error hover:bg-red-50 active:text-error active:bg-red-50 transition-colors duration-150 cursor-pointer touch-target"
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
              className="flex items-center gap-1.5 rounded-lg px-3 py-2 sm:py-1.5 text-xs font-medium text-text-muted hover:text-secondary hover:bg-secondary/10 active:text-secondary active:bg-secondary/10 transition-colors duration-150 cursor-pointer touch-target"
            >
              <Copy size={14} />
              Duplicate
            </button>
          </div>
          <div className="flex flex-col-reverse sm:flex-row gap-2 sm:gap-3 order-1 sm:order-2">
            <Button variant="secondary" type="button" onClick={onClose} className="w-full sm:w-auto">
              Cancel
            </Button>
            <Button type="submit" className="w-full sm:w-auto">Save Changes</Button>
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
