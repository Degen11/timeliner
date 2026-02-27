import { useState, useRef, useEffect } from 'react'
import { ChevronDown } from 'lucide-react'
import Badge from '@/components/shared/Badge'

export default function MultiSelect({ label, options, selected, onChange }) {
  const [isOpen, setIsOpen] = useState(false)
  const ref = useRef(null)

  useEffect(() => {
    function handleClick(e) {
      if (ref.current && !ref.current.contains(e.target)) {
        setIsOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [])

  const toggle = (item) => {
    if (selected.includes(item)) {
      onChange(selected.filter((s) => s !== item))
    } else {
      onChange([...selected, item])
    }
  }

  if (options.length === 0) return null

  return (
    <div ref={ref} className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-1.5 rounded-lg border border-gray-200 bg-white px-3 py-1.5 text-sm text-gray-700 hover:border-gray-300 transition-colors cursor-pointer"
      >
        {label}
        {selected.length > 0 && (
          <span className="rounded-full bg-accent-light text-accent text-xs px-1.5">
            {selected.length}
          </span>
        )}
        <ChevronDown size={14} className="text-gray-400" />
      </button>

      {isOpen && (
        <div className="absolute top-full left-0 z-20 mt-1 min-w-[180px] rounded-lg border border-gray-200 bg-white py-1 shadow-lg">
          {options.map((option) => (
            <button
              key={option}
              onClick={() => toggle(option)}
              className="flex w-full items-center gap-2 px-3 py-1.5 text-sm text-gray-700 hover:bg-gray-50 transition-colors cursor-pointer"
            >
              <span
                className={`h-3.5 w-3.5 rounded border flex items-center justify-center ${
                  selected.includes(option)
                    ? 'bg-accent border-accent text-white'
                    : 'border-gray-300'
                }`}
              >
                {selected.includes(option) && (
                  <svg viewBox="0 0 12 12" className="h-2.5 w-2.5" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M2 6l3 3 5-5" />
                  </svg>
                )}
              </span>
              {option}
            </button>
          ))}
        </div>
      )}
    </div>
  )
}
