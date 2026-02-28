import { getTagColor } from '@/utils/constants'

const VARIANTS = {
  default: 'bg-gray-100 text-gray-600',
  accent:  'bg-secondary/10 text-secondary',
  flag:    'bg-flag-light text-flag',
}

export default function Badge({ children, variant = 'default', small = false, onRemove }) {
  const cls = VARIANTS[variant] || getTagColor(variant) || VARIANTS.default
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
