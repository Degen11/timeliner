import { useLocation } from 'react-router-dom'
import Header from './Header'
import Footer from './Footer'
import Toast from '@/components/shared/Toast'
import { useState, useCallback } from 'react'
import { ToolbarContext, FooterContext } from './shellContexts'

export { useToolbar, useHideFooter } from './shellContexts' // eslint-disable-line react-refresh/only-export-components -- re-exports for convenience

export default function Shell({ children }) {
  const { pathname } = useLocation()
  const isShared = pathname === '/s'
  const [toolbarContent, setToolbarContent] = useState(null)
  const [footerHidden, setFooterHidden] = useState(false)

  const setToolbar = useCallback((content) => {
    setToolbarContent(content)
  }, [])

  const setHideFooter = useCallback((hidden) => {
    setFooterHidden(hidden)
  }, [])

  return (
    <ToolbarContext.Provider value={setToolbar}>
      <FooterContext.Provider value={setHideFooter}>
        <div className="min-h-screen flex flex-col">
          <Header toolbarContent={toolbarContent} hideLogoOnDesktop={footerHidden} />
          <main className={`flex-1 ${isShared ? 'mx-auto w-full max-w-5xl px-4 py-10' : ''}`}>
            {children}
          </main>
          {!footerHidden && <Footer />}
          <Toast />
        </div>
      </FooterContext.Provider>
    </ToolbarContext.Provider>
  )
}
