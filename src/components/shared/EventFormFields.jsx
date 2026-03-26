import { motion, AnimatePresence } from 'framer-motion'
import { Input, Textarea } from '@/components/ui/Input'
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from '@/components/ui/Select'
import DatePicker from '@/components/shared/DatePicker'
import LocationInput from '@/components/shared/LocationInput'
import TagDropdown from '@/components/shared/TagDropdown'
import PeopleInput from '@/components/shared/PeopleInput'
import { DATE_PRECISION_OPTIONS } from '@/utils/constants'

/**
 * Animated error message for form fields.
 */
function FieldError({ message }) {
  return (
    <AnimatePresence>
      {message && (
        <motion.p
          className="text-xs text-error mt-1"
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
  autoFocusTitle = false,
  layout = 'stacked',
}) {
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
      <div className={isHorizontal ? `${sectionCls} first:pt-0` : ''}>
        <label className={labelCls}>
          Title <span className="text-error">*</span>
        </label>
        <div className={fieldWrapCls}>
          <Input
            value={form.title}
            onChange={(e) => setForm({ ...form, title: e.target.value })}
            className={errors.title ? 'border-error focus-visible:border-error' : ''}
            placeholder={isHorizontal ? 'Event title' : 'e.g., Graduated from college'}
            autoFocus={autoFocusTitle}
          />
          <FieldError message={errors.title} />
        </div>
      </div>

      {/* Description */}
      <div className={sectionCls}>
        <label className={labelCls}>Description</label>
        <div className={fieldWrapCls}>
          <Textarea
            value={form.description}
            onChange={(e) => setForm({ ...form, description: e.target.value })}
            rows={isHorizontal ? 3 : 2}
            placeholder="Optional description"
          />
        </div>
      </div>

      {/* Dates */}
      <div className={sectionCls}>
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
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
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
          />
        </div>
      </div>
    </div>
  )
}

export { FieldError }
