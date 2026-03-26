import { X, Plus } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import AnimatedModal from '@/components/shared/AnimatedModal'
import EventFormFields from '@/components/shared/EventFormFields'
import useTimelineStore from '@/store/useTimelineStore'
import { generateId } from '@/utils/constants'
import { getAllPeople } from '@/store/selectors'
import usePeopleAutocomplete from '@/hooks/usePeopleAutocomplete'
import useEventForm from '@/hooks/useEventForm'

export default function AddEventModal({ open, onClose }) {
  const addEvent = useTimelineStore((s) => s.addEvent)
  const showToast = useTimelineStore((s) => s.showToast)
  const events = useTimelineStore((s) => s.events)
  const knownPeople = getAllPeople(events)
  const people = usePeopleAutocomplete(knownPeople)

  const {
    form, setForm, errors, setErrors, newTag, setNewTag,
    allTagOptions, validate, toggleTag, handleAddCustomTag,
    setPeopleField, getPeople, resetForm,
  } = useEventForm()

  const handleClose = () => {
    resetForm()
    people.reset()
    onClose()
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
      people: getPeople(),
      location: form.location.trim() || null,
      tags: form.tags,
      photos: [],
    }

    addEvent(event)
    showToast('Event added')
    handleClose()
  }

  return (
    <AnimatedModal
      open={open}
      onClose={handleClose}
      className="bg-surface sm:rounded-xl shadow-2xl max-w-lg w-full sm:mx-4 max-h-[85vh] sm:max-h-[90vh] overflow-y-auto app-scroll modal-surface"
    >
      <div className="flex items-center justify-between px-5 py-4 border-b border-gray-200">
        <h2 className="text-base font-semibold text-text-strong">Add Event</h2>
        <Button variant="ghost" size="icon" onClick={handleClose} aria-label="Close">
          <X size={16} />
        </Button>
      </div>

      <form onSubmit={handleSubmit} className="px-5 py-4">
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
          autoFocusTitle
          layout="stacked"
        />

        <div className="flex flex-col-reverse sm:flex-row justify-end gap-2 sm:gap-3 pt-4 pb-2 sm:pb-0">
          <Button variant="secondary" type="button" onClick={handleClose} className="w-full sm:w-auto">
            Cancel
          </Button>
          <Button type="submit" className="w-full sm:w-auto">
            <Plus size={14} />
            Add Event
          </Button>
        </div>
      </form>
    </AnimatedModal>
  )
}
