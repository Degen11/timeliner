import { Globe, Github } from 'lucide-react'

export default function Footer() {
  return (
    <footer className="py-4 text-center flex flex-col items-center gap-2">
      <span className="text-xs text-gray-500">Built by Degen Hill</span>
      <div className="flex items-center gap-3">
        <a
          href="https://www.degenh.com"
          target="_blank"
          rel="noopener noreferrer"
          aria-label="Website"
          className="text-gray-900 hover:text-gray-600 transition-colors"
        >
          <Globe size={16} strokeWidth={2} />
        </a>
        <a
          href="https://github.com/Degen11"
          target="_blank"
          rel="noopener noreferrer"
          aria-label="GitHub"
          className="text-gray-900 hover:text-gray-600 transition-colors"
        >
          <Github size={16} strokeWidth={2} />
        </a>
      </div>
    </footer>
  )
}
