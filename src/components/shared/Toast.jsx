import { Toaster } from 'sonner'

export default function Toast() {
  return (
    <Toaster
      position="bottom-center"
      toastOptions={{
        unstyled: true,
        classNames: {
          toast: 'flex items-center gap-2 w-full rounded-xl px-4 py-3 text-sm shadow-lg bg-gray-900 text-gray-100 dark:bg-gray-800 dark:text-gray-100',
          success: '!bg-emerald-600 !text-white dark:!bg-emerald-600',
          error: '!bg-red-600 !text-white dark:!bg-red-600',
          warning: '!bg-amber-500 !text-white dark:!bg-amber-500',
          title: 'flex-1',
          actionButton: '!bg-white/15 !text-white text-xs font-semibold rounded-lg px-2.5 py-1 hover:!bg-white/25 transition-colors cursor-pointer whitespace-nowrap',
          closeButton: '!bg-transparent !text-gray-400 hover:!text-white !border-0 !shadow-none',
        },
      }}
      closeButton
    />
  )
}
