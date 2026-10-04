import { useId, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Repeat, Link, FileText, Music, Plus, X, ExternalLink, Flag, Check, ChevronRight } from 'lucide-react'
import { Textarea } from '@/components/ui/Input'
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from '@/components/ui/Select'
import DatePicker from '@/components/shared/DatePicker'
import WhenField from '@/components/shared/WhenField'
import LocationInput from '@/components/shared/LocationInput'
import TagPicker from '@/components/shared/TagPicker'
import PeopleInput from '@/components/shared/PeopleInput'
import { RECURRENCE_OPTIONS, isSafeLinkUrl } from '@/utils/constants'

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

const sectionLabelCls = 'block text-xs font-semibold text-text-default'

/**
 * Collapsed row for optional extras (photos, links). Shows a summary until
 * opened so the core fields stay above the fold.
 */
export function DisclosureRow({ icon: Icon, label, summary, children, defaultOpen = false }) {
  const [open, setOpen] = useState(defaultOpen)
  const contentId = useId()
  return (
    <div className="border-b border-gray-100 last:border-b-0">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        aria-controls={contentId}
        className="flex h-12 w-full items-center gap-2.5 px-0.5 text-left text-sm text-text-strong cursor-pointer"
      >
        <Icon size={15} className="shrink-0 text-text-muted" aria-hidden="true" />
        <span className="flex-1">{label}</span>
        <span className="text-[13px] text-text-muted">{summary}</span>
        <ChevronRight
          size={14}
          className={`shrink-0 text-text-muted transition-transform duration-150 ${open ? 'rotate-90' : ''}`}
          aria-hidden="true"
        />
      </button>
      {open && (
        <div id={contentId} className="pb-4">
          {children}
        </div>
      )}
    </div>
  )
}

const ATTACHMENT_ICONS = { link: Link, document: FileText, audio: Music }

function AttachmentsEditor({ attachments, addAttachment, removeAttachment }) {
  const [attachUrl, setAttachUrl] = useState('')
  const [attachLabel, setAttachLabel] = useState('')
  const [attachType, setAttachType] = useState('link')

  const handleAdd = () => {
    const url = attachUrl.trim()
    if (!url) return
    addAttachment({ type: attachType, url, label: attachLabel.trim() || undefined })
    setAttachUrl('')
    setAttachLabel('')
  }

  const fieldCls =
    'min-w-0 h-11 sm:h-9 rounded-lg border border-gray-200 bg-surface px-2.5 text-base sm:text-sm text-text-default placeholder:text-text-muted focus:outline-none focus:border-secondary focus:ring-2 focus:ring-secondary/15 transition-colors'

  return (
    <div className="space-y-2">
      {attachments?.length > 0 && (
        <div className="space-y-1.5">
          {attachments.map((att, i) => {
            const Icon = ATTACHMENT_ICONS[att.type] || Link
            return (
              <div key={i} className="flex items-center gap-2 rounded-lg bg-soft-accent px-2.5 py-1.5 text-sm">
                <Icon size={13} className="shrink-0 text-text-muted" aria-hidden="true" />
                <span className="flex-1 truncate text-text-default" title={att.url}>
                  {att.label || att.url}
                </span>
                <a
                  href={isSafeLinkUrl(att.url) ? att.url : undefined}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label={`Open ${att.label || att.url}`}
                  className="shrink-0 p-1 text-text-muted hover:text-text-strong"
                >
                  <ExternalLink size={13} />
                </a>
                <button
                  type="button"
                  onClick={() => removeAttachment(i)}
                  aria-label={`Remove ${att.label || att.url}`}
                  className="shrink-0 p-1 text-text-muted hover:text-error cursor-pointer"
                >
                  <X size={13} />
                </button>
              </div>
            )
          })}
        </div>
      )}
      <div className="flex flex-wrap gap-1.5">
        <Select value={attachType} onValueChange={setAttachType}>
          <SelectTrigger className="h-11 sm:h-9 w-auto shrink-0 bg-surface px-2.5 shadow-none" aria-label="Attachment type">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="link">Link</SelectItem>
            <SelectItem value="document">Document</SelectItem>
            <SelectItem value="audio">Audio</SelectItem>
          </SelectContent>
        </Select>
        <input
          type="url"
          value={attachUrl}
          onChange={(e) => setAttachUrl(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter') {
              e.preventDefault()
              handleAdd()
            }
          }}
          placeholder="https://…"
          aria-label="Attachment URL"
          className={`${fieldCls} flex-[2_1_10rem]`}
        />
        <input
          type="text"
          value={attachLabel}
          onChange={(e) => setAttachLabel(e.target.value)}
          placeholder="Label (optional)"
          aria-label="Attachment label"
          className={`${fieldCls} flex-[1_1_7rem]`}
        />
        <button
          type="button"
          onClick={handleAdd}
          className="flex h-11 sm:h-9 items-center gap-1 rounded-lg px-3 text-sm font-medium text-text-strong hover:bg-surface-raised transition-colors cursor-pointer"
        >
          <Plus size={14} />
          Add
        </button>
      </div>
    </div>
  )
}

const RECURRENCE_LABEL = Object.fromEntries(RECURRENCE_OPTIONS.map(({ value, label }) => [value, label]))

function RecurrenceEditor({ recurrence, setRecurrence }) {
  return (
    <div className="space-y-2">
      <Select
        value={recurrence?.type || '_none'}
        onValueChange={(v) => {
          if (v === '_none') {
            setRecurrence(null)
          } else {
            setRecurrence({
              type: v,
              interval: recurrence?.interval || 1,
              endDate: recurrence?.endDate || null,
            })
          }
        }}
      >
        <SelectTrigger aria-label="Repeat" className="h-11 sm:h-9 w-auto gap-1.5 bg-surface px-2.5 shadow-none">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="_none">Doesn't repeat</SelectItem>
          {RECURRENCE_OPTIONS.map(({ value, label }) => (
            <SelectItem key={value} value={value}>Repeats {label.toLowerCase()}</SelectItem>
          ))}
        </SelectContent>
      </Select>
      {recurrence && (
        <div className="flex flex-wrap items-center gap-2 rounded-[10px] bg-soft-accent px-3 py-2 text-[13px] text-text-default dark:bg-surface-raised">
          {recurrence.type === 'custom' && (
            <>
              <span>Every</span>
              <input
                type="number"
                min="1"
                inputMode="numeric"
                aria-label="Repeat interval in days"
                value={recurrence.interval}
                onChange={(e) => setRecurrence({
                  ...recurrence,
                  interval: Math.max(1, parseInt(e.target.value, 10) || 1),
                })}
                className="h-9 w-16 rounded-lg border border-gray-200 bg-surface px-2 text-base sm:text-sm focus:border-secondary focus:outline-none"
              />
              <span className="mr-2">days</span>
            </>
          )}
          <span>Until</span>
          <div className="min-w-[10rem] flex-1">
            <DatePicker
              value={recurrence.endDate || ''}
              onChange={(v) => setRecurrence({ ...recurrence, endDate: v || null })}
              precision="day"
              placeholder="No end date"
            />
          </div>
        </div>
      )}
    </div>
  )
}

function FlagNote({ reason, onResolve }) {
  return (
    <div role="note" className="flex flex-wrap items-center gap-x-2.5 gap-y-2 rounded-[10px] border border-flag/20 bg-flag-light py-2 pl-3 pr-2">
      <Flag size={14} className="shrink-0 text-flag" aria-hidden="true" />
      <span className="min-w-0 flex-1 text-[13px] text-rose-800 dark:text-rose-200">
        <strong className="font-semibold">Flagged by import:</strong> {reason || 'this date may be ambiguous'}
      </span>
      <button
        type="button"
        onClick={onResolve}
        className="flex h-8 sm:h-7 items-center gap-1.5 rounded-[7px] border border-flag/30 bg-surface px-2.5 text-xs font-semibold text-rose-700 hover:bg-flag-light dark:text-rose-300 transition-colors duration-150 cursor-pointer"
      >
        <Check size={12} strokeWidth={2.6} aria-hidden="true" />
        Mark as checked
      </button>
    </div>
  )
}

/**
 * Shared event form used by AddEventModal and EditEventModal: an inline title,
 * then description, when (one natural-language date field), who & where, tags,
 * and collapsed rows for extras (repeat, links). `flag` shows the import's
 * date flag under the When field; `children` renders extra disclosure rows (e.g. photos) at the end.
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
  setRecurrence,
  addAttachment,
  removeAttachment,
  tagCounts,
  flag = null,
  autoFocusTitle = false,
  children,
}) {
  const titleId = useId()
  const titleErrorId = useId()
  const descriptionId = useId()
  const whenInputId = useId()
  const whenErrorId = useId()
  const whenStatusId = useId()
  const peopleId = useId()
  const whereId = useId()
  const tagsId = useId()
  const attachmentCount = form.attachments?.length ?? 0

  return (
    <div className="space-y-5">
      {/* Title — the heading of the form */}
      <div data-field="title">
        <label htmlFor={titleId} className="sr-only">
          Title (required)
        </label>
        <input
          id={titleId}
          value={form.title}
          onChange={(e) => setForm({ ...form, title: e.target.value })}
          placeholder="Event title"
          autoFocus={autoFocusTitle}
          aria-required="true"
          aria-invalid={errors.title ? true : undefined}
          aria-describedby={errors.title ? titleErrorId : undefined}
          className={`w-full border-0 border-b border-dashed bg-transparent pb-1 font-serif text-2xl font-semibold text-text-strong placeholder:text-text-muted/70 focus:border-solid focus:outline-none sm:text-[26px] ${
            errors.title ? 'border-error' : 'border-gray-300 focus:border-text-strong'
          }`}
        />
        <FieldError message={errors.title} id={titleErrorId} />
      </div>

      {/* Description */}
      <div className="space-y-1.5">
        <label htmlFor={descriptionId} className={sectionLabelCls}>Description</label>
        <Textarea
          id={descriptionId}
          value={form.description}
          onChange={(e) => setForm({ ...form, description: e.target.value })}
          rows={3}
          placeholder="What happened?"
          className="bg-surface"
        />
      </div>

      {/* When */}
      <div className="space-y-2" data-field="dateStart">
        <label htmlFor={whenInputId} className={sectionLabelCls}>
          When <span className="sr-only">(required)</span>
        </label>
        <WhenField
          id={whenInputId}
          value={form}
          onChange={(date) => setForm((prev) => ({ ...prev, ...date }))}
          error={errors.dateStart || errors.dateEnd}
          errorId={whenErrorId}
          statusId={whenStatusId}
        />
        {(errors.dateStart || errors.dateEnd) && (
          <p id={whenErrorId} role="alert" className="text-xs text-error" data-field-error>
            {errors.dateStart || errors.dateEnd}
          </p>
        )}

        {flag && <FlagNote reason={flag.reason} onResolve={flag.onResolve} />}
      </div>

      {/* Who & where */}
      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 sm:gap-4">
        <div className="relative space-y-1.5">
          <label htmlFor={peopleId} className={sectionLabelCls}>People</label>
          <PeopleInput
            id={peopleId}
            people={people}
            value={form.people}
            onChange={setPeopleField}
            variant="chips"
            placeholder="Add a name"
          />
        </div>
        <div className="space-y-1.5">
          <label htmlFor={whereId} className={sectionLabelCls}>Where</label>
          <LocationInput
            id={whereId}
            value={form.location}
            onChange={(loc) => setForm((prev) => ({ ...prev, location: loc }))}
            placeholder="City, country or place"
            className="h-11 sm:h-10 rounded-[10px] bg-surface"
          />
        </div>
      </div>

      {/* Tags */}
      <div className="space-y-2">
        <span id={tagsId} className={sectionLabelCls}>Tags</span>
        <TagPicker
          labelId={tagsId}
          allTagOptions={allTagOptions}
          selectedTags={form.tags}
          onToggleTag={toggleTag}
          newTag={newTag}
          onNewTagChange={setNewTag}
          onAddCustomTag={handleAddCustomTag}
          tagCounts={tagCounts}
        />
      </div>

      {/* Extras */}
      {(addAttachment || children || setRecurrence) && (
        <div className="border-t border-gray-100">
          {setRecurrence && (
            <DisclosureRow
              icon={Repeat}
              label="Repeats"
              summary={form.recurrence ? RECURRENCE_LABEL[form.recurrence.type] : 'Doesn\u2019t repeat'}
              defaultOpen={Boolean(form.recurrence)}
            >
              <RecurrenceEditor recurrence={form.recurrence} setRecurrence={setRecurrence} />
            </DisclosureRow>
          )}
          {children}
          {addAttachment && (
            <DisclosureRow
              icon={Link}
              label="Links & attachments"
              summary={attachmentCount > 0 ? `${attachmentCount} added` : 'None yet'}
              defaultOpen={attachmentCount > 0}
            >
              <AttachmentsEditor
                attachments={form.attachments}
                addAttachment={addAttachment}
                removeAttachment={removeAttachment}
              />
            </DisclosureRow>
          )}
        </div>
      )}
    </div>
  )
}

export { FieldError }
