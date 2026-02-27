import Header from './Header'
import Toast from '@/components/shared/Toast'

export default function Shell({ children }) {
  return (
    <div className="min-h-screen flex flex-col bg-white">
      <Header />
      <main className="flex-1 mx-auto w-full max-w-5xl px-4 py-10">
        {children}
      </main>
      <Toast />
    </div>
  )
}
