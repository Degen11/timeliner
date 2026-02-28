import { Link } from 'react-router-dom'
import Logo from './Logo'
import useTimelineStore from '@/store/useTimelineStore'

export default function Header({ toolbarContent }) {
  const collapsed = useTimelineStore((s) => s.sidebarCollapsed)

  return (
    <header className="border-b border-gray-200/80 bg-white/70 backdrop-blur-md sticky top-0 z-30">
      <div className="flex h-14 items-center px-4 gap-3">
        <Link to="/" className="no-underline text-text-strong rounded-lg shrink-0" aria-label="Home">
          <Logo size="sm" />
        </Link>
        {toolbarContent && (
          <>
            {/* Spacer to align toolbar content with the main canvas (past the sidebar) */}
            <div
              className="hidden lg:block shrink-0 transition-[width] duration-200 ease-in-out"
              style={{ width: collapsed ? 0 : 135 }}
            />
            <div className="flex-1 min-w-0 flex items-center">
              {toolbarContent}
            </div>
          </>
        )}
      </div>
    </header>
  )
}
