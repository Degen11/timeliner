import { VIEWS, setCustomTagRegistry } from '@/utils/constants'

export function createUISlice(set, get, { persist }) {
  return {
    // View & layout
    activeView: VIEWS.VERTICAL,
    filters: { search: '', people: [], tags: [] },
    reviewMode: false,
    sortOrder: 'date-asc',
    groupZoom: 'year',
    verticalCompact: false,
    verticalDesign: 'classic',
    horizontalDesign: 'classic',
    sidebarCollapsed: false,
    darkMode: false,
    draftText: '',

    // Custom tags
    customTags: [],

    // Toast
    toast: null,

    // Parsing
    isParsing: false,
    parseError: null,

    setActiveView: (activeView) => {
      set({ activeView })
      persist({ ...get(), activeView })
    },

    setSortOrder: (sortOrder) => {
      set({ sortOrder })
      persist({ ...get(), sortOrder })
    },

    setGroupZoom: (groupZoom) => {
      set({ groupZoom })
      persist({ ...get(), groupZoom })
    },

    setVerticalCompact: (verticalCompact) => {
      set({ verticalCompact })
      persist({ ...get(), verticalCompact })
    },

    setVerticalDesign: (verticalDesign) => {
      set({ verticalDesign })
      persist({ ...get(), verticalDesign })
    },

    setHorizontalDesign: (horizontalDesign) => {
      set({ horizontalDesign })
      persist({ ...get(), horizontalDesign })
    },

    toggleSidebar: () => {
      const sidebarCollapsed = !get().sidebarCollapsed
      set({ sidebarCollapsed })
      persist({ ...get(), sidebarCollapsed })
    },

    toggleDarkMode: () => {
      const darkMode = !get().darkMode
      set({ darkMode })
      persist({ ...get(), darkMode })
      document.documentElement.classList.toggle('dark', darkMode)
    },

    setFilters: (filters) => set({ filters }),
    clearFilters: () => set({ filters: { search: '', people: [], tags: [] } }),
    toggleReviewMode: () => set({ reviewMode: !get().reviewMode }),

    addCustomTag: (tag) => {
      const trimmed = tag.trim().toLowerCase()
      if (!trimmed) return
      const existing = get().customTags
      if (existing.includes(trimmed)) return
      const customTags = [...existing, trimmed]
      set({ customTags })
      setCustomTagRegistry(customTags)
      persist({ ...get(), customTags })
    },

    removeCustomTag: (tag) => {
      const customTags = get().customTags.filter((t) => t !== tag)
      set({ customTags })
      setCustomTagRegistry(customTags)
      persist({ ...get(), customTags })
    },

    setDraftText: (draftText) => set({ draftText }),

    showToast: (message, opts) => {
      const duration = typeof opts === 'number' ? opts : (opts?.duration ?? 3000)
      const variant = typeof opts === 'object' ? (opts?.variant ?? 'success') : 'success'
      const actionLabel = typeof opts === 'object' ? opts?.actionLabel : undefined
      const onAction = typeof opts === 'object' ? opts?.onAction : undefined
      const toast = { message, variant, duration, actionLabel, onAction }
      set({ toast })
      setTimeout(() => {
        if (get().toast === toast) set({ toast: null })
      }, duration)
    },

    clearToast: () => set({ toast: null }),
    setIsParsing: (isParsing) => set({ isParsing }),
    setParseError: (parseError) => set({ parseError }),
  }
}
