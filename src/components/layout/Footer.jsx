import { Globe, Github } from 'lucide-react'

export default function Footer() {
  return (
    <footer className="py-4 text-center flex flex-col items-center gap-2">
      <span className="text-xs text-text-muted">Built by Degen Hill</span>
      <div className="flex items-center gap-3">
        <a
          href="https://www.degenh.com"
          target="_blank"
          rel="noopener noreferrer"
          aria-label="Website"
          className="text-text-default hover:text-text-muted transition-colors duration-150"
        >
          <Globe size={16} />
        </a>
        <a
          href="https://github.com/Degen11"
          target="_blank"
          rel="noopener noreferrer"
          aria-label="GitHub"
          className="text-text-default hover:text-text-muted transition-colors duration-150"
        >
          <Github size={16} />
        </a>
      </div>
    </footer>
  )
}
