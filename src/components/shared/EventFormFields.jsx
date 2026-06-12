import { useId, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Repeat, Link, FileText, Music, Plus, X, ExternalLink } from 'lucide-react'
import { Input, Textarea } from '@/components/ui/Input'
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from '@/components/ui/Select'
import DatePicker from '@/components/shared/DatePicker'
import LocationInput from '@/components/shared/LocationInput'
import TagDropdown from '@/components/shared/TagDropdown'
import PeopleInput from '@/components/shared/PeopleInput'
import { DATE_PRECISION_OPTIONS, RECURRENCE_OPTIONS } from '@/utils/constants'

/**
 * Animated error message for form fields.
 */
function FieldError({ message, id }) {
  return (
    <AnimatePresence>
      {message && (
        <motion.p
          id={id}
          role="alert"
          className="text-xs text-error mt-1"
          data-field-error
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: 'auto' }}
          exit={{ opacity: 0, height: 0 }}
          transition={{ duration: 0.2 }}
        >
          {message}
        </motion.p>
      )}
    </AnimatePresence>
  )
}

/**
 * Shared form fields used by both AddEventModal and EditEventModal.
 * Renders title, description, dates, precision, people, location, and tags.
 *
 * @param {Object} props
 * @param {Object} props.form - Form state from useEventForm
 * @param {Function} props.setForm - Form state setter
 * @param {Object} props.errors - Validation errors
 * @param {Object} props.people - People autocomplete state from usePeopleAutocomplete
 * @param {Function} props.setPeopleField - People field setter from useEventForm
 * @param {string} props.newTag - New custom tag input value
 * @param {Function} props.setNewTag - New tag setter
 * @param {Array} props.allTagOptions - All available tag options
 * @param {Function} props.toggleTag - Toggle tag selection
 * @param {Function} props.handleAddCustomTag - Add custom tag handler
 * @param {boolean} [props.autoFocusTitle=false] - Auto-focus the title input
 * @param {string} [props.layout='stacked'] - 'stacked' for AddEventModal, 'horizontal' for EditEventModal
 */
const ATTACHMENT_ICONS = { link: Link, document: FileText, audio: Music }

export default function EventFormFields({
  form,
  setForm,
  errors,
  people,
  setPeopleField,
  newTag,
  setNewTag,
  allTagOptions,
  toggleTag,
  handleAddCustomTag,
  setRecurrence,
  addAttachment,
  removeAttachment,
  autoFocusTitle = false,
  layout = 'stacked',
}) {
  const [attachUrl, setAttachUrl] = useState('')
  const [attachLabel, setAttachLabel] = useState('')
  const [attachType, setAttachType] = useState('link')
  const titleId = useId()
  const titleErrorId = useId()
  const descriptionId = useId()
  const isHorizontal = layout === 'horizontal'
  const sectionCls = isHorizontal ? 'flex flex-col sm:flex-row sm:items-start gap-1 sm:gap-4 py-3 sm:py-4' : ''
  const labelCls = isHorizontal
    ? 'shrink-0 sm:w-28 text-sm font-semibold text-text-strong sm:pt-2'
    : 'block text-sm font-medium text-text-default mb-1'
  const fieldWrapCls = isHorizontal ? 'flex-1 min-w-0' : ''
  const containerCls = isHorizontal ? 'space-y-0 divide-y divide-gray-200' : 'space-y-4'

  return (
    <div className={containerCls}>
      {/* Title */}
      <div className={isHorizontal ? `${sectionCls} first:pt-0` : ''} data-field="title">
        <label className={labelCls} htmlFor={titleId}>
          Title <span className="text-error">*</span>
        </label>
        <div className={fieldWrapCls}>
          <Input
            id={titleId}
            value={form.title}
            onChange={(e) => setForm({ ...form, title: e.target.value })}
            className={errors.title ? 'border-error focus-visible:border-error focus-visible:ring-error/20' : ''}
            placeholder={isHorizontal ? 'Event title' : 'e.g., Graduated from college'}
            autoFocus={autoFocusTitle}
            aria-invalid={errors.title ? true : undefined}
            aria-describedby={errors.title ? titleErrorId : undefined}
          />
          <FieldError message={errors.title} id={titleErrorId} />
        </div>
      </div>

      {/* Description */}
      <div className={sectionCls}>
        <label className={labelCls} htmlFor={descriptionId}>Description</label>
        <div className={fieldWrapCls}>
          <Textarea
            id={descriptionId}
            value={form.description}
            onChange={(e) => setForm({ ...form, description: e.target.value })}
            rows={isHorizontal ? 3 : 2}
            placeholder="Optional description"
          />
        </div>
      </div>

      {/* Dates */}
      <div className={sectionCls} data-field="dateStart">
        <label className={labelCls}>
          {isHorizontal ? 'Dates' : 'Start Date'} <span className="text-error">*</span>
        </label>
        <div className={`${fieldWrapCls} ${isHorizontal ? 'space-y-3' : ''}`}>
          {isHorizontal ? (
            <div className="grid grid-cols-2 gap-3">
              <div>
                <span className="block text-xs text-text-muted mb-1">Start</span>
                <DatePicker
                  value={form.dateStart}
                  onChange={(v, p) =>
                    setForm((prev) => ({ ...prev, dateStart: v, ...(p ? { datePrecision: p } : {}) }))
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
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <DatePicker
                  value={form.dateStart}
                  onChange={(v, p) =>
                    setForm((prev) => ({ ...prev, dateStart: v, ...(p ? { datePrecision: p } : {}) }))
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
          )}

          {/* Date Precision */}
          <div className={isHorizontal ? '' : 'mt-4'}>
            {isHorizontal && <span className="block text-xs text-text-muted mb-1">Precision</span>}
            {!isHorizontal && <label className="block text-sm font-medium text-text-default mb-1">Date Precision</label>}
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
      <div className={`${sectionCls} ${isHorizontal ? 'relative' : 'relative'}`}>
        <label className={labelCls}>People</label>
        <div className={fieldWrapCls}>
          <PeopleInput
            people={people}
            value={form.people}
            onChange={setPeopleField}
            placeholder={isHorizontal ? undefined : 'Comma-separated names: John, Jane'}
          />
        </div>
      </div>

      {/* Location */}
      <div className={sectionCls}>
        <label className={labelCls}>Location</label>
        <div className={fieldWrapCls}>
          <LocationInput
            value={form.location}
            onChange={(loc) => setForm((prev) => ({ ...prev, location: loc }))}
            placeholder="Search for a location..."
          />
        </div>
      </div>

      {/* Tags */}
      <div className={sectionCls}>
        {isHorizontal && <label className={labelCls}>Tags</label>}
        <div className={fieldWrapCls}>
          <TagDropdown
            allTagOptions={allTagOptions}
            selectedTags={form.tags}
            onToggleTag={toggleTag}
            newTag={newTag}
            onNewTagChange={setNewTag}
            onAddCustomTag={handleAddCustomTag}
            hideLabel={isHorizontal}
          />
        </div>
      </div>

      {/* Recurrence */}
      {setRecurrence && (
        <div className={sectionCls}>
          <label className={labelCls}>
            <span className="flex items-center gap-1.5">
              <Repeat size={14} className="text-text-muted" />
              Recurring
            </span>
          </label>
          <div className={fieldWrapCls}>
            <div className="flex items-center gap-2 flex-wrap">
              <Select
                value={form.recurrence?.type || '_none'}
                onValueChange={(v) => {
                  if (v === '_none') {
                    setRecurrence(null)
                  } else {
                    setRecurrence({
                      type: v,
                      interval: form.recurrence?.interval || 1,
                      endDate: form.recurrence?.endDate || null,
                    })
                  }
                }}
              >
                <SelectTrigger className="w-32">
                  <SelectValue placeholder="Not recurring" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="_none">None</SelectItem>
                  {RECURRENCE_OPTIONS.map(({ value, label }) => (
                    <SelectItem key={value} value={value}>{label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {form.recurrence && form.recurrence.type === 'custom' && (
                <div className="flex items-center gap-1.5">
                  <span className="text-xs text-text-muted">every</span>
                  <input
                    type="number"
                    min="1"
                    inputMode="numeric"
                    aria-label="Repeat interval in days"
                    value={form.recurrence.interval}
                    onChange={(e) => setRecurrence({
                      ...form.recurrence,
                      interval: Math.max(1, parseInt(e.target.value, 10) || 1),
                    })}
                    className="w-14 text-xs border border-gray-200 rounded-lg px-2 py-1.5 focus:outline-none focus:border-secondary transition-colors"
                  />
                  <span className="text-xs text-text-muted">days</span>
                </div>
              )}
            </div>
            {form.recurrence && (
              <div className="mt-2">
                <span className="block text-xs text-text-muted mb-1">Repeat until (optional)</span>
                <DatePicker
                  value={form.recurrence.endDate || ''}
                  onChange={(v) => setRecurrence({ ...form.recurrence, endDate: v || null })}
                  precision="day"
                  placeholder="No end date"
                />
              </div>
            )}
          </div>
        </div>
      )}

      {/* Attachments */}
      {addAttachment && (
        <div className={sectionCls}>
          <label className={labelCls}>Attachments</label>
          <div className={fieldWrapCls}>
            {form.attachments?.length > 0 && (
              <div className="space-y-1.5 mb-2">
                {form.attachments.map((att, i) => {
                  const Icon = ATTACHMENT_ICONS[att.type] || Link
                  return (
                    <div key={i} className="flex items-center gap-2 text-xs bg-gray-50 rounded-lg px-2.5 py-1.5 group">
                      <Icon size={12} className="text-text-muted shrink-0" />
                      <span className="truncate flex-1 text-text-default" title={att.url}>
                        {att.label || att.url}
                      </span>
                      <a
                        href={att.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-text-muted hover:text-secondary shrink-0"
                        data-no-edit
                        onClick={(e) => e.stopPropagation()}
                      >
                        <ExternalLink size={12} />
                      </a>
                      <button
                        type="button"
                        onClick={() => removeAttachment(i)}
                        className="text-text-muted hover:text-error shrink-0 cursor-pointer"
                      >
                        <X size={12} />
                      </button>
                    </div>
                  )
                })}
              </div>
            )}
            <div className="flex gap-1.5 flex-wrap">
              <Select value={attachType} onValueChange={setAttachType}>
                <SelectTrigger className="h-auto w-auto shrink-0 text-xs px-2 py-1.5 shadow-none" aria-label="Attachment type">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="link">Link</SelectItem>
                  <SelectItem value="document">Document</SelectItem>
                  <SelectItem value="audio">Audio</SelectItem>
                </SelectContent>
              </Select>
              <input
                type="text"
                value={attachUrl}
                onChange={(e) => setAttachUrl(e.target.value)}
                placeholder="URL"
                className="flex-1 min-w-0 text-xs border border-gray-200 rounded-lg px-2.5 py-1.5 focus:outline-none focus:border-secondary transition-colors"
              />
              <input
                type="text"
                value={attachLabel}
                onChange={(e) => setAttachLabel(e.target.value)}
                placeholder="Label (optional)"
                className="w-28 text-xs border border-gray-200 rounded-lg px-2.5 py-1.5 focus:outline-none focus:border-secondary transition-colors"
              />
              <button
                type="button"
                onClick={() => {
                  const url = attachUrl.trim()
                  if (!url) return
                  addAttachment({ type: attachType, url, label: attachLabel.trim() || undefined })
                  setAttachUrl('')
                  setAttachLabel('')
                }}
                className="flex items-center gap-1 rounded-lg px-2.5 py-1.5 text-xs font-medium text-secondary hover:bg-secondary/10 transition-colors cursor-pointer"
              >
                <Plus size={12} />
                Add
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export { FieldError }
