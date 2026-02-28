import { Link } from 'react-router-dom'
import Logo from './Logo'

export default function Header() {
  return (
    <header className="border-b border-gray-200/80 bg-white/70 backdrop-blur-md sticky top-0 z-30">
      <div className="flex h-14 items-center px-4">
        <Link to="/" className="no-underline text-primary rounded-lg" aria-label="Home">
          <Logo size="sm" />
        </Link>
      </div>
    </header>
  )
}
