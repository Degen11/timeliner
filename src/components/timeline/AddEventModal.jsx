import { useMemo } from 'react'
import { X, Plus } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { Input, Textarea } from '@/components/ui/Input'
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from '@/components/ui/Select'
import AnimatedModal from '@/components/shared/AnimatedModal'
import useTimelineStore from '@/store/useTimelineStore'
import { generateId, DATE_PRECISION_OPTIONS } from '@/utils/constants'
import { getAllPeople } from '@/store/selectors'
import DatePicker from '@/components/shared/DatePicker'
import LocationInput from '@/components/shared/LocationInput'
import TagDropdown from '@/components/shared/TagDropdown'
import PeopleInput from '@/components/shared/PeopleInput'
import usePeopleAutocomplete from '@/hooks/usePeopleAutocomplete'
import useEventForm from '@/hooks/useEventForm'

export default function AddEventModal({ open, onClose }) {
  const addEvent = useTimelineStore((s) => s.addEvent)
  const showToast = useTimelineStore((s) => s.showToast)
  const events = useTimelineStore((s) => s.events)
  const knownPeople = useMemo(() => getAllPeople(events), [events])
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
      className="bg-surface rounded-xl shadow-2xl max-w-lg w-full mx-4 max-h-[90vh] overflow-y-auto app-scroll modal-surface"
    >
      <div className="flex items-center justify-between px-5 py-4 border-b border-gray-200">
        <h2 className="text-base font-semibold text-text-strong">Add Event</h2>
        <Button variant="ghost" size="icon" onClick={handleClose} aria-label="Close">
          <X size={16} />
        </Button>
      </div>

      <form onSubmit={handleSubmit} className="px-5 py-4 space-y-4">
        <div>
          <label className="block text-sm font-medium text-text-default mb-1">
            Title <span className="text-error">*</span>
          </label>
          <Input
            value={form.title}
            onChange={(e) => setForm({ ...form, title: e.target.value })}
            className={errors.title ? 'border-error focus-visible:border-error' : ''}
            placeholder="e.g., Graduated from college"
            autoFocus
          />
          {errors.title && <p className="text-xs text-error mt-1">{errors.title}</p>}
        </div>

        <div>
          <label className="block text-sm font-medium text-text-default mb-1">Description</label>
          <Textarea
            value={form.description}
            onChange={(e) => setForm({ ...form, description: e.target.value })}
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

        <div className="relative">
          <label className="block text-sm font-medium text-text-default mb-1">People</label>
          <PeopleInput
            people={people}
            value={form.people}
            onChange={setPeopleField}
            placeholder="Comma-separated names: John, Jane"
          />
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
