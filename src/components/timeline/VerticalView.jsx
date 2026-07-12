import { useEffect, useRef, useState } from 'react'
import { getTagPalette, prefersReducedMotion } from '@/utils/constants'
import { formatEventDateShort } from '@/utils/dateUtils'
import useTimelineStore from '@/store/useTimelineStore'
import useGroupedVirtualizer from '@/hooks/useGroupedVirtualizer'
import useScrollReveal from '@/hooks/useScrollReveal'
import EventCard from './EventCard'

function ScrollRevealCard({ children, index, revealed }) {
  const delayClass = index > 0 && index <= 5 ? `scroll-reveal-delay-${index}` : ''
  return (
    <div className={`scroll-reveal-card max-w-2xl ${delayClass} ${revealed ? 'revealed' : ''}`}>
      {children}
    </div>
  )
}

function ScrollRevealDot({ style, index, revealed, dateLabel }) {
  return (
    <>
      <div
        className={`absolute -left-[18px] sm:-left-[22px] top-[22px] h-px w-[18px] sm:w-[22px] bg-gray-300 transition-opacity duration-300 ${revealed ? 'opacity-100' : 'opacity-0'}`}
        aria-hidden="true"
        style={{ transitionDelay: `${index * 60 + 80}ms` }}
      />
      {/* Padded wrapper = larger hover target; inner span scales so the reveal
          transform on the dot itself is never fought over */}
      <div className="group/dot absolute -left-[29px] sm:-left-[33px] top-3 p-1" aria-hidden="true">
        <span className="block transition-transform duration-150 group-hover/dot:scale-125">
          <span
            className={`block w-3.5 h-3.5 rounded-full ring-2 ring-canvas scroll-reveal-dot ${revealed ? 'revealed' : ''}`}
            style={{
              ...style,
              transitionDelay: `${index * 60 + 80}ms`,
            }}
          />
        </span>
        {dateLabel && (
          <span className="pointer-events-none absolute right-full top-1/2 -translate-y-1/2 mr-1.5 whitespace-nowrap rounded-md border border-gray-200 bg-surface px-1.5 py-0.5 font-serif text-xs text-text-default shadow-sm opacity-0 group-hover/dot:opacity-100 transition-opacity duration-150 z-20">
            {dateLabel}
          </span>
        )}
      </div>
    </>
  )
}

// Fixed right-edge rail of serif years — click to jump, active year highlighted
function YearScrubber({ years, activeYear, onJump }) {
  if (years.length < 4) return null
  return (
    <nav
      aria-label="Jump to year"
      className="hidden xl:flex fixed right-3 top-1/2 -translate-y-1/2 z-30 flex-col items-end gap-0.5 max-h-[70vh] overflow-y-auto app-scroll pr-1"
    >
      {years.map((year) => (
        <button
          key={year}
          type="button"
          onClick={() => onJump(year)}
          className={`font-serif text-xs tabular-nums px-2 py-0.5 rounded-md transition-colors duration-150 cursor-pointer ${
            String(activeYear) === String(year)
              ? 'text-highlight font-semibold'
              : 'text-text-muted hover:text-text-strong hover:bg-surface-raised'
          }`}
          aria-current={String(activeYear) === String(year) ? 'true' : undefined}
        >
          {year}
        </button>
      ))}
    </nav>
  )
}

function RevealableEvent({ children }) {
  const { ref, revealed } = useScrollReveal()
  return (
    <div ref={ref} className="relative">
      {typeof children === 'function' ? children(revealed) : children}
    </div>
  )
}

function ConnectorGroup({ children, compact }) {
  const { ref, revealed } = useScrollReveal({ threshold: 0.05 })
  return (
    <div
      ref={ref}
      className={`flex flex-col pl-4 sm:pl-5 border-l-2 ml-2 sm:ml-3 overflow-visible timeline-group-connector ${revealed ? 'connector-revealed' : ''} ${compact ? 'gap-2 pt-1' : 'gap-3 sm:gap-5 pt-2'}`}
    >
      {children}
    </div>
  )
}

// Year (or month-label) numeral that sits in the left gutter beside the spine
function SpineLabel({ label, count, compact }) {
  const isLongLabel = String(label).length > 4
  return (
    <div className="w-16 sm:w-24 shrink-0">
      <div className="sticky top-20 text-right pr-3 sm:pr-4 pt-1.5">
        <span
          className={`font-serif font-semibold text-text-strong leading-none tabular-nums break-words ${
            isLongLabel
              ? 'text-sm sm:text-base'
              : compact
                ? 'text-xl sm:text-2xl'
                : 'text-2xl sm:text-3xl'
          }`}
        >
          {label}
        </span>
        {count > 1 && (
          <div className="text-[11px] font-medium text-text-muted tabular-nums mt-1">
            {count} events
          </div>
        )}
      </div>
    </div>
  )
}

const HEADER_HEIGHT = 48
const EVENT_HEIGHT_COMPACT = 52
const EVENT_HEIGHT_NORMAL = 160

const flattenVerticalGroups = (groups) => {
  const items = []
  for (const group of groups) {
    items.push({ type: 'header', year: group.year, count: group.events.length })
    for (const event of group.events) {
      items.push({ type: 'event', event })
    }
  }
  return items
}

function VerticalView({
  events,
  editable = false,
  compact = false,
  groupZoom = 'year',
  selectedEventIds,
  onToggleSelect,
  onEditEvent,
  searchQuery = '',
}) {
  const estimateSize = (index, flatItems) => {
    if (flatItems[index].type === 'header') return HEADER_HEIGHT
    return compact ? EVENT_HEIGHT_COMPACT : EVENT_HEIGHT_NORMAL
  }

  const { parentRef, groups, flatItems, shouldVirtualize, virtualizer } = useGroupedVirtualizer({
    events,
    groupZoom,
    flattenGroups: flattenVerticalGroups,
    estimateSize,
    overscan: 5,
  })

  // ── Year scrubber + jump-to-year ──
  const scrubberYears = groupZoom === 'year' ? groups.map((g) => g.year).filter((y) => y !== 'Unknown') : []
  const yearJumpCounter = useTimelineStore((s) => s.yearJumpCounter)
  const handledJumpRef = useRef(yearJumpCounter)
  const [scrolledYear, setScrolledYear] = useState(null)

  const jumpToYear = (year) => {
    if (shouldVirtualize) {
      const idx = flatItems.findIndex((it) => it.type === 'header' && String(it.year) === String(year))
      if (idx >= 0) virtualizer.scrollToIndex(idx, { align: 'start' })
    } else {
      document
        .querySelector(`[data-year-group="${CSS.escape(String(year))}"]`)
        ?.scrollIntoView({ behavior: prefersReducedMotion() ? 'auto' : 'smooth', block: 'start' })
    }
  }

  // Store-driven jump requests (command palette). No dep array — the ref guard
  // makes re-runs free, and the jump needs current flatItems/virtualizer.
  useEffect(() => {
    if (yearJumpCounter === handledJumpRef.current) return
    handledJumpRef.current = yearJumpCounter
    const year = useTimelineStore.getState().yearJumpYear
    if (year != null) jumpToYear(year)
  })

  // Track which year group the viewport is in (non-virtualized page scroll)
  useEffect(() => {
    if (shouldVirtualize || scrubberYears.length < 4) return
    let ticking = false
    const onScroll = () => {
      if (ticking) return
      ticking = true
      requestAnimationFrame(() => {
        let current = null
        for (const el of document.querySelectorAll('[data-year-group]')) {
          if (el.getBoundingClientRect().top <= 140) current = el.dataset.yearGroup
          else break
        }
        setScrolledYear(current)
        ticking = false
      })
    }
    onScroll()
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [shouldVirtualize, scrubberYears.length])

  // Virtualized path derives the active year from the first visible row
  const virtualActiveYear = (() => {
    if (!shouldVirtualize) return null
    const first = virtualizer.getVirtualItems()[0]
    if (!first) return null
    for (let i = first.index; i >= 0; i--) {
      if (flatItems[i].type === 'header') return flatItems[i].year
    }
    return null
  })()

  const activeYear = shouldVirtualize ? virtualActiveYear : (scrolledYear ?? scrubberYears[0])

  // Non-virtualized path for small lists
  if (!shouldVirtualize) {
    return (
      <div className="max-w-3xl mx-auto flex flex-col gap-0">
        <YearScrubber years={scrubberYears} activeYear={activeYear} onJump={jumpToYear} />
        {groups.map(({ year, events: yearEvents }) => (
          <div key={year} data-year-group={year} className={`flex scroll-mt-20 ${compact ? 'pb-2' : 'pb-4'}`}>
            <SpineLabel label={year} count={yearEvents.length} compact={compact} />
            <div className="flex-1 min-w-0">
            <ConnectorGroup compact={compact}>
              {yearEvents.map((event, i) => {
                const isSelected = selectedEventIds?.includes(event.id)
                return (
                  <RevealableEvent key={event.id}>
                    {(revealed) => (
                      <>
                        <ScrollRevealDot
                          index={i}
                          revealed={revealed}
                          dateLabel={formatEventDateShort(event)}
                          style={{
                            backgroundColor: event.tags?.[0] ? getTagPalette(event.tags[0]).activeBg : 'var(--color-secondary)',
                          }}
                        />
                        <ScrollRevealCard index={i} revealed={revealed}>
                          <div
                            className={`${isSelected ? 'ring-2 ring-highlight/50 rounded-xl' : ''}`}
                            onClick={
                              onToggleSelect
                                ? (e) => {
                                    if (e.shiftKey || e.metaKey || e.ctrlKey) {
                                      e.preventDefault()
                                      window.getSelection()?.removeAllRanges()
                                      onToggleSelect(event.id, e)
                                    }
                                  }
                                : undefined
                            }
                          >
                            <EventCard event={event} editable={editable} compact={compact} isSelected={isSelected} onEdit={onEditEvent} searchQuery={searchQuery} />
                          </div>
                        </ScrollRevealCard>
                      </>
                    )}
                  </RevealableEvent>
                )
              })}
            </ConnectorGroup>
            </div>
          </div>
        ))}
      </div>
    )
  }

  // Virtualized path for large lists
  return (
    <div
      ref={parentRef}
      style={{ height: 'calc(100vh - 8rem)', overflow: 'auto' }}
      className="app-scroll"
    >
      <YearScrubber years={scrubberYears} activeYear={activeYear} onJump={jumpToYear} />
      <div
        className="max-w-3xl mx-auto"
        style={{
          height: `${virtualizer.getTotalSize()}px`,
          position: 'relative',
        }}
      >
        {virtualizer.getVirtualItems().map((virtualRow) => {
          const item = flatItems[virtualRow.index]

          if (item.type === 'header') {
            return (
              <div
                key={`header-${item.year}`}
                style={{
                  position: 'absolute',
                  top: 0,
                  left: 0,
                  width: '100%',
                  height: `${virtualRow.size}px`,
                  transform: `translateY(${virtualRow.start}px)`,
                }}
              >
                <div className={`${compact ? 'py-1.5' : 'py-2'}`}>
                  <div className="flex items-baseline gap-3">
                    <h2 className={`font-serif font-semibold text-text-strong tabular-nums ${compact ? 'text-lg' : 'text-xl sm:text-2xl'}`}>
                      {item.year}
                    </h2>
                    {item.count > 1 && (
                      <span className="text-[11px] font-medium text-text-muted tabular-nums shrink-0">
                        {item.count} events
                      </span>
                    )}
                    <div className="flex-1 self-center h-px bg-gradient-to-r from-gray-200 via-gray-200/50 to-transparent" />
                  </div>
                </div>
              </div>
            )
          }

          const event = item.event
          const isSelected = selectedEventIds?.includes(event.id)

          return (
            <div
              key={event.id}
              style={{
                position: 'absolute',
                top: 0,
                left: 0,
                width: '100%',
                transform: `translateY(${virtualRow.start}px)`,
              }}
              ref={virtualizer.measureElement}
              data-index={virtualRow.index}
            >
              <div className={`pl-4 sm:pl-5 border-l-2 border-gray-300 ml-2 sm:ml-3 timeline-connector ${compact ? 'py-1' : 'py-2.5'}`}>
                <div className="relative transition-all duration-200 max-w-2xl">
                  <div
                    className="absolute -left-[18px] sm:-left-[22px] top-[22px] h-px w-[18px] sm:w-[22px] bg-gray-300"
                    aria-hidden="true"
                  />
                  <div className="group/dot absolute -left-[29px] sm:-left-[33px] top-3 p-1" aria-hidden="true">
                    <span
                      className="block w-3.5 h-3.5 rounded-full ring-2 ring-canvas transition-transform duration-150 group-hover/dot:scale-125"
                      style={{
                        backgroundColor: event.tags?.[0] ? getTagPalette(event.tags[0]).activeBg : 'var(--color-secondary)',
                      }}
                    />
                    <span className="pointer-events-none absolute right-full top-1/2 -translate-y-1/2 mr-1.5 whitespace-nowrap rounded-md border border-gray-200 bg-surface px-1.5 py-0.5 font-serif text-xs text-text-default shadow-sm opacity-0 group-hover/dot:opacity-100 transition-opacity duration-150 z-20">
                      {formatEventDateShort(event)}
                    </span>
                  </div>
                  <div
                    className={`${isSelected ? 'ring-2 ring-highlight/50 rounded-xl' : ''}`}
                    onClick={
                      onToggleSelect
                        ? (e) => {
                            if (e.shiftKey || e.metaKey || e.ctrlKey) {
                              e.preventDefault()
                              window.getSelection()?.removeAllRanges()
                              onToggleSelect(event.id, e)
                            }
                          }
                        : undefined
                    }
                  >
                    <EventCard event={event} editable={editable} compact={compact} isSelected={isSelected} onEdit={onEditEvent} searchQuery={searchQuery} />
                  </div>
                </div>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}

export default VerticalView
