import { useState } from 'react'
import { ChevronDown } from 'lucide-react'
import { getTagPalette } from '@/utils/constants'
import { Popover, PopoverTrigger, PopoverContent } from '@/components/ui/Popover'

export default function MultiSelect({
  label,
  options,
  selected,
  onChange,
  showColors = false,
  dark = false,
  counts = null,
}) {
  const [isOpen, setIsOpen] = useState(false)

  const toggle = (item) => {
    if (selected.includes(item)) {
      onChange(selected.filter((s) => s !== item))
    } else {
      onChange([...selected, item])
    }
  }

  if (options.length === 0) return null

  return (
    <Popover open={isOpen} onOpenChange={setIsOpen}>
      <PopoverTrigger asChild>
        <button
          className={`flex items-center justify-between w-full rounded-lg border px-3 py-2 text-sm transition-colors duration-150 cursor-pointer ${
            dark
              ? 'border-sidebar-input-border bg-sidebar-input text-sidebar-text hover:bg-sidebar-hover'
              : 'border-gray-200 bg-white text-text-default hover:bg-surface-raised'
          }`}
        >
          <span className="flex items-center gap-1.5">
            {label}
            {selected.length > 0 && (
              <span className="inline-flex items-center justify-center min-w-[18px] h-[18px] rounded-full bg-secondary/20 text-secondary text-xs font-bold px-1">
                {selected.length}
              </span>
            )}
          </span>
          <ChevronDown
            size={14}
            className={`transition-transform duration-150 ${isOpen ? 'rotate-180' : ''} ${dark ? 'text-sidebar-muted' : 'text-text-muted'}`}
          />
        </button>
      </PopoverTrigger>
      <PopoverContent
        align="start"
        className={`w-[var(--radix-popover-trigger-width)] p-0 rounded-xl max-h-[260px] flex flex-col ${
          dark ? 'border-sidebar-input-border bg-sidebar-surface' : 'border-gray-200 bg-white'
        }`}
      >
        {options.length > 1 && (
          <div className={`flex items-center gap-1 px-1.5 py-1.5 border-b shrink-0 ${
            dark ? 'border-sidebar-input-border' : 'border-gray-100'
          }`}>
            <button
              onClick={() => onChange([...options])}
              className={`flex-1 text-xs font-medium rounded-md py-1 transition-colors duration-150 cursor-pointer ${
                dark
                  ? 'text-sidebar-muted hover:text-sidebar-text hover:bg-sidebar-hover'
                  : 'text-text-muted hover:text-text-default hover:bg-surface-raised'
              }`}
            >
              Select all
            </button>
            <button
              onClick={() => onChange([])}
              className={`flex-1 text-xs font-medium rounded-md py-1 transition-colors duration-150 cursor-pointer ${
                dark
                  ? 'text-sidebar-muted hover:text-sidebar-text hover:bg-sidebar-hover'
                  : 'text-text-muted hover:text-text-default hover:bg-surface-raised'
              }`}
            >
              Clear all
            </button>
          </div>
        )}
        <div className="py-1 overflow-y-auto app-scroll">
          {options.map((option) => {
            const palette = showColors ? getTagPalette(option) : null
            return (
              <button
                key={option}
                onClick={() => toggle(option)}
                className={`flex w-full items-center gap-1 px-1.5 py-1.5 text-sm transition-colors duration-150 cursor-pointer min-w-0 ${
                  dark
                    ? 'text-sidebar-text hover:bg-sidebar-hover'
                    : 'text-text-default hover:bg-surface-raised'
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
                {counts && counts[option] != null && (
                  <span
                    className={`ml-auto text-xs font-medium tabular-nums flex-shrink-0 ${
                      dark ? 'text-sidebar-muted' : 'text-text-muted'
                    }`}
                  >
                    {counts[option]}
                  </span>
                )}
              </button>
            )
          })}
        </div>
      </PopoverContent>
    </Popover>
  )
}
