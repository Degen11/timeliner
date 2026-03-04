import { useLocation } from 'react-router-dom'
import Header from './Header'
import Footer from './Footer'
import Toast from '@/components/shared/Toast'
import { useState, useCallback } from 'react'
import { ToolbarContext, FooterContext, SidebarContext } from './shellContexts'

export { useToolbar, useHideFooter, useSidebar } from './shellContexts' // eslint-disable-line react-refresh/only-export-components

export default function Shell({ children }) {
  const { pathname } = useLocation()
  const isShared = pathname === '/s'
  const [toolbarContent, setToolbarContent] = useState(null)
  const [footerHidden, setFooterHidden] = useState(false)
  const [sidebarContent, setSidebarContent] = useState(null)

  const setToolbar = useCallback((content) => {
    setToolbarContent(content)
  }, [])

  const setHideFooter = useCallback((hidden) => {
    setFooterHidden(hidden)
  }, [])

  const setSidebar = useCallback((content) => {
    setSidebarContent(content)
  }, [])

  return (
    <ToolbarContext.Provider value={setToolbar}>
      <FooterContext.Provider value={setHideFooter}>
        <SidebarContext.Provider value={setSidebar}>
          <div className="min-h-screen flex">
            {sidebarContent}

            <div className="flex-1 min-w-0 flex flex-col">
              <Header toolbarContent={toolbarContent} hideLogoOnDesktop={footerHidden} />
              <main className={`flex-1 ${isShared ? 'mx-auto w-full max-w-5xl px-4 py-10' : ''}`}>
                {children}
              </main>
              {!footerHidden && <Footer />}
              <Toast />
            </div>
          </div>
        </SidebarContext.Provider>
      </FooterContext.Provider>
    </ToolbarContext.Provider>
  )
}
