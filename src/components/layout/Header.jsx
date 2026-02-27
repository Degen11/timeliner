import { Link, useLocation } from 'react-router-dom'
import { Clock } from 'lucide-react'

export default function Header() {
  const { pathname } = useLocation()

  return (
    <header className="border-b border-gray-200 bg-white">
      <div className="mx-auto flex h-14 max-w-5xl items-center justify-between px-4">
        <Link to="/" className="flex items-center gap-2 text-gray-900 no-underline">
          <Clock size={20} className="text-accent" />
          <span className="text-base font-semibold">Timeliner</span>
        </Link>

        <nav className="flex items-center gap-1">
          <NavLink to="/" active={pathname === '/'}>
            Input
          </NavLink>
          <NavLink to="/timeline" active={pathname === '/timeline'}>
            Timeline
          </NavLink>
        </nav>
      </div>
    </header>
  )
}

function NavLink({ to, active, children }) {
  return (
    <Link
      to={to}
      className={`rounded px-3 py-1.5 text-sm font-medium no-underline transition-colors ${
        active
          ? 'bg-accent-light text-accent'
          : 'text-gray-500 hover:text-gray-700 hover:bg-gray-100'
      }`}
    >
      {children}
    </Link>
  )
}
