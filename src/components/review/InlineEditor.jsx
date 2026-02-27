import { useState } from 'react'
import { Check, X } from 'lucide-react'

export default function InlineEditor({ value, onSave, label, multiline = false }) {
  const [isEditing, setIsEditing] = useState(false)
  const [draft, setDraft] = useState(value)

  const handleSave = () => {
    onSave(draft)
    setIsEditing(false)
  }

  const handleCancel = () => {
    setDraft(value)
    setIsEditing(false)
  }

  if (!isEditing) {
    return (
      <button
        onClick={() => setIsEditing(true)}
        className="text-left w-full rounded px-2 py-1 text-sm hover:bg-gray-100 transition-colors"
        title={`Edit ${label}`}
      >
        {value || <span className="text-gray-400 italic">Empty</span>}
      </button>
    )
  }

  const inputProps = {
    value: draft,
    onChange: (e) => setDraft(e.target.value),
    className:
      'w-full rounded border border-accent bg-white px-2 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-accent/20',
    autoFocus: true,
    onKeyDown: (e) => {
      if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault()
        handleSave()
      }
      if (e.key === 'Escape') handleCancel()
    },
  }

  return (
    <div className="flex items-start gap-1">
      {multiline ? (
        <textarea {...inputProps} rows={2} />
      ) : (
        <input {...inputProps} />
      )}
      <button
        onClick={handleSave}
        className="rounded p-1 text-success hover:bg-green-50"
        aria-label="Save"
      >
        <Check size={14} />
      </button>
      <button
        onClick={handleCancel}
        className="rounded p-1 text-gray-400 hover:bg-gray-100"
        aria-label="Cancel"
      >
        <X size={14} />
      </button>
    </div>
  )
}
