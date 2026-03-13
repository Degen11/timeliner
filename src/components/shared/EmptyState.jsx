export default function EmptyState({ icon: Icon, title, description, children, hint }) {
  return (
    <div className="flex flex-col items-center justify-center py-12 text-center">
      {Icon && (
        <div className="mb-5 rounded-xl bg-gray-100 dark:bg-white/5 p-4">
          <Icon size={32} className="text-gray-400 dark:text-gray-500" />
        </div>
      )}
      <h3 className="font-display text-base font-semibold text-gray-900 dark:text-gray-100 mb-1">{title}</h3>
      {description && (
        <p className="text-sm text-gray-500 dark:text-gray-400 max-w-md leading-relaxed">{description}</p>
      )}
      {hint && (
        <p className="text-xs text-gray-400 dark:text-gray-500 mt-2 max-w-sm">{hint}</p>
      )}
      {children && <div className="mt-5">{children}</div>}
    </div>
  )
}
