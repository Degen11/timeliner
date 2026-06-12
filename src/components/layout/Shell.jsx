import { useLocation } from 'react-router-dom'
import clsx from 'clsx'
import Header from './Header'
import Footer from './Footer'
import BottomTabBar from './BottomTabBar'
import Toast from '@/components/shared/Toast'
import { useState } from 'react'
import { ToolbarContext, FooterContext, SidebarContext, MobileTabContext } from './shellContexts'

export default function Shell({ children }) {
  const { pathname } = useLocation()
  const isShared = pathname === '/s'
  const [toolbarContent, setToolbarContent] = useState(null)
  const [footerHidden, setFooterHidden] = useState(false)
  const [sidebarContent, setSidebarContent] = useState(null)
  const [mobileTab, setMobileTab] = useState('timeline')

  const showBottomBar = footerHidden && !isShared

  return (
    <ToolbarContext.Provider value={setToolbarContent}>
      <FooterContext.Provider value={setFooterHidden}>
        <SidebarContext.Provider value={setSidebarContent}>
          <MobileTabContext.Provider value={{ mobileTab, setMobileTab }}>
            <div className="min-h-screen flex">
              <a
                href="#main-content"
                className="sr-only focus:not-sr-only focus:fixed focus:top-3 focus:left-3 focus:z-[1200] focus:rounded-lg focus:bg-surface focus:px-4 focus:py-2 focus:text-sm focus:font-medium focus:text-text-strong focus:shadow-lg"
              >
                Skip to content
              </a>
              {sidebarContent}

              <div className="flex-1 min-w-0 flex flex-col">
                <Header toolbarContent={toolbarContent} hideLogoOnDesktop={footerHidden} />
                <main
                  id="main-content"
                  tabIndex={-1}
                  className={clsx(
                    'outline-none',
                    'flex-1',
                    isShared && 'mx-auto w-full max-w-5xl px-4 py-10',
                    showBottomBar && 'pb-20 lg:pb-0'
                  )}
                >
                  {children}
                </main>
                {!footerHidden && <Footer />}
                <Toast />
              </div>
            </div>

            {showBottomBar && (
              <BottomTabBar activeTab={mobileTab} onTabChange={setMobileTab} />
            )}
          </MobileTabContext.Provider>
        </SidebarContext.Provider>
      </FooterContext.Provider>
    </ToolbarContext.Provider>
  )
}
