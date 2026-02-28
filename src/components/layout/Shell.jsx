import { useLocation } from 'react-router-dom'
import Header from './Header'
import Footer from './Footer'
import Toast from '@/components/shared/Toast'

export default function Shell({ children }) {
  const { pathname } = useLocation()
  const isShared = pathname === '/s'

  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      <main className={`flex-1 ${isShared ? 'mx-auto w-full max-w-5xl px-4 py-10' : ''}`}>
        {children}
      </main>
      {isShared && <Footer />}
      <Toast />
    </div>
  )
}
