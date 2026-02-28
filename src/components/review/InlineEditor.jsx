import { useState } from 'react'
import { Check, X } from 'lucide-react'

export default function InlineEditor({ value, onSave, label, multiline = false, validate, placeholder }) {
  const [isEditing, setIsEditing] = useState(false)
  const [draft, setDraft] = useState(value)
  const [error, setError] = useState(null)

  const handleSave = () => {
    if (validate) {
      const err = validate(draft)
      if (err) {
        setError(err)
        return
      }
    }
    setError(null)
    onSave(draft)
    setIsEditing(false)
  }

  const handleCancel = () => {
    setDraft(value)
    setError(null)
    setIsEditing(false)
  }

  if (!isEditing) {
    return (
      <button
        onClick={() => setIsEditing(true)}
        className="text-left w-full rounded-lg px-2 py-1 text-sm text-gray-700 bg-gray-50 border border-transparent hover:border-gray-200 hover:bg-white transition-colors cursor-pointer"
        title={`Edit ${label}`}
      >
        {value || <span className="text-gray-400 italic">Empty</span>}
      </button>
    )
  }

  const inputProps = {
    value: draft,
    onChange: (e) => { setDraft(e.target.value); setError(null) },
    className:
      'w-full rounded-lg border border-accent bg-white px-2 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-accent/20',
    autoFocus: true,
    placeholder,
    onKeyDown: (e) => {
      if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault()
        handleSave()
      }
      if (e.key === 'Escape') handleCancel()
    },
  }

  return (
    <div>
      <div className="flex items-start gap-1">
        {multiline ? (
          <textarea {...inputProps} rows={2} />
        ) : (
          <input {...inputProps} />
        )}
        <button
          onClick={handleSave}
          className="rounded-lg p-1 text-success hover:text-green-800 hover:bg-green-50 transition-colors cursor-pointer"
          aria-label="Save"
        >
          <Check size={14} />
        </button>
        <button
          onClick={handleCancel}
          className="rounded-lg p-1 text-gray-400 hover:text-gray-700 hover:bg-gray-100 transition-colors cursor-pointer"
          aria-label="Cancel"
        >
          <X size={14} />
        </button>
      </div>
      {error && <p className="text-xs text-error mt-1">{error}</p>}
    </div>
  )
}
