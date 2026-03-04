export default function Button({
  children,
  variant = 'primary',
  size = 'md',
  disabled = false,
  className = '',
  ...props
}) {
  const base =
    'inline-flex items-center justify-center font-medium rounded-lg transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer'

  const variants = {
    primary: 'bg-primary text-white hover:bg-primary-hover active:bg-primary-hover shadow-sm',
    secondary:
      'bg-white text-gray-700 hover:bg-gray-50 hover:text-gray-900 active:bg-gray-100 border border-gray-200 shadow-sm',
    ghost: 'text-gray-500 hover:text-gray-900 hover:bg-gray-100 active:bg-gray-200/60',
    danger: 'bg-error text-white hover:bg-red-700 active:bg-red-800 shadow-sm',
  }

  const sizes = {
    sm: 'px-3 py-1.5 text-sm gap-1.5',
    md: 'px-4 py-2 text-sm gap-2',
    lg: 'px-6 py-3 text-sm gap-2',
  }

  return (
    <button
      type="button"
      className={`${base} ${variants[variant]} ${sizes[size]} ${className}`}
      disabled={disabled}
      {...props}
    >
      {children}
    </button>
  )
}
