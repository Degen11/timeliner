export default function Badge({ children, variant = 'default', onRemove }) {
  const variants = {
    default: 'bg-gray-100 text-gray-600',
    accent: 'bg-accent-light text-accent',
    flag: 'bg-flag-light text-flag',
  }

  return (
    <span
      className={`inline-flex items-center gap-1 rounded-md px-2 py-0.5 text-xs font-medium ${variants[variant]}`}
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
