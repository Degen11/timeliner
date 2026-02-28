import { useState, useMemo } from 'react'
import { X, Plus } from 'lucide-react'
import Button from '@/components/shared/Button'
import AnimatedModal from '@/components/shared/AnimatedModal'
import useTimelineStore from '@/store/useTimelineStore'
import { TAG_OPTIONS, getTagButtonColor, generateId } from '@/utils/constants'
import { validateDateRange } from '@/utils/dateUtils'
import DatePicker from '@/components/shared/DatePicker'

export default function AddEventModal({ open, onClose }) {
  const addEvent = useTimelineStore((s) => s.addEvent)
  const showToast = useTimelineStore((s) => s.showToast)
  const customTags = useTimelineStore((s) => s.customTags)
  const addCustomTag = useTimelineStore((s) => s.addCustomTag)

  const allTagOptions = useMemo(() => {
    const set = new Set([...TAG_OPTIONS, ...customTags])
    return [...set].sort()
  }, [customTags])

  const [form, setForm] = useState({
    title: '',
    description: '',
    dateStart: '',
    dateEnd: '',
    datePrecision: 'day',
    people: '',
    tags: [],
  })

  const [newTag, setNewTag] = useState('')
  const [errors, setErrors] = useState({})

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
      tags: form.tags,
      photos: [],
    }

    addEvent(event)
    showToast('Event added')
    setForm({
      title: '',
      description: '',
      dateStart: '',
      dateEnd: '',
      datePrecision: 'day',
      people: '',
      tags: [],
    })
    setNewTag('')
    setErrors({})
    onClose()
  }

  const toggleTag = (tag) => {
    setForm((prev) => ({
      ...prev,
      tags: prev.tags.includes(tag)
        ? prev.tags.filter((t) => t !== tag)
        : [...prev.tags, tag],
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
    `w-full rounded-lg border px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-secondary/20 ${
      errors[field]
        ? 'border-error focus:border-error'
        : 'border-gray-200 focus:border-secondary'
    }`

  return (
    <AnimatedModal open={open} onClose={onClose} className="bg-white rounded-xl shadow-2xl max-w-lg w-full mx-4 max-h-[90vh] overflow-y-auto">
      <div className="flex items-center justify-between p-5 border-b border-gray-100">
        <h2 className="font-display text-lg font-semibold text-gray-900">Add Event</h2>
        <button
          onClick={onClose}
          className="rounded-lg p-1.5 text-gray-400 hover:text-gray-700 hover:bg-gray-100 transition-colors cursor-pointer"
          aria-label="Close"
        >
          <X size={18} />
        </button>
      </div>

      <form onSubmit={handleSubmit} className="p-5 space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
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
          <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
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
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Start Date <span className="text-error">*</span>
            </label>
            <DatePicker
              value={form.dateStart}
              onChange={(v, p) => setForm({ ...form, dateStart: v, ...(p ? { datePrecision: p } : {}) })}
              precision={form.datePrecision}
              error={errors.dateStart}
              placeholder="Pick a date"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">End Date</label>
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
          <label className="block text-sm font-medium text-gray-700 mb-1">Date Precision</label>
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

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">People</label>
          <input
            type="text"
            value={form.people}
            onChange={(e) => setForm({ ...form, people: e.target.value })}
            className={fieldCls('people')}
            placeholder="Comma-separated names: John, Jane"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Tags</label>
          <div className="flex flex-wrap gap-1.5">
            {allTagOptions.map((tag) => {
              const colors = getTagButtonColor(tag)
              return (
                <button
                  key={tag}
                  type="button"
                  onClick={() => toggleTag(tag)}
                  className={`rounded-full px-3 py-1 text-xs font-medium transition-colors cursor-pointer ${
                    form.tags.includes(tag) ? colors.active : colors.inactive
                  }`}
                >
                  {tag}
                </button>
              )
            })}
          </div>
          <div className="flex items-center gap-1.5 mt-2">
            <input
              value={newTag}
              onChange={(e) => setNewTag(e.target.value)}
              onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); handleAddCustomTag() } }}
              placeholder="Create new tag..."
              className="flex-1 min-w-0 rounded-lg border border-gray-200 px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-secondary/20 focus:border-secondary"
            />
            <button
              type="button"
              onClick={handleAddCustomTag}
              className="rounded-lg px-3 py-1.5 text-sm font-medium text-secondary hover:bg-secondary/10 transition-colors cursor-pointer"
            >
              Add
            </button>
          </div>
        </div>

        <div className="flex justify-end gap-3 pt-2">
          <Button variant="secondary" type="button" onClick={onClose}>
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
