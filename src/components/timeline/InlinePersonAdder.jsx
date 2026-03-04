import { useState, useRef, useEffect } from 'react'
import { Plus } from 'lucide-react'
import useTimelineStore from '@/store/useTimelineStore'

export default function InlinePersonAdder({ eventId, currentPeople }) {
  const [open, setOpen] = useState(false)
  const [name, setName] = useState('')
  const inputRef = useRef(null)
  const updateEvent = useTimelineStore((s) => s.updateEvent)

  useEffect(() => {
    if (open && inputRef.current) inputRef.current.focus()
  }, [open])

  const handleAdd = () => {
    const trimmed = name.trim()
    if (!trimmed) {
      setOpen(false)
      return
    }
    if (!currentPeople?.includes(trimmed)) {
      updateEvent(eventId, { people: [...(currentPeople || []), trimmed] })
    }
    setName('')
    setOpen(false)
  }

  if (!open) {
    return (
      <button
        onClick={(e) => {
          e.stopPropagation()
          setOpen(true)
        }}
        className="inline-flex items-center gap-0.5 rounded-full px-1.5 py-0.5 text-[11px] text-gray-400 hover:text-secondary hover:bg-secondary/5 transition-colors cursor-pointer"
        title="Add person"
      >
        <Plus size={10} />
        person
      </button>
    )
  }

  return (
    <div className="inline-flex items-center gap-1" onClick={(e) => e.stopPropagation()}>
      <input
        ref={inputRef}
        value={name}
        onChange={(e) => setName(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === 'Enter') {
            e.preventDefault()
            handleAdd()
          }
          if (e.key === 'Escape') {
            setName('')
            setOpen(false)
          }
        }}
        onBlur={handleAdd}
        placeholder="Name..."
        className="w-24 rounded border border-secondary bg-white px-1.5 py-0.5 text-[11px] focus:outline-none focus:ring-1 focus:ring-secondary/30"
      />
    </div>
  )
}
