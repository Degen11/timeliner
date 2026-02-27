export default function Button({
  children,
  variant = 'primary',
  size = 'md',
  disabled = false,
  className = '',
  ...props
}) {
  const base = 'inline-flex items-center justify-center font-medium rounded-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer'

  const variants = {
    primary: 'bg-accent text-white hover:bg-accent-hover shadow-sm hover:shadow',
    secondary: 'bg-white text-gray-700 hover:bg-gray-50 border border-gray-200 hover:border-gray-300 shadow-sm',
    ghost: 'text-gray-500 hover:text-gray-900 hover:bg-gray-100',
    danger: 'bg-error text-white hover:bg-red-700 shadow-sm hover:shadow',
  }

  const sizes = {
    sm: 'px-3 py-1.5 text-sm gap-1.5',
    md: 'px-4 py-2 text-sm gap-2',
    lg: 'px-5 py-2.5 text-base gap-2',
  }

  return (
    <button
      className={`${base} ${variants[variant]} ${sizes[size]} ${className}`}
      disabled={disabled}
      {...props}
    >
      {children}
    </button>
  )
}
