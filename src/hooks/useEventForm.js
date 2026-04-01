import { useState } from 'react'
import useTimelineStore from '@/store/useTimelineStore'
import { TAG_OPTIONS } from '@/utils/constants'
import { validateDateRange } from '@/utils/dateUtils'
import { parsePeopleString } from '@/utils/ui'

const EMPTY_FORM = {
  title: '',
  description: '',
  dateStart: '',
  dateEnd: '',
  datePrecision: 'day',
  people: '',
  location: '',
  tags: [],
  recurrence: null,
  attachments: [],
}

/**
 * Shared form logic for AddEventModal and EditEventModal.
 * Handles state, validation, tag toggling, custom tags, and people parsing.
 */
export default function useEventForm(initialValues = null) {
  const customTags = useTimelineStore((s) => s.customTags)
  const addCustomTag = useTimelineStore((s) => s.addCustomTag)

  const [form, setForm] = useState(initialValues || EMPTY_FORM)
  const [newTag, setNewTag] = useState('')
  const [errors, setErrors] = useState({})

  const allTagOptions = (() => {
    const set = new Set([...TAG_OPTIONS, ...customTags])
    return [...set].sort()
  })()

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
    setForm((prev) => ({
      ...prev,
      tags: prev.tags.includes(trimmed) ? prev.tags : [...prev.tags, trimmed],
    }))
    setNewTag('')
  }

  const setPeopleField = (valOrFn) => {
    if (typeof valOrFn === 'function') {
      setForm((prev) => ({ ...prev, people: valOrFn(prev.people) }))
    } else {
      setForm((prev) => ({ ...prev, people: valOrFn }))
    }
  }

  const getPeople = () => parsePeopleString(form.people)

  const setRecurrence = (recurrence) => {
    setForm((prev) => ({ ...prev, recurrence }))
  }

  const addAttachment = (attachment) => {
    setForm((prev) => ({ ...prev, attachments: [...prev.attachments, attachment] }))
  }

  const removeAttachment = (index) => {
    setForm((prev) => ({
      ...prev,
      attachments: prev.attachments.filter((_, i) => i !== index),
    }))
  }

  const resetForm = (values) => {
    setForm(values || EMPTY_FORM)
    setNewTag('')
    setErrors({})
  }

  return {
    form,
    setForm,
    errors,
    setErrors,
    newTag,
    setNewTag,
    allTagOptions,
    validate,
    toggleTag,
    handleAddCustomTag,
    setPeopleField,
    getPeople,
    setRecurrence,
    addAttachment,
    removeAttachment,
    resetForm,
  }
}
