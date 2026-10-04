import { useRef } from 'react'
import { useHotkeys } from 'react-hotkeys-hook'
import { X, Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import AnimatedModal from '@/components/shared/AnimatedModal'

const isMac = typeof navigator !== 'undefined' && navigator.platform?.includes('Mac')

/**
 * Modal frame for the add/edit event forms: a small eyebrow header, a
 * scrolling body, and a footer pinned to the bottom so Save is always visible.
 * Mod+Enter submits from anywhere in the form.
 */
export default function EventFormShell({
  open,
  onClose,
  label,
  eyebrow,
  onSubmit,
  isSubmitting,
  submitLabel,
  submittingLabel,
  footerStart,
  children,
}) {
  const formRef = useRef(null)

  useHotkeys('mod+enter', (e) => {
    e.preventDefault()
    formRef.current?.requestSubmit()
  }, { enabled: open, enableOnFormTags: true, enableOnContentEditable: true })

  return (
    <AnimatedModal
      label={label}
      open={open}
      onClose={onClose}
      className="bg-surface sm:rounded-2xl shadow-2xl max-w-2xl w-full sm:mx-4 max-h-[92dvh] sm:max-h-[90vh] flex flex-col overflow-hidden modal-surface"
    >
      <div className="flex shrink-0 items-center justify-between px-5 sm:px-6 pt-3 sm:pt-5">
        <span className="text-xs font-medium text-text-muted">{eyebrow}</span>
        <Button variant="ghost" size="icon" onClick={onClose} aria-label="Close" className="-mr-2">
          <X size={16} />
        </Button>
      </div>

      <form ref={formRef} onSubmit={onSubmit} className="flex min-h-0 flex-1 flex-col">
        <div className="flex-1 overflow-y-auto px-5 sm:px-6 pt-1 pb-6 app-scroll">{children}</div>

        <div className="flex shrink-0 flex-wrap items-center gap-2 border-t border-gray-200 bg-surface-raised px-5 sm:px-6 py-3">
          <div className="flex items-center gap-1 -ml-2.5">{footerStart}</div>
          <span className="flex-1" />
          <span className="hidden sm:inline text-xs text-text-muted mr-1" aria-hidden="true">
            <kbd className="rounded-[5px] border border-gray-300 bg-surface px-1.5 font-sans">{isMac ? '⌘' : 'Ctrl'}</kbd>{' '}
            <kbd className="rounded-[5px] border border-gray-300 bg-surface px-1.5 font-sans">↵</kbd> to save
          </span>
          <Button variant="secondary" type="button" onClick={onClose} className="rounded-[10px]">
            Cancel
          </Button>
          <button
            type="submit"
            disabled={isSubmitting}
            className="inline-flex h-11 sm:h-9 items-center gap-2 rounded-[10px] bg-text-strong px-4 text-sm font-semibold text-canvas shadow-sm transition-opacity duration-150 hover:opacity-90 disabled:opacity-60 cursor-pointer disabled:cursor-default focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus-ring focus-visible:ring-offset-2"
          >
            {isSubmitting ? (
              <>
                <Loader2 size={14} className="animate-spin" />
                {submittingLabel}
              </>
            ) : (
              submitLabel
            )}
          </button>
        </div>
      </form>
    </AnimatedModal>
  )
}
