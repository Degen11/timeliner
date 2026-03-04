import { useState, useRef, useEffect } from 'react'
import { Check, X, Pencil } from 'lucide-react'

export default function InlineEditField({
  value,
  onSave,
  multiline = false,
  placeholder,
  className: displayCls,
}) {
  const [editing, setEditing] = useState(false)
  const [draft, setDraft] = useState(value)
  const [saved, setSaved] = useState(false)
  const inputRef = useRef(null)

  useEffect(() => {
    setDraft(value)
  }, [value])

  useEffect(() => {
    if (editing && inputRef.current) {
      inputRef.current.focus()
      if (inputRef.current.select) inputRef.current.select()
      if (multiline && inputRef.current.tagName === 'TEXTAREA') {
        inputRef.current.style.height = 'auto'
        inputRef.current.style.height = inputRef.current.scrollHeight + 'px'
      }
    }
  }, [editing, multiline])

  const handleSave = () => {
    onSave(draft)
    setEditing(false)
    setSaved(true)
    setTimeout(() => setSaved(false), 600)
  }

  const handleCancel = () => {
    setDraft(value)
    setEditing(false)
  }

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSave()
    }
    if (e.key === 'Escape') handleCancel()
  }

  const handleTextareaChange = (e) => {
    setDraft(e.target.value)
    e.target.style.height = 'auto'
    e.target.style.height = e.target.scrollHeight + 'px'
  }

  if (!editing) {
    return (
      <span
        onDoubleClick={(e) => {
          e.stopPropagation()
          setEditing(true)
        }}
        className={`group/edit inline-flex items-center gap-1 ${displayCls} cursor-text hover:bg-secondary/5 hover:rounded-md transition-colors duration-300 ${saved ? 'bg-green-50 rounded-md' : ''}`}
        title="Double-click to edit"
      >
        {value || <span className="text-gray-300 italic">{placeholder || 'Empty'}</span>}
        <Pencil
          size={10}
          className="text-gray-300 opacity-0 group-hover/edit:opacity-100 transition-opacity shrink-0"
        />
      </span>
    )
  }

  const cls =
    'w-full min-w-0 rounded-lg border border-secondary bg-white px-2 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-secondary/20'

  return (
    <div className="w-full min-w-0" onClick={(e) => e.stopPropagation()}>
      <div className="flex items-start gap-1">
        {multiline ? (
          <textarea
            ref={inputRef}
            value={draft}
            onChange={handleTextareaChange}
            onKeyDown={handleKeyDown}
            className={`${cls} resize-none overflow-hidden`}
            rows={1}
            placeholder={placeholder}
          />
        ) : (
          <input
            ref={inputRef}
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            onKeyDown={handleKeyDown}
            className={cls}
            placeholder={placeholder}
          />
        )}
        <button
          onClick={handleSave}
          className="rounded-lg p-1 text-success hover:bg-success/10 transition-colors cursor-pointer shrink-0"
          aria-label="Save"
        >
          <Check size={14} />
        </button>
        <button
          onClick={handleCancel}
          className="rounded-lg p-1 text-gray-400 hover:text-gray-700 hover:bg-gray-100 transition-colors cursor-pointer shrink-0"
          aria-label="Cancel"
        >
          <X size={14} />
        </button>
      </div>
      <p className="text-[11px] text-gray-400 mt-0.5 ml-0.5">Press Enter to save, Esc to cancel</p>
    </div>
  )
}
