import { Search, X } from 'lucide-react'

export default function SearchInput({ value, onChange }) {
  return (
    <div className="relative">
      <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
      <input
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder="Search events…"
        aria-label="Search events"
        className="w-full rounded-lg border border-gray-200 bg-white py-1.5 pl-8 pr-8 text-sm text-gray-700 placeholder:text-gray-400 focus:border-accent focus:outline-none transition-colors"
      />
      {value && (
        <button
          onClick={() => onChange('')}
          className="absolute right-2 top-1/2 -translate-y-1/2 rounded p-0.5 text-gray-400 hover:text-gray-700 transition-colors cursor-pointer"
          aria-label="Clear search"
        >
          <X size={14} />
        </button>
      )}
    </div>
  )
}
