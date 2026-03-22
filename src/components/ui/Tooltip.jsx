import * as TooltipPrimitive from '@radix-ui/react-tooltip'
import { cn } from '@/lib/utils'

const TooltipProvider = TooltipPrimitive.Provider

const TooltipRoot = TooltipPrimitive.Root

const TooltipTrigger = TooltipPrimitive.Trigger

const TooltipContent = ({ className, sideOffset = 6, ref, ...props }) => (
  <TooltipPrimitive.Portal>
    <TooltipPrimitive.Content
      ref={ref}
      sideOffset={sideOffset}
      className={cn(
        'z-[100] overflow-hidden rounded-lg px-2.5 py-1.5 text-xs font-medium shadow-lg',
        className
      )}
      style={{
        backgroundColor: 'var(--color-tooltip-bg)',
        color: 'var(--color-tooltip-text)',
        border: '1px solid rgba(255, 255, 255, 0.1)',
        animation: 'tooltip-in 150ms ease-out',
      }}
      {...props}
    />
  </TooltipPrimitive.Portal>
)
TooltipContent.displayName = 'TooltipContent'

/**
 * Convenience wrapper matching the old Tooltip API:
 *   <Tooltip label="..." shortcut="..."><Button /></Tooltip>
 *
 * This makes migration easier — existing call sites keep working.
 */
function Tooltip({ children, label, shortcut, side, position, delayDuration = 400 }) {
  // Support legacy `position` prop as alias for `side`
  const resolvedSide = side || position || 'bottom'

  if (!label) return children

  return (
    <TooltipRoot delayDuration={delayDuration}>
      <TooltipTrigger asChild>{children}</TooltipTrigger>
      <TooltipContent side={resolvedSide}>
        <span className="flex items-center gap-2">
          <span>{label}</span>
          {shortcut && (
            <kbd
              className="inline-flex items-center rounded-lg px-1.5 py-0.5 text-xs font-mono"
              style={{ backgroundColor: 'var(--color-tooltip-kbd)' }}
            >
              {shortcut}
            </kbd>
          )}
        </span>
      </TooltipContent>
    </TooltipRoot>
  )
}

export {
  Tooltip,
  TooltipRoot,
  TooltipTrigger,
  TooltipContent,
  TooltipProvider,
}
