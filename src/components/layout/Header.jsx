import { useState } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { HelpCircle } from 'lucide-react'
import Logo from './Logo'
import useTimelineStore from '@/store/useTimelineStore'
import Button from '@/components/shared/Button'

export default function Header() {
  const { pathname } = useLocation()
  const eventCount = useTimelineStore((s) => s.events.length)
  const [showShortcuts, setShowShortcuts] = useState(false)

  return (
    <>
      <header className="border-b border-gray-200/80 bg-white/70 backdrop-blur-md sticky top-0 z-30">
        <div className="mx-auto flex h-14 max-w-5xl items-center justify-between px-4">
          <Link to="/" className="no-underline text-accent rounded-lg" aria-label="Home">
            <Logo size="sm" />
          </Link>

          <nav className="flex items-center gap-1">
            <NavLink to="/" active={pathname === '/'}>
              Input
            </NavLink>
            <NavLink to="/timeline" active={pathname === '/timeline'}>
              Timeline
              {eventCount > 0 && (
                <span className={`ml-1.5 inline-flex items-center justify-center min-w-[20px] h-5 rounded-full px-1.5 text-[11px] font-medium ${
                  pathname === '/timeline'
                    ? 'bg-white/20 text-white'
                    : 'bg-gray-200 text-gray-600'
                }`}>
                  {eventCount}
                </span>
              )}
            </NavLink>
            <span className="ml-1 w-px h-4 bg-gray-200" />
            <button
              onClick={() => setShowShortcuts(true)}
              className="rounded-lg p-1.5 text-gray-300 hover:text-gray-500 hover:bg-gray-100 transition-colors cursor-pointer"
              title="Keyboard shortcuts (?)"
            >
              <HelpCircle size={15} />
            </button>
          </nav>
        </div>
      </header>

      {showShortcuts && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/40"
          onClick={() => setShowShortcuts(false)}
        >
          <div
            className="bg-white rounded-xl shadow-2xl max-w-sm w-full mx-4 p-6"
            onClick={(e) => e.stopPropagation()}
          >
            <h3 className="font-display text-lg font-semibold text-gray-900 mb-4">
              Keyboard Shortcuts
            </h3>
            <div className="space-y-2 text-sm">
              {[
                ['1 / 2 / 3', 'Switch view (Vertical / Horizontal / Grid)'],
                ['N', 'Add new event'],
                ['Ctrl+Z', 'Undo'],
                ['Ctrl+Shift+Z', 'Redo'],
                ['Ctrl+P', 'Print / Export PDF'],
                ['Ctrl+Enter', 'Submit text (Input page)'],
                ['Esc', 'Close modals / Cancel edit'],
                ['Arrow Keys', 'Navigate photo lightbox'],
              ].map(([key, desc]) => (
                <div key={key} className="flex items-center justify-between gap-4">
                  <span className="text-gray-500">{desc}</span>
                  <kbd className="inline-flex items-center rounded bg-gray-100 px-2 py-0.5 text-xs font-mono text-gray-700 border border-gray-200 whitespace-nowrap">
                    {key}
                  </kbd>
                </div>
              ))}
            </div>
            <div className="mt-5 flex justify-end">
              <Button variant="secondary" size="sm" onClick={() => setShowShortcuts(false)}>
                Close
              </Button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}

function NavLink({ to, active, children }) {
  return (
    <Link
      to={to}
      className={`rounded-lg px-3 py-1.5 text-sm font-medium no-underline transition-all inline-flex items-center ${
        active
          ? 'bg-accent text-white'
          : 'text-gray-500 hover:text-gray-900 hover:bg-gray-100'
      }`}
    >
      {children}
    </Link>
  )
}
