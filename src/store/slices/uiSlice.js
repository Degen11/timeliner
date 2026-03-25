import { toast as sonnerToast } from 'sonner'
import { VIEWS, SORT_OPTIONS, TOAST_DURATION, setCustomTagRegistry } from '@/utils/constants'

export function createUISlice(set, get, { persist }) {
  return {
    // View & layout
    activeView: VIEWS.VERTICAL,
    filters: { search: '', people: [], tags: [] },
    reviewMode: false,
    sortOrder: SORT_OPTIONS.DATE_ASC,
    groupZoom: 'year',
    verticalCompact: false,
    verticalDesign: 'classic',
    horizontalDesign: 'classic',
    sidebarCollapsed: false,
    darkMode: false,
    draftText: '',

    // Custom tags
    customTags: [],

    // Parsing
    isParsing: false,
    parseError: null,

    // Insights (timeline analysis)
    insightsPanelOpen: false,
    insightsLoading: false,
    insightsData: null,       // { insights: [...], usage: {...} }
    insightsError: null,
    dismissedInsightIds: [],

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

    setFilters: (filters) => {
      set({ filters })
      persist({ ...get(), filters })
    },
    clearFilters: () => {
      const filters = { search: '', people: [], tags: [] }
      set({ filters })
      persist({ ...get(), filters })
    },
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

    // ─── Insights ──────────────────────────────────────────
    setInsightsPanelOpen: (open) => set({ insightsPanelOpen: open }),

    fetchInsights: async () => {
      const events = get().events
      if (!events || events.length === 0) return

      set({ insightsLoading: true, insightsError: null })

      try {
        const response = await fetch('/api/analyze', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ events }),
        })

        if (!response.ok) {
          const err = await response.json().catch(() => ({}))
          throw new Error(err.error || `Request failed (${response.status})`)
        }

        const data = await response.json()
        set({ insightsData: data, insightsLoading: false })
      } catch (err) {
        set({ insightsError: err.message, insightsLoading: false })
      }
    },

    dismissInsight: (id) => {
      set({ dismissedInsightIds: [...get().dismissedInsightIds, id] })
    },

    clearInsights: () => {
      set({ insightsData: null, insightsError: null, dismissedInsightIds: [] })
    },

    showToast: (message, opts) => {
      const duration = typeof opts === 'number' ? opts : (opts?.duration ?? TOAST_DURATION.DEFAULT)
      const actionLabel = typeof opts === 'object' ? opts?.actionLabel : undefined
      const onAction = typeof opts === 'object' ? opts?.onAction : undefined

      const toastOpts = { duration }
      if (actionLabel && onAction) {
        toastOpts.action = { label: actionLabel, onClick: onAction }
      }

      sonnerToast(message, toastOpts)
    },

    clearToast: () => sonnerToast.dismiss(),
    setIsParsing: (isParsing) => set({ isParsing }),
    setParseError: (parseError) => set({ parseError }),
  }
}
