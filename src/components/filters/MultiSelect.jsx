import { useState, useRef, useEffect } from 'react'
import { ChevronDown } from 'lucide-react'
import { getTagPalette } from '@/utils/constants'

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
        className={`flex items-center justify-between w-full rounded-lg border px-3 py-2 text-sm transition-all cursor-pointer ${
          dark
            ? 'border-sidebar-input-border bg-sidebar-input text-sidebar-text hover:border-sidebar-muted'
            : 'border-gray-200 bg-white text-gray-700 hover:border-gray-300 hover:shadow-sm'
        }`}
      >
        <span className="flex items-center gap-1.5">
          {label}
          {selected.length > 0 && (
            <span className="inline-flex items-center justify-center min-w-[18px] h-[18px] rounded-full bg-secondary/30 text-secondary text-[10px] font-bold px-1">
              {selected.length}
            </span>
          )}
        </span>
        <ChevronDown
          size={14}
          className={`transition-transform duration-200 ${isOpen ? 'rotate-180' : ''} ${dark ? 'text-sidebar-muted' : 'text-gray-400'}`}
        />
      </button>

      {isOpen && (
        <div
          className={`absolute top-full left-0 right-0 z-20 mt-1 rounded-lg border py-1 shadow-lg max-h-[200px] overflow-y-auto ${
            dark ? 'border-sidebar-input-border bg-sidebar-surface' : 'border-gray-200 bg-white'
          }`}
        >
          {options.map((option) => {
            const palette = colorMap?.[option] ? getTagPalette(option) : null
            return (
              <button
                key={option}
                onClick={() => toggle(option)}
                className={`flex w-full items-center gap-1 px-1.5 py-1.5 text-sm transition-colors cursor-pointer min-w-0 ${
                  dark
                    ? 'text-sidebar-text hover:bg-white/[0.08]'
                    : 'text-gray-700 hover:bg-gray-50'
                }`}
              >
                <span
                  className={`h-3 w-3 rounded flex items-center justify-center flex-shrink-0 ${
                    selected.includes(option)
                      ? 'bg-secondary border-secondary text-white'
                      : dark
                        ? 'border border-sidebar-heading'
                        : 'border border-gray-300'
                  }`}
                >
                  {selected.includes(option) && (
                    <svg
                      viewBox="0 0 12 12"
                      className="h-2 w-2"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                    >
                      <path d="M2 6l3 3 5-5" />
                    </svg>
                  )}
                </span>
                {palette && (
                  <span
                    className="h-2 w-2 rounded-full flex-shrink-0"
                    style={{ backgroundColor: dark ? palette.darkText : palette.activeBg }}
                  />
                )}
                <span className="truncate">{option}</span>
              </button>
            )
          })}
        </div>
      )}
    </div>
  )
}
