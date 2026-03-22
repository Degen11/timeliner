import * as DialogPrimitive from '@radix-ui/react-dialog'
import { X } from 'lucide-react'
import { cn } from '@/lib/utils'

const Dialog = DialogPrimitive.Root
const DialogTrigger = DialogPrimitive.Trigger
const DialogPortal = DialogPrimitive.Portal
const DialogClose = DialogPrimitive.Close

const DialogOverlay = ({ className, ref, ...props }) => (
  <DialogPrimitive.Overlay
    ref={ref}
    className={cn(
      'fixed inset-0 z-50 bg-black/40 radix-overlay-animate',
      className
    )}
    {...props}
  />
)
DialogOverlay.displayName = 'DialogOverlay'

const DialogContent = ({ className, children, showClose = true, ref, ...props }) => (
  <DialogPortal>
    <DialogOverlay />
    <DialogPrimitive.Content
      ref={ref}
      className={cn(
        'fixed left-1/2 top-1/2 z-50 w-full max-w-lg -translate-x-1/2 -translate-y-1/2',
        'bg-surface rounded-2xl shadow-lg border border-gray-200',
        'max-h-[90vh] overflow-y-auto',
        'radix-content-animate',
        className
      )}
      {...props}
    >
      {children}
      {showClose && (
        <DialogPrimitive.Close className="absolute right-4 top-4 rounded-lg p-1.5 text-text-muted hover:text-text-strong hover:bg-surface-raised transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-secondary/50 cursor-pointer">
          <X className="h-4 w-4" />
          <span className="sr-only">Close</span>
        </DialogPrimitive.Close>
      )}
    </DialogPrimitive.Content>
  </DialogPortal>
)
DialogContent.displayName = 'DialogContent'

const DialogHeader = ({ className, ...props }) => (
  <div
    className={cn(
      'flex flex-col gap-1.5 px-6 pt-6 pb-4',
      className
    )}
    {...props}
  />
)

const DialogFooter = ({ className, ...props }) => (
  <div
    className={cn(
      'flex items-center justify-end gap-2 px-6 pb-6 pt-2',
      className
    )}
    {...props}
  />
)

const DialogTitle = ({ className, ref, ...props }) => (
  <DialogPrimitive.Title
    ref={ref}
    className={cn(
      'text-lg font-semibold text-text-strong leading-none tracking-tight',
      className
    )}
    {...props}
  />
)
DialogTitle.displayName = 'DialogTitle'

const DialogDescription = ({ className, ref, ...props }) => (
  <DialogPrimitive.Description
    ref={ref}
    className={cn('text-sm text-text-muted', className)}
    {...props}
  />
)
DialogDescription.displayName = 'DialogDescription'

export {
  Dialog,
  DialogPortal,
  DialogOverlay,
  DialogClose,
  DialogTrigger,
  DialogContent,
  DialogHeader,
  DialogFooter,
  DialogTitle,
  DialogDescription,
}
