import { createContext, useContext } from 'react'

export const ToolbarContext = createContext(null)
export function useToolbar() {
  return useContext(ToolbarContext)
}

export const FooterContext = createContext(null)
export function useHideFooter() {
  return useContext(FooterContext)
}

export const SidebarContext = createContext(null)
export function useSidebar() {
  return useContext(SidebarContext)
}

export const MobileTabContext = createContext(null)
export function useMobileTab() {
  return useContext(MobileTabContext)
}
