import { Slot } from '@radix-ui/react-slot'
import { cva } from 'class-variance-authority'
import { cn } from '@/lib/utils'

const buttonVariants = cva(
  'inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-lg text-sm font-medium transition-all duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-highlight/50 focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 cursor-pointer active:scale-[0.97]',
  {
    variants: {
      variant: {
        primary:
          'bg-primary text-white shadow-sm hover:bg-primary-hover active:bg-primary-hover',
        accent:
          'bg-highlight text-white shadow-sm hover:bg-orange-600 active:bg-orange-700',
        secondary:
          'bg-surface text-text-default border border-gray-200 shadow-sm hover:bg-surface-raised hover:text-text-strong active:bg-gray-200',
        ghost:
          'text-text-default hover:text-text-strong hover:bg-surface-raised active:bg-gray-200',
        danger:
          'bg-error text-white shadow-sm hover:bg-red-700 active:bg-red-800',
        outline:
          'border border-gray-200 bg-transparent text-text-default shadow-sm hover:bg-surface-raised hover:text-text-strong',
        link: 'text-secondary underline-offset-4 hover:underline',
      },
      size: {
        sm: 'h-8 px-3 text-xs gap-1.5',
        md: 'h-9 px-4 text-sm gap-2',
        lg: 'h-11 px-6 text-sm gap-2',
        icon: 'h-11 w-11 p-0 sm:h-9 sm:w-9',
      },
    },
    defaultVariants: {
      variant: 'primary',
      size: 'md',
    },
  }
)

const Button = ({ className, variant, size, asChild = false, ref, ...props }) => {
  const Comp = asChild ? Slot : 'button'
  return (
    <Comp
      type={asChild ? undefined : 'button'}
      className={cn(buttonVariants({ variant, size, className }))}
      ref={ref}
      {...props}
    />
  )
}
Button.displayName = 'Button'

export { Button, buttonVariants }
