import { X } from 'lucide-react'
import AnimatedModal from '@/components/shared/AnimatedModal'

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
    label: 'Navigation',
    items: [
      ['Esc', 'Close modal / Cancel'],
      ['\u2190 \u2192', 'Photo lightbox'],
      ['Double-click', 'Edit fields inline'],
    ],
  },
]

export default function ShortcutsModal({ open, onClose }) {
  return (
    <AnimatedModal
      open={open}
      onClose={onClose}
      className="bg-white rounded-xl shadow-2xl max-w-md w-full mx-4 max-h-[85vh] flex flex-col overflow-hidden modal-surface"
    >
      <div className="px-6 pt-6 pb-4 border-b border-gray-100 flex items-center justify-between shrink-0">
        <h3 className="font-display text-lg font-semibold text-gray-900">Help &amp; Shortcuts</h3>
        <button
          onClick={onClose}
          className="rounded-lg p-1.5 text-gray-400 hover:text-gray-900 hover:bg-gray-100 transition-colors cursor-pointer"
          aria-label="Close"
        >
          <X size={18} />
        </button>
      </div>
      <div className="px-6 py-5 space-y-5 overflow-y-auto flex-1 min-h-0">
        {SHORTCUT_GROUPS.map((group) => (
          <div key={group.label}>
            <p className="text-xs font-semibold text-secondary uppercase tracking-wider mb-2">
              {group.label}
            </p>
            <div className="space-y-1.5">
              {group.items.map(([key, desc]) => (
                <div key={key} className="flex items-center justify-between gap-4 py-1">
                  <span className="text-sm text-gray-600">{desc}</span>
                  <kbd className="inline-flex items-center rounded-md bg-gray-100 px-2 py-0.5 text-xs font-mono font-medium text-gray-700 border border-gray-200 whitespace-nowrap">
                    {key}
                  </kbd>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
      <div className="px-6 py-4 bg-gray-50 border-t border-gray-100 space-y-3 shrink-0">
        <div>
          <p className="text-xs font-semibold text-secondary uppercase tracking-wider mb-1.5">
            Date Editing Tips
          </p>
          <ul className="space-y-1 text-xs text-gray-500">
            <li>Click a date to open the calendar picker.</li>
            <li>
              Pick a year, then close &rarr; saves at{' '}
              <span className="font-medium text-gray-600">year</span> precision.
            </li>
            <li>
              Pick a year + month, then close &rarr; saves at{' '}
              <span className="font-medium text-gray-600">month</span> precision.
            </li>
            <li>
              Pick year + month + day &rarr; saves at{' '}
              <span className="font-medium text-gray-600">day</span> precision.
            </li>
            <li>
              Use <span className="font-medium text-gray-600">+ end date</span> on an event to add a
              date range.
            </li>
          </ul>
        </div>
        <p className="text-xs text-gray-400 text-center">
          Tip: Double-click any event title, description, or date to edit it inline.
        </p>
      </div>
    </AnimatedModal>
  )
}
