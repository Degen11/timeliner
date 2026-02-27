import { Link, useLocation } from 'react-router-dom'
import Logo from './Logo'

export default function Header() {
  const { pathname } = useLocation()

  return (
    <header className="border-b border-gray-200 bg-white/80 backdrop-blur-md sticky top-0 z-30">
      <div className="mx-auto flex h-14 max-w-5xl items-center justify-between px-4">
        <Link to="/" className="no-underline text-accent">
          <Logo size="sm" />
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
      className={`rounded-lg px-3 py-1.5 text-sm font-medium no-underline transition-all ${
        active
          ? 'bg-accent text-white'
          : 'text-gray-500 hover:text-gray-900 hover:bg-gray-100'
      }`}
    >
      {children}
    </Link>
  )
}
