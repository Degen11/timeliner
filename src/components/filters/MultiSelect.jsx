import { useState, useRef, useEffect } from 'react'
import { ChevronDown } from 'lucide-react'

export default function MultiSelect({
  label,
  options,
  selected,
  onChange,
  colorMap,
  dark = false,
}) {
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
        className={`flex items-center gap-1.5 rounded-lg border px-3 py-1.5 text-sm transition-all cursor-pointer ${
          dark
            ? 'border-sidebar-input-border bg-sidebar-input text-sidebar-text hover:border-sidebar-muted'
            : 'border-gray-200 bg-white text-gray-700 hover:border-gray-300 hover:shadow-sm'
        }`}
      >
        {label}
        {selected.length > 0 && (
          <span className="inline-flex items-center justify-center min-w-[18px] h-[18px] rounded-full bg-secondary/20 text-secondary text-[10px] font-semibold px-1">
            {selected.length}
          </span>
        )}
        <ChevronDown size={14} className={dark ? 'text-sidebar-muted' : 'text-gray-400'} />
      </button>

      {isOpen && (
        <div
          className={`absolute top-full left-0 z-20 mt-1 min-w-[180px] rounded-lg border py-1 shadow-lg ${
            dark ? 'border-sidebar-input-border bg-sidebar-surface' : 'border-gray-200 bg-white'
          }`}
        >
          {options.map((option) => (
            <button
              key={option}
              onClick={() => toggle(option)}
              className={`flex w-full items-center gap-2 px-3 py-1.5 text-sm transition-colors cursor-pointer ${
                dark ? 'text-sidebar-text hover:bg-sidebar-hover' : 'text-gray-700 hover:bg-gray-50'
              }`}
            >
              <span
                className={`h-3.5 w-3.5 rounded border flex items-center justify-center flex-shrink-0 ${
                  selected.includes(option)
                    ? 'bg-secondary border-secondary text-white'
                    : dark
                      ? 'border-sidebar-muted'
                      : 'border-gray-300'
                }`}
              >
                {selected.includes(option) && (
                  <svg
                    viewBox="0 0 12 12"
                    className="h-2.5 w-2.5"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                  >
                    <path d="M2 6l3 3 5-5" />
                  </svg>
                )}
              </span>
              {colorMap?.[option] ? (
                <span
                  className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${colorMap[option]}`}
                >
                  {option}
                </span>
              ) : (
                option
              )}
            </button>
          ))}
        </div>
      )}
    </div>
  )
}
