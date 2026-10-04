import { useId, useLayoutEffect, useRef, useState } from 'react'
import { X, Check } from 'lucide-react'
import { getTagPalette, FILTER_CHIPS_VISIBLE, FILTER_CHIPS_MEASURE_CAP } from '@/utils/constants'
import { Popover, PopoverTrigger, PopoverContent } from '@/components/ui/Popover'

// Keep in sync with the chip classes below (h-8, gap-1.5)
const CHIP_HEIGHT = 32
const CHIP_GAP = 6

const chipBase =
  'inline-flex items-center gap-1.5 h-8 max-w-full shrink-0 rounded-full border px-2.5 text-[13px] leading-none whitespace-nowrap transition-colors duration-150 cursor-pointer'
const chipIdle =
  'border-gray-200 bg-surface text-text-default hover:border-gray-300 hover:bg-surface-raised'
const chipActive = 'border-text-strong bg-text-strong text-canvas pr-2'
const moreChipCls = `${chipBase} border-dashed border-gray-300 bg-transparent text-text-default hover:bg-surface-raised`

function ColorDot({ tag }) {
  return (
    <span
      className="h-2 w-2 rounded-full shrink-0"
      style={{ backgroundColor: getTagPalette(tag).activeBg }}
      aria-hidden="true"
    />
  )
}

function Chip({ option, active, count, showColors, onClick, tabIndex }) {
  return (
    <button
      type="button"
      onClick={onClick}
      tabIndex={tabIndex}
      aria-pressed={active}
      aria-label={active ? `Remove filter: ${option}` : `Filter by ${option}`}
      className={`${chipBase} ${active ? chipActive : chipIdle}`}
    >
      {showColors && <ColorDot tag={option} />}
      <span className="truncate">{option}</span>
      {active ? (
        <X size={12} strokeWidth={2.5} className="shrink-0 opacity-70" aria-hidden="true" />
      ) : (
        count != null && <span className="text-xs tabular-nums text-text-muted">{count}</span>
      )}
    </button>
  )
}

// How many rows a flex-wrap line of these widths needs inside `width`
function rowsFor(widths, width) {
  let rows = widths.length ? 1 : 0
  let x = 0
  for (const w of widths) {
    const cw = Math.min(w, width)
    if (x > 0 && x + CHIP_GAP + cw > width) {
      rows++
      x = cw
    } else {
      x = x > 0 ? x + CHIP_GAP + cw : cw
    }
  }
  return rows
}

// Largest k such that the first k chips (plus the "+N" chip when some are
// left over) fit in `maxRows` rows
function fitCount(chipWidths, moreWidth, width, maxRows) {
  const total = chipWidths.length
  if (rowsFor(chipWidths, width) <= maxRows) return total
  for (let k = total - 1; k >= 0; k--) {
    if (rowsFor([...chipWidths.slice(0, k), moreWidth], width) <= maxRows) return k
  }
  return 0
}

/**
 * Toggleable filter chips. Selected options lead, then the rest by usage.
 * With `fill`, the group takes the height its parent gives it and shows only
 * the chips that fit; otherwise it shows `maxVisible`. Either way the
 * leftovers sit behind a "+N" chip that opens a searchable list.
 */
export default function FilterChips({
  label,
  options,
  selected,
  onChange,
  counts = null,
  showColors = false,
  fill = false,
  maxVisible = FILTER_CHIPS_VISIBLE,
}) {
  const labelId = useId()
  const [moreOpen, setMoreOpen] = useState(false)
  const [query, setQuery] = useState('')
  const [fitted, setFitted] = useState(null)
  const areaRef = useRef(null)
  const measureRef = useRef(null)

  // Selected first so active filters never hide behind "+N", then by usage
  const byUsage = (a, b) => (counts?.[b] ?? 0) - (counts?.[a] ?? 0) || a.localeCompare(b)
  const ordered = [
    ...options.filter((o) => selected.includes(o)).sort(byUsage),
    ...options.filter((o) => !selected.includes(o)).sort(byUsage),
  ]
  const candidates = fill ? ordered.slice(0, FILTER_CHIPS_MEASURE_CAP) : ordered
  const measureKey = candidates.map((o) => `${o}:${selected.includes(o) ? 1 : 0}:${counts?.[o] ?? ''}`).join('|')

  // Measure chip widths off-screen and work out how many fit the area
  useLayoutEffect(() => {
    if (!fill) return
    const area = areaRef.current
    const measurer = measureRef.current
    if (!area || !measurer) return

    const measure = () => {
      const nodes = [...measurer.children]
      const moreNode = nodes.pop()
      const widths = nodes.map((n) => n.offsetWidth)
      const width = area.clientWidth
      if (!width) return
      const maxRows = Math.max(1, Math.floor((area.clientHeight + CHIP_GAP) / (CHIP_HEIGHT + CHIP_GAP)))
      setFitted(fitCount(widths, moreNode.offsetWidth, width, maxRows))
    }

    measure()
    const ro = new ResizeObserver(measure)
    ro.observe(area)
    return () => ro.disconnect()
  }, [fill, measureKey])

  if (options.length === 0) return null

  const toggle = (item) => {
    onChange(selected.includes(item) ? selected.filter((s) => s !== item) : [...selected, item])
  }

  const visibleCount = fill ? (fitted ?? 0) : maxVisible
  const inline = ordered.slice(0, visibleCount)
  const hiddenCount = options.length - inline.length

  const q = query.trim().toLowerCase()
  const listed = q ? ordered.filter((o) => o.toLowerCase().includes(q)) : ordered

  const handleMoreOpenChange = (open) => {
    setMoreOpen(open)
    if (!open) setQuery('')
  }

  return (
    <div
      role="group"
      aria-labelledby={labelId}
      className={fill ? 'flex min-h-[3.5rem] flex-col gap-2' : 'space-y-2'}
      style={fill ? { flexGrow: Math.min(options.length, 12), flexBasis: 0 } : undefined}
    >
      <span id={labelId} className="block shrink-0 text-xs font-semibold text-text-default">
        {label}
      </span>
      <div
        ref={areaRef}
        className={fill ? 'relative flex-1 min-h-8 overflow-hidden' : undefined}
      >
        {fill && (
          // Off-screen copy of every candidate chip, used only for width measurement
          <div
            ref={measureRef}
            aria-hidden="true"
            className="invisible absolute left-0 top-0 flex w-max gap-1.5"
            inert
          >
            {candidates.map((option) => (
              <Chip
                key={option}
                option={option}
                active={selected.includes(option)}
                count={counts?.[option]}
                showColors={showColors}
                tabIndex={-1}
              />
            ))}
            <span className={moreChipCls}>+{options.length}</span>
          </div>
        )}

        <div className="flex flex-wrap gap-1.5">
          {inline.map((option) => (
            <Chip
              key={option}
              option={option}
              active={selected.includes(option)}
              count={counts?.[option]}
              showColors={showColors}
              onClick={() => toggle(option)}
            />
          ))}

          {hiddenCount > 0 && (
            <Popover open={moreOpen} onOpenChange={handleMoreOpenChange}>
              <PopoverTrigger asChild>
                <button
                  type="button"
                  aria-label={`Show all ${label.toLowerCase()} (${hiddenCount} more)`}
                  className={moreChipCls}
                >
                  +{hiddenCount}
                </button>
              </PopoverTrigger>
              <PopoverContent align="start" className="w-64 p-0 flex flex-col max-h-80">
                <div className="p-2 border-b border-gray-200 shrink-0">
                  <input
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    placeholder={`Search ${label.toLowerCase()}…`}
                    aria-label={`Search ${label.toLowerCase()}`}
                    className="w-full rounded-lg border border-gray-200 bg-surface px-2.5 py-1.5 text-base sm:text-sm text-text-default placeholder:text-text-muted focus:outline-none focus:border-secondary focus:ring-2 focus:ring-secondary/15"
                    autoFocus
                  />
                </div>
                <div className="py-1 overflow-y-auto app-scroll">
                  {listed.length === 0 && (
                    <p className="px-3 py-2 text-xs text-text-muted">No matches</p>
                  )}
                  {listed.map((option) => {
                    const active = selected.includes(option)
                    return (
                      <button
                        key={option}
                        type="button"
                        onClick={() => toggle(option)}
                        aria-pressed={active}
                        className="flex w-full items-center gap-2 px-3 py-2 text-sm text-text-default hover:bg-surface-raised transition-colors duration-150 cursor-pointer min-w-0"
                      >
                        <span
                          className={`h-4 w-4 rounded flex items-center justify-center shrink-0 ${
                            active ? 'bg-text-strong text-canvas' : 'border border-gray-300'
                          }`}
                          aria-hidden="true"
                        >
                          {active && <Check size={11} strokeWidth={3} />}
                        </span>
                        {showColors && <ColorDot tag={option} />}
                        <span className="truncate">{option}</span>
                        {counts?.[option] != null && (
                          <span className="ml-auto text-xs tabular-nums text-text-muted shrink-0">
                            {counts[option]}
                          </span>
                        )}
                      </button>
                    )
                  })}
                </div>
              </PopoverContent>
            </Popover>
          )}
        </div>
      </div>
    </div>
  )
}
