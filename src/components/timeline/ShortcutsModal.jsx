import { useState } from 'react'
import { X, Search, ArrowRight } from 'lucide-react'
import AnimatedModal from '@/components/shared/AnimatedModal'
import { Button } from '@/components/ui/Button'
import useTimelineStore from '@/store/useTimelineStore'
import { pluralize } from '@/utils/ui'

const isMac = typeof navigator !== 'undefined' && navigator.platform?.includes('Mac')
const MOD = isMac ? '⌘' : 'Ctrl'
const SHIFT = isMac ? '⇧' : 'Shift'

// Each item: [description, keys[], trailing text?]
const SHORTCUT_GROUPS = [
  {
    label: 'Get around',
    items: [
      ['Command palette', [MOD, 'K']],
      ['Search events', ['/']],
      ['Switch view', ['1', '2', '3', '4', '5']],
      ['This help', ['?']],
    ],
  },
  {
    label: 'Create & edit',
    items: [
      ['New event', ['N']],
      ['Save event / extract import', [MOD, '↵']],
      ['Undo', [MOD, 'Z']],
      ['Redo', [MOD, SHIFT, 'Z']],
    ],
  },
  {
    label: 'Event details',
    items: [
      ['Previous / next event', ['←', '→']],
      ['Previous / next photo', ['←', '→'], 'in a photo'],
      ['Close', ['Esc']],
    ],
  },
  {
    label: 'Select & more',
    items: [
      ['Select an event', [MOD], 'click'],
      ['Select a range', [SHIFT], 'click'],
      ['Select all', [MOD, 'A']],
      ['Tag / add person / shift dates', ['T', 'P', 'D'], 'with events selected'],
      ['Insights', ['I']],
      ['Print / PDF', [MOD, 'P']],
    ],
  },
]

function Keys({ keys, trailing }) {
  return (
    <span className="flex shrink-0 items-center gap-1 text-xs text-text-default">
      {keys.map((k, i) => (
        <kbd
          key={`${k}-${i}`}
          className="inline-flex min-w-[1.5rem] items-center justify-center rounded-md border border-b-2 border-gray-300 bg-surface px-1.5 font-sans text-xs leading-5 text-text-strong"
        >
          {k}
        </kbd>
      ))}
      {trailing && <span className="ml-0.5">{trailing}</span>}
    </span>
  )
}

const linkCls =
  '-mx-2.5 flex h-10 w-[calc(100%+1.25rem)] items-center justify-between rounded-lg px-2.5 text-sm text-text-strong transition-colors duration-150 hover:bg-surface cursor-pointer'

export default function ShortcutsModal({ open, onClose, onImportText }) {
  const [query, setQuery] = useState('')
  const flaggedCount = useTimelineStore((s) => s.events.filter((e) => e.flagged).length)

  const q = query.trim().toLowerCase()
  const groups = SHORTCUT_GROUPS.map((g) => ({
    ...g,
    items: q
      ? g.items.filter(([desc, keys, trailing]) =>
          `${desc} ${keys.join(' ')} ${trailing || ''} ${g.label}`.toLowerCase().includes(q)
        )
      : g.items,
  })).filter((g) => g.items.length > 0)

  const handleClose = () => {
    setQuery('')
    onClose()
  }

  // Close help first so the next panel opens on its own
  const thenClose = (fn) => () => {
    handleClose()
    requestAnimationFrame(fn)
  }

  return (
    <AnimatedModal
      label="Help and keyboard shortcuts"
      open={open}
      onClose={handleClose}
      className="bg-surface sm:rounded-2xl shadow-2xl max-w-4xl w-full sm:mx-4 max-h-[92dvh] sm:max-h-[88vh] flex flex-col overflow-hidden modal-surface"
    >
      <div className="flex shrink-0 flex-wrap items-center gap-x-4 gap-y-2 border-b border-gray-200 pl-5 sm:pl-7 pr-3 py-3 sm:py-4">
        <h2 className="flex-1 font-serif text-2xl font-semibold text-text-strong">Help &amp; shortcuts</h2>
        <label className="order-3 flex h-10 sm:h-9 w-full items-center gap-2 rounded-[9px] bg-soft-accent px-2.5 text-text-muted focus-within:ring-2 focus-within:ring-secondary/15 sm:order-none sm:w-60 dark:bg-surface-raised">
          <Search size={14} aria-hidden="true" />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Find a shortcut"
            aria-label="Find a shortcut"
            className="w-full bg-transparent text-base sm:text-sm text-text-strong placeholder:text-text-muted focus:outline-none focus-visible:outline-none!"
          />
        </label>
        <Button variant="ghost" size="icon" onClick={handleClose} aria-label="Close">
          <X size={16} />
        </Button>
      </div>

      <div className="grid min-h-0 flex-1 grid-cols-1 overflow-y-auto app-scroll md:grid-cols-[minmax(0,1fr)_17rem]">
        <div className="px-5 sm:px-7 py-5">
          {groups.length === 0 ? (
            <p className="py-6 text-sm text-text-default">No shortcuts match &ldquo;{query}&rdquo;</p>
          ) : (
            <div className="grid grid-cols-1 gap-x-8 gap-y-6 sm:grid-cols-2">
              {groups.map((group) => (
                <section key={group.label} aria-label={group.label} className="space-y-2.5">
                  <h3 className="text-xs font-semibold text-text-default">{group.label}</h3>
                  <dl className="space-y-2.5">
                    {group.items.map(([desc, keys, trailing]) => (
                      <div key={desc} className="flex items-center justify-between gap-3">
                        <dt className="text-sm text-text-strong">{desc}</dt>
                        <dd>
                          <Keys keys={keys} trailing={trailing} />
                        </dd>
                      </div>
                    ))}
                  </dl>
                </section>
              ))}
            </div>
          )}
        </div>

        <aside className="space-y-5 border-t border-gray-200 bg-surface-raised px-5 sm:px-6 py-5 md:border-t-0 md:border-l">
          <section className="space-y-2">
            <h3 className="text-xs font-semibold text-text-default">How dates work</h3>
            <p className="text-[13px] leading-relaxed text-text-default">
              Every event has a precision:{' '}
              <strong className="font-semibold text-text-strong">Day, Month, Year, Decade or About</strong>. Pick it
              under the date when you edit an event.
            </p>
            <p className="text-[13px] leading-relaxed text-text-default">
              For a span of time, use <strong className="font-semibold text-text-strong">Add end date</strong>.
            </p>
            <p className="text-[13px] leading-relaxed text-text-default">
              Dates Claude wasn&rsquo;t sure about when importing are flagged so you can check them.
            </p>
          </section>
          <section className="space-y-1">
            <h3 className="mb-1.5 text-xs font-semibold text-text-default">Get started</h3>
            {onImportText && (
              <button type="button" onClick={thenClose(onImportText)} className={linkCls}>
                Import text with dates
                <ArrowRight size={14} className="text-text-muted" aria-hidden="true" />
              </button>
            )}
            {flaggedCount > 0 && (
              <button
                type="button"
                onClick={thenClose(() => useTimelineStore.getState().toggleReviewMode())}
                className={linkCls}
              >
                Check {pluralize(flaggedCount, 'flagged date')}
                <ArrowRight size={14} className="text-text-muted" aria-hidden="true" />
              </button>
            )}
            <button
              type="button"
              onClick={thenClose(() => useTimelineStore.getState().setInsightsPanelOpen(true))}
              className={linkCls}
            >
              Find gaps with Insights
              <ArrowRight size={14} className="text-text-muted" aria-hidden="true" />
            </button>
          </section>
        </aside>
      </div>
    </AnimatedModal>
  )
}
