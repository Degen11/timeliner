import { useState } from 'react'
import EventFormFields from '@/components/shared/EventFormFields'
import EventFormShell from '@/components/shared/EventFormShell'
import useTimelineStore from '@/store/useTimelineStore'
import { generateId } from '@/utils/constants'
import { getAllPeople } from '@/store/selectors'
import { countByField } from '@/utils/ui'
import usePeopleAutocomplete from '@/hooks/usePeopleAutocomplete'
import useEventForm from '@/hooks/useEventForm'

export default function AddEventModal({ open, onClose }) {
  const addEvent = useTimelineStore((s) => s.addEvent)
  const showToast = useTimelineStore((s) => s.showToast)
  const events = useTimelineStore((s) => s.events)
  const knownPeople = getAllPeople(events)
  const tagCounts = countByField(events, 'tags')
  const people = usePeopleAutocomplete(knownPeople)

  const [isSubmitting, setIsSubmitting] = useState(false)

  const {
    form, setForm, errors, setErrors, newTag, setNewTag,
    allTagOptions, validate, toggleTag, handleAddCustomTag,
    setPeopleField, getPeople, setRecurrence, addAttachment, removeAttachment, resetForm,
  } = useEventForm()

  const handleClose = () => {
    resetForm()
    setIsSubmitting(false)
    people.reset()
    onClose()
  }

  const handleSubmit = (e) => {
    e.preventDefault()
    if (isSubmitting) return
    const errs = validate()
    if (Object.keys(errs).length > 0) {
      setErrors(errs)
      return
    }

    setIsSubmitting(true)

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
      people: getPeople(),
      location: form.location.trim() || null,
      tags: form.tags,
      photos: [],
      recurrence: form.recurrence || null,
      attachments: form.attachments || [],
    }

    addEvent(event)
    showToast('Event added')
    handleClose()
  }

  return (
    <EventFormShell
      label="Add event"
      eyebrow="New event"
      open={open}
      onClose={handleClose}
      onSubmit={handleSubmit}
      isSubmitting={isSubmitting}
      submitLabel="Add event"
      submittingLabel="Adding…"
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
        autoFocusTitle
      />
    </EventFormShell>
  )
}
