import { Search, X } from 'lucide-react'

export default function SearchInput({ value, onChange, dark = false }) {
  return (
    <div className="relative">
      <Search
        size={15}
        className={`absolute left-3 top-1/2 -translate-y-1/2 ${dark ? 'text-sidebar-muted' : 'text-gray-400'}`}
      />
      <input
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder="Search events…"
        aria-label="Search events"
        className={
          dark
            ? 'w-full rounded-lg border border-sidebar-input-border bg-sidebar-input py-2 pl-9 pr-8 text-sm text-sidebar-text placeholder:text-sidebar-muted focus:border-secondary focus:ring-2 focus:ring-secondary/20 focus:outline-none transition-all'
            : 'w-full rounded-lg border border-gray-200 bg-white py-2 pl-9 pr-8 text-sm text-gray-700 placeholder:text-gray-400 focus:border-secondary focus:ring-2 focus:ring-secondary/10 focus:outline-none transition-colors'
        }
      />
      {value && (
        <button
          onClick={() => onChange('')}
          className={`absolute right-2 top-1/2 -translate-y-1/2 rounded p-0.5 transition-colors cursor-pointer ${
            dark
              ? 'text-sidebar-muted hover:text-sidebar-text'
              : 'text-gray-400 hover:text-gray-700'
          }`}
          aria-label="Clear search"
        >
          <X size={14} />
        </button>
      )}
    </div>
  )
}
