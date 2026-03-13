import { Toaster } from 'sonner'

export default function Toast() {
  return (
    <Toaster
      position="bottom-center"
      toastOptions={{
        className: 'toast-surface',
        style: {
          borderRadius: '0.75rem',
          fontSize: '0.875rem',
        },
      }}
      richColors
      closeButton
    />
  )
}
