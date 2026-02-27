const TAG_COLORS = {
  career:     'bg-blue-100 text-blue-700',
  education:  'bg-violet-100 text-violet-700',
  travel:     'bg-emerald-100 text-emerald-700',
  family:     'bg-rose-100 text-rose-700',
  health:     'bg-red-100 text-red-700',
  military:   'bg-slate-200 text-slate-700',
  relocation: 'bg-amber-100 text-amber-700',
}

const VARIANTS = {
  default: 'bg-gray-100 text-gray-600',
  accent:  'bg-accent-light text-accent',
  flag:    'bg-flag-light text-flag',
}

export default function Badge({ children, variant = 'default', small = false, onRemove }) {
  const cls = TAG_COLORS[variant] || VARIANTS[variant] || VARIANTS.default
  const sizeCls = small ? 'px-1.5 py-0 text-[10px]' : 'px-2 py-0.5 text-xs'

  return (
    <span
      className={`inline-flex items-center gap-1 rounded-full font-medium ${sizeCls} ${cls}`}
    >
      {children}
      {onRemove && (
        <button
          onClick={onRemove}
          className="ml-0.5 hover:text-gray-900 transition-colors cursor-pointer"
          aria-label="Remove"
        >
          &times;
        </button>
      )}
    </span>
  )
}
