import { X } from 'lucide-react'
import AnimatedModal from '@/components/shared/AnimatedModal'
import Button from '@/components/shared/Button'

const SHORTCUT_GROUPS = [
  {
    label: 'Views',
    items: [
      ['1', 'Vertical view'],
      ['2', 'Horizontal view'],
      ['3', 'Grid view'],
    ],
  },
  {
    label: 'Actions',
    items: [
      ['N', 'New event'],
      [navigator.platform?.includes('Mac') ? '\u2318+Z' : 'Ctrl+Z', 'Undo'],
      [navigator.platform?.includes('Mac') ? '\u2318+\u21e7+Z' : 'Ctrl+Shift+Z', 'Redo'],
      [navigator.platform?.includes('Mac') ? '\u2318+P' : 'Ctrl+P', 'Print / PDF'],
    ],
  },
  {
    label: 'Selection',
    items: [
      [navigator.platform?.includes('Mac') ? '\u2318+Click' : 'Ctrl+Click', 'Toggle select event'],
      ['Shift+Click', 'Range select events'],
      [navigator.platform?.includes('Mac') ? '\u2318+A' : 'Ctrl+A', 'Select all events'],
      ['Esc', 'Deselect all / Close modal'],
    ],
  },
  {
    label: 'Navigation',
    items: [
      ['\u2190 \u2192', 'Photo lightbox'],
    ],
  },
]

export default function ShortcutsModal({ open, onClose }) {
  return (
    <AnimatedModal
      open={open}
      onClose={onClose}
      className="bg-surface rounded-xl shadow-2xl max-w-md w-full mx-4 max-h-[85vh] flex flex-col overflow-hidden modal-surface"
    >
      <div className="px-5 py-4 border-b border-gray-200 flex items-center justify-between shrink-0">
        <h3 className="text-base font-semibold text-text-strong">Help &amp; Shortcuts</h3>
        <Button variant="ghost" size="icon" onClick={onClose} aria-label="Close">
          <X size={16} />
        </Button>
      </div>
      <div className="px-5 py-4 space-y-5 overflow-y-auto app-scroll flex-1 min-h-0">
        {SHORTCUT_GROUPS.map((group) => (
          <div key={group.label}>
            <p className="text-xs font-semibold text-secondary uppercase tracking-wider mb-2">
              {group.label}
            </p>
            <div className="space-y-1.5">
              {group.items.map(([key, desc]) => (
                <div key={key} className="flex items-center justify-between gap-4 py-1">
                  <span className="text-sm text-text-default">{desc}</span>
                  <kbd className="inline-flex items-center rounded-lg bg-gray-100 px-2 py-0.5 text-xs font-mono font-medium text-text-default border border-gray-200 whitespace-nowrap">
                    {key}
                  </kbd>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
      <div className="px-5 py-4 bg-surface-raised border-t border-gray-200 space-y-3 shrink-0">
        <div>
          <p className="text-xs font-semibold text-secondary uppercase tracking-wider mb-1.5">
            Date Editing Tips
          </p>
          <ul className="space-y-1 text-xs text-text-muted">
            <li>Click a date to open the calendar picker.</li>
            <li>
              Pick a year, then close &rarr; saves at{' '}
              <span className="font-medium text-text-default">year</span> precision.
            </li>
            <li>
              Pick a year + month, then close &rarr; saves at{' '}
              <span className="font-medium text-text-default">month</span> precision.
            </li>
            <li>
              Pick year + month + day &rarr; saves at{' '}
              <span className="font-medium text-text-default">day</span> precision.
            </li>
            <li>
              Use <span className="font-medium text-text-default">+ end date</span> on an event to add a
              date range.
            </li>
          </ul>
        </div>
        <p className="text-xs text-text-muted text-center">
          Tip: Click any event card to open it for editing.
        </p>
      </div>
    </AnimatedModal>
  )
}
