import { useLocation } from 'react-router-dom'
import Header from './Header'
import Footer from './Footer'
import Toast from '@/components/shared/Toast'
import { createContext, useContext, useState, useCallback } from 'react'

const ToolbarContext = createContext(null)
export function useToolbar() { return useContext(ToolbarContext) }

export default function Shell({ children }) {
  const { pathname } = useLocation()
  const isShared = pathname === '/s'
  const [toolbarContent, setToolbarContent] = useState(null)

  const setToolbar = useCallback((content) => {
    setToolbarContent(content)
  }, [])

  return (
    <ToolbarContext.Provider value={setToolbar}>
      <div className="min-h-screen flex flex-col">
        <Header toolbarContent={toolbarContent} />
        <main className={`flex-1 ${isShared ? 'mx-auto w-full max-w-5xl px-4 py-10' : ''}`}>
          {children}
        </main>
        <Footer />
        <Toast />
      </div>
    </ToolbarContext.Provider>
  )
}
