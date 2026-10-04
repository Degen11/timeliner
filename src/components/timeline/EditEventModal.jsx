import { useState, useEffect, useRef } from 'react'
import { Trash2, Copy, ImagePlus, Image } from 'lucide-react'
import EventFormFields, { DisclosureRow } from '@/components/shared/EventFormFields'
import EventFormShell from '@/components/shared/EventFormShell'
import useTimelineStore from '@/store/useTimelineStore'
import { getAllPeople } from '@/store/selectors'
import { countByField, pluralize } from '@/utils/ui'
import EventPhotoUploader from './EventPhotoUploader'
import { PhotoPreview } from './PhotoPreview'
import { useResolvedPhotos } from '@/hooks/useResolvedPhotos'
import renderLightbox from '@/hooks/useLightbox'
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
  const tagCounts = countByField(events, 'tags')
  const people = usePeopleAutocomplete(knownPeople)
  const [photoUploaderOpen, setPhotoUploaderOpen] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [lightboxIndex, setLightboxIndex] = useState(null)
  const addPhotoBtnRef = useRef(null)

  const {
    form, setForm, errors, setErrors, newTag, setNewTag,
    allTagOptions, validate, toggleTag, handleAddCustomTag,
    setPeopleField, getPeople, setRecurrence, addAttachment, removeAttachment, resetForm,
  } = useEventForm()

  const deleteConfirm = useConfirmAction(() => {
    haptic('heavy')
    deleteEvent(event?.id)
    onClose()
  })

  const prevEventIdRef = useRef(null)

  useEffect(() => {
    if (!event) {
      prevEventIdRef.current = null
      return
    }
    if (event.id === prevEventIdRef.current) return
    prevEventIdRef.current = event.id
    resetForm({
      title: event.title || '',
      description: event.description || '',
      dateStart: event.dateStart || '',
      dateEnd: event.dateEnd || '',
      datePrecision: event.datePrecision || 'day',
      // Trailing separator marks every existing name as committed (chips)
      people: event.people?.length ? `${event.people.join(', ')}, ` : '',
      location: event.location || '',
      tags: event.tags || [],
      recurrence: event.recurrence || null,
      attachments: event.attachments || [],
    })
    setPhotoUploaderOpen(false)
    setIsSubmitting(false)
    people.reset()
    deleteConfirm.reset()
  }, [event, resetForm, people, deleteConfirm])

  const liveEvent = (() => {
    if (!event) return null
    return events.find((e) => e.id === event.id) || event
  })()

  // Resolve attached photos so the preview thumbnails can open a lightbox.
  // Order matches PhotoPreview's (filenames filtered to those with a URL).
  const resolvedPhotos = useResolvedPhotos(liveEvent?.photos || [])
  const lightboxPhotos = resolvedPhotos.filter((p) => p.url)

  const handleSave = (e) => {
    e.preventDefault()
    if (isSubmitting) return
    const errs = validate()
    if (Object.keys(errs).length > 0) {
      setErrors(errs)
      return
    }

    setIsSubmitting(true)

    updateEvent(event.id, {
      title: form.title.trim(),
      description: form.description.trim() || null,
      dateStart: form.dateStart,
      dateEnd: form.dateEnd || null,
      // Refresh dateRaw when the start date is manually changed so the original
      // AI-extracted raw text doesn't linger and misrepresent the new date.
      dateRaw: form.dateStart !== event.dateStart ? (form.dateStart || null) : event.dateRaw,
      datePrecision: form.datePrecision,
      people: getPeople(),
      location: form.location.trim() || null,
      tags: form.tags,
      recurrence: form.recurrence || null,
      attachments: form.attachments || [],
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

  const handleResolveFlag = () => {
    updateEvent(event.id, { flagged: false, flagReason: null })
    showToast('Marked as checked', { variant: 'success' })
  }

  if (!event) return null

  const photoCount = liveEvent?.photos?.length ?? 0
  const footerBtnCls =
    'flex items-center gap-1.5 rounded-lg px-2.5 h-11 sm:h-9 text-[13px] font-medium transition-colors duration-150 cursor-pointer touch-target'

  return (
    <EventFormShell
      label="Edit event"
      eyebrow="Edit event"
      open={!!event}
      onClose={onClose}
      onSubmit={handleSave}
      isSubmitting={isSubmitting}
      submitLabel="Save changes"
      submittingLabel="Saving…"
      footerStart={
        <>
          {deleteConfirm.isArmed ? (
            <button
              type="button"
              onClick={handleDelete}
              className={`${footerBtnCls} relative overflow-hidden border border-red-200 bg-red-50 text-error hover:bg-red-100 dark:border-red-500/30 dark:bg-red-500/10`}
            >
              Confirm delete
              <span className="absolute bottom-0 left-0 h-0.5 bg-error/40 animate-[countdown_3s_linear_forwards]" />
            </button>
          ) : (
            <button
              type="button"
              onClick={handleDelete}
              aria-label="Delete event"
              className={`${footerBtnCls} text-red-700 hover:bg-red-50 dark:text-red-400 dark:hover:bg-red-500/10`}
            >
              <Trash2 size={14} />
              <span className="hidden sm:inline">Delete</span>
            </button>
          )}
          <button
            type="button"
            onClick={() => {
              duplicateEvent(event.id)
              onClose()
            }}
            aria-label="Duplicate event"
            className={`${footerBtnCls} text-text-default hover:bg-surface hover:text-text-strong`}
          >
            <Copy size={14} />
            <span className="hidden sm:inline">Duplicate</span>
          </button>
        </>
      }
    >
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
        setRecurrence={setRecurrence}
        addAttachment={addAttachment}
        removeAttachment={removeAttachment}
        tagCounts={tagCounts}
        flag={liveEvent?.flagged ? { reason: liveEvent.flagReason, onResolve: handleResolveFlag } : null}
      >
        <DisclosureRow
          icon={Image}
          label="Photos"
          summary={photoCount > 0 ? pluralize(photoCount, 'photo') : 'None yet'}
          defaultOpen={photoCount > 0}
        >
          <button
            ref={addPhotoBtnRef}
            type="button"
            onClick={() => setPhotoUploaderOpen(true)}
            className="mb-2 flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 -ml-2.5 text-sm font-medium text-text-strong hover:bg-surface-raised transition-colors duration-150 cursor-pointer"
          >
            <ImagePlus size={14} />
            Add photo
          </button>
          {photoCount > 0 && (
            <PhotoPreview
              filenames={liveEvent.photos}
              onOpenLightbox={(i) => setLightboxIndex(i)}
              editable
              eventId={event.id}
            />
          )}
        </DisclosureRow>
      </EventFormFields>

      <EventPhotoUploader
        eventId={event.id}
        open={photoUploaderOpen}
        onClose={() => setPhotoUploaderOpen(false)}
        anchorRef={addPhotoBtnRef}
      />

      {renderLightbox({ photos: lightboxPhotos, lightboxIndex, setLightboxIndex })}
    </EventFormShell>
  )
}
