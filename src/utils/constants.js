export const VIEWS = {
  VERTICAL: 'vertical',
  HORIZONTAL: 'horizontal',
  GRID: 'grid',
  MAP: 'map',
  GRAPH: 'graph',
}

/** Label-value pairs for date precision <select> options */
export const DATE_PRECISION_OPTIONS = [
  { value: 'day', label: 'Exact day' },
  { value: 'month', label: 'Month' },
  { value: 'year', label: 'Year' },
  { value: 'decade', label: 'Decade' },
  { value: 'approximate', label: 'Approximate' },
]

// ─── Recurrence Options ─────────────────────────────────────
export const RECURRENCE_OPTIONS = [
  { value: 'yearly', label: 'Yearly' },
  { value: 'monthly', label: 'Monthly' },
  { value: 'weekly', label: 'Weekly' },
  { value: 'custom', label: 'Custom' },
]

export const STORAGE_KEY = 'timeliner_data'

export const MAX_TEXT_LENGTH = 50_000

export const SORT_OPTIONS = {
  DATE_ASC: 'date-asc',
  DATE_DESC: 'date-desc',
  TITLE_ASC: 'title-asc',
  TITLE_DESC: 'title-desc',
}

// ─── Timing Constants ────────────────────────────────────────
export const LOCAL_SAVE_DEBOUNCE_MS = 500
export const REMOTE_SYNC_DEBOUNCE_MS = 1500
export const TOAST_DURATION = {
  DEFAULT: 3000,
  MEDIUM: 5000,
  LONG: 7000,
  SYNC_ERROR: 10000,
}
export const UNDO_WINDOW_MS = 6000
export const SUCCESS_DISPLAY_MS = 2500

// ─── API Constants ───────────────────────────────────────────
export const PHOTO_CACHE_TTL = '31536000' // 1 year in seconds (immutable content)
export const SIGNED_URL_EXPIRY = 3600     // 1 hour in seconds
export const SIGNED_URL_BUFFER = 300      // 5 minutes buffer before expiry

// ─── Motion / Animation Constants ────────────────────────
export const MOTION_DURATION = {
  INSTANT: 0.1,
  FAST: 0.15,
  NORMAL: 0.25,
  SLOW: 0.4,
}

export const SPRING = {
  /** Modals, overlays — gentle, minimal bounce */
  GENTLE: { type: 'spring', duration: 0.4, bounce: 0.05 },
  /** Tabs, nav indicators — subtle bounce */
  SNAPPY: { type: 'spring', duration: 0.35, bounce: 0.15 },
  /** Success badges, celebratory — visible bounce */
  BOUNCY: { type: 'spring', duration: 0.5, bounce: 0.3 },
}

export const EASE_OUT = [0.16, 1, 0.3, 1]

// ─── Shared card visual language ─────────────────────────
export const CARD_STYLE = {
  base: 'rounded-xl bg-white/70 backdrop-blur-md border border-gray-200/60 shadow-sm',
  hover: 'hover:bg-white/90 hover:shadow-lg hover:-translate-y-1',
  transition: 'transition-all duration-250 ease-out',
}

// ─── Virtualization ──────────────────────────────────────────
export const VIRTUALIZE_THRESHOLD = 60

// Render caps for non-virtualized heavy views. Horizontal variants and the
// relationship graph render every item into the DOM/SVG at once, so large
// timelines are capped with a "showing first N" notice instead of janking.
export const HORIZONTAL_RENDER_CAP = 200
export const GRAPH_MAX_PEOPLE = 60

// Browser chrome theme color (<meta name="theme-color">), kept in sync with dark mode
export const THEME_COLOR = { LIGHT: '#f5f5f4', DARK: '#171717' }

/** Sync the browser chrome color with the current theme. */
export function applyThemeColor(darkMode) {
  const meta = document.querySelector('meta[name="theme-color"]')
  if (meta) meta.setAttribute('content', darkMode ? THEME_COLOR.DARK : THEME_COLOR.LIGHT)
}

/**
 * Apply dark mode to the document: toggles the `dark` class and syncs theme-color.
 * With `animate: true`, wraps the switch in the View Transitions API for a single
 * GPU-composited crossfade — far cheaper than transitioning colors on every element.
 * Falls back to an instant switch when unsupported or when the user prefers reduced motion.
 */
export function applyDarkMode(darkMode, { animate = false } = {}) {
  const apply = () => {
    document.documentElement.classList.toggle('dark', darkMode)
    applyThemeColor(darkMode)
  }
  const reduceMotion = window.matchMedia?.('(prefers-reduced-motion: reduce)')?.matches
  if (animate && !reduceMotion && typeof document.startViewTransition === 'function') {
    document.startViewTransition(apply)
  } else {
    apply()
  }
}

export const TAG_OPTIONS = [
  'career',
  'education',
  'travel',
  'family',
  'health',
  'military',
  'relocation',
]

// ─── 16-Color Tag Palette ────────────────────────────────────────
// Each color has: light mode (bg, text, border) + dark sidebar variant + button states
// All light-mode pairs achieve ≥ 5.5:1 WCAG AA contrast ratio.

const TAG_PALETTE = [
  // 1. Sapphire — Career, work, professional
  {
    name: 'sapphire',
    bg: '#DBEAFE',
    text: '#1E3A5F',
    border: '#93C5FD',
    darkBg: 'rgba(59,130,246,0.30)',
    darkText: '#93C5FD',
    darkBorder: 'rgba(96,165,250,0.45)',
    activeBg: '#2563EB',
    activeBorder: '#1D4ED8',
    hoverBg: '#BFDBFE',
  },
  // 2. Violet — Education, learning, academic
  {
    name: 'violet',
    bg: '#EDE9FE',
    text: '#4C1D95',
    border: '#C4B5FD',
    darkBg: 'rgba(139,92,246,0.30)',
    darkText: '#C4B5FD',
    darkBorder: 'rgba(167,139,250,0.45)',
    activeBg: '#7C3AED',
    activeBorder: '#6D28D9',
    hoverBg: '#DDD6FE',
  },
  // 3. Emerald — Travel, outdoors, movement
  {
    name: 'emerald',
    bg: '#D1FAE5',
    text: '#064E3B',
    border: '#6EE7B7',
    darkBg: 'rgba(16,185,129,0.30)',
    darkText: '#6EE7B7',
    darkBorder: 'rgba(52,211,153,0.45)',
    activeBg: '#059669',
    activeBorder: '#047857',
    hoverBg: '#A7F3D0',
  },
  // 4. Rose — Family, relationships, personal
  {
    name: 'rose',
    bg: '#FFE4E6',
    text: '#881337',
    border: '#FDA4AF',
    darkBg: 'rgba(244,63,94,0.30)',
    darkText: '#FDA4AF',
    darkBorder: 'rgba(251,113,133,0.45)',
    activeBg: '#E11D48',
    activeBorder: '#BE123C',
    hoverBg: '#FECDD3',
  },
  // 5. Crimson — Health, medical, critical
  {
    name: 'crimson',
    bg: '#FEE2E2',
    text: '#7F1D1D',
    border: '#FCA5A5',
    darkBg: 'rgba(239,68,68,0.30)',
    darkText: '#FCA5A5',
    darkBorder: 'rgba(248,113,113,0.45)',
    activeBg: '#DC2626',
    activeBorder: '#B91C1C',
    hoverBg: '#FECACA',
  },
  // 6. Graphite — Military, government, formal
  {
    name: 'graphite',
    bg: '#E2E8F0',
    text: '#1E293B',
    border: '#CBD5E1',
    darkBg: 'rgba(100,116,139,0.30)',
    darkText: '#CBD5E1',
    darkBorder: 'rgba(148,163,184,0.45)',
    activeBg: '#475569',
    activeBorder: '#334155',
    hoverBg: '#CBD5E1',
  },
  // 7. Amber — Relocation, housing, life change
  {
    name: 'amber',
    bg: '#FEF3C7',
    text: '#78350F',
    border: '#FCD34D',
    darkBg: 'rgba(245,158,11,0.30)',
    darkText: '#FCD34D',
    darkBorder: 'rgba(251,191,36,0.45)',
    activeBg: '#D97706',
    activeBorder: '#B45309',
    hoverBg: '#FDE68A',
  },
  // 8. Cyan — Water, nature, environment
  {
    name: 'cyan',
    bg: '#CFFAFE',
    text: '#155E75',
    border: '#67E8F9',
    darkBg: 'rgba(6,182,212,0.30)',
    darkText: '#67E8F9',
    darkBorder: 'rgba(34,211,238,0.45)',
    activeBg: '#0891B2',
    activeBorder: '#0E7490',
    hoverBg: '#A5F3FC',
  },
  // 9. Fuchsia — Creative, arts, expression
  {
    name: 'fuchsia',
    bg: '#FAE8FF',
    text: '#701A75',
    border: '#E879F9',
    darkBg: 'rgba(217,70,239,0.30)',
    darkText: '#E879F9',
    darkBorder: 'rgba(232,121,249,0.45)',
    activeBg: '#C026D3',
    activeBorder: '#A21CAF',
    hoverBg: '#F0ABFC',
  },
  // 10. Teal — Science, technology, innovation
  {
    name: 'teal',
    bg: '#CCFBF1',
    text: '#134E4A',
    border: '#5EEAD4',
    darkBg: 'rgba(20,184,166,0.30)',
    darkText: '#5EEAD4',
    darkBorder: 'rgba(45,212,191,0.45)',
    activeBg: '#0D9488',
    activeBorder: '#0F766E',
    hoverBg: '#99F6E4',
  },
  // 11. Orange — Sports, fitness, activity
  {
    name: 'orange',
    bg: '#FFEDD5',
    text: '#7C2D12',
    border: '#FDBA74',
    darkBg: 'rgba(249,115,22,0.30)',
    darkText: '#FDBA74',
    darkBorder: 'rgba(251,146,60,0.45)',
    activeBg: '#EA580C',
    activeBorder: '#C2410C',
    hoverBg: '#FED7AA',
  },
  // 12. Indigo — Spiritual, philosophical, culture
  {
    name: 'indigo',
    bg: '#E0E7FF',
    text: '#312E81',
    border: '#A5B4FC',
    darkBg: 'rgba(99,102,241,0.30)',
    darkText: '#A5B4FC',
    darkBorder: 'rgba(129,140,248,0.45)',
    activeBg: '#4F46E5',
    activeBorder: '#4338CA',
    hoverBg: '#C7D2FE',
  },
  // 13. Lime — Agriculture, food, growth
  {
    name: 'lime',
    bg: '#ECFCCB',
    text: '#365314',
    border: '#BEF264',
    darkBg: 'rgba(132,204,22,0.30)',
    darkText: '#BEF264',
    darkBorder: 'rgba(163,230,53,0.45)',
    activeBg: '#65A30D',
    activeBorder: '#4D7C0F',
    hoverBg: '#D9F99D',
  },
  // 14. Pink — Social, celebration, events
  {
    name: 'pink',
    bg: '#FCE7F3',
    text: '#831843',
    border: '#F9A8D4',
    darkBg: 'rgba(236,72,153,0.30)',
    darkText: '#F9A8D4',
    darkBorder: 'rgba(244,114,182,0.45)',
    activeBg: '#DB2777',
    activeBorder: '#BE185D',
    hoverBg: '#FBCFE8',
  },
  // 15. Sky — Weather, aviation, open spaces
  {
    name: 'sky',
    bg: '#E0F2FE',
    text: '#0C4A6E',
    border: '#7DD3FC',
    darkBg: 'rgba(14,165,233,0.30)',
    darkText: '#7DD3FC',
    darkBorder: 'rgba(56,189,248,0.45)',
    activeBg: '#0284C7',
    activeBorder: '#0369A1',
    hoverBg: '#BAE6FD',
  },
  // 16. Stone — Miscellaneous, general, neutral
  {
    name: 'stone',
    bg: '#F5F5F4',
    text: '#292524',
    border: '#D6D3D1',
    darkBg: 'rgba(120,113,108,0.30)',
    darkText: '#D6D3D1',
    darkBorder: 'rgba(168,162,158,0.45)',
    activeBg: '#57534E',
    activeBorder: '#44403C',
    hoverBg: '#E7E5E4',
  },
]

// Map built-in tags to palette indices (1-indexed in spec, 0-indexed here)
const BUILTIN_TAG_MAP = {
  career: 0, // Sapphire
  education: 1, // Violet
  travel: 2, // Emerald
  family: 3, // Rose
  health: 4, // Crimson
  military: 5, // Graphite
  relocation: 6, // Amber
}

// Custom tags cycle through indices 7–15 (Cyan through Stone)
const CUSTOM_PALETTE_START = 7
const CUSTOM_PALETTE_SIZE = TAG_PALETTE.length - CUSTOM_PALETTE_START

// Registry maps custom tag names to a stable palette index.
// Populated by setCustomTagRegistry() — called from the store on load and every addCustomTag.
let _customTagOrder = []

export function setCustomTagRegistry(orderedTags) {
  _customTagOrder = orderedTags
}

function getCustomTagIndex(tag) {
  const idx = _customTagOrder.indexOf(tag)
  if (idx === -1) return CUSTOM_PALETTE_START + (hashStr(tag) % CUSTOM_PALETTE_SIZE)
  return CUSTOM_PALETTE_START + (idx % CUSTOM_PALETTE_SIZE)
}

function hashStr(s) {
  let h = 0
  for (let i = 0; i < s.length; i++) h = ((h << 5) - h + s.charCodeAt(i)) | 0
  return Math.abs(h)
}

/** Get the full palette entry for any tag (built-in or custom) */
export function getTagPalette(tag) {
  const idx = BUILTIN_TAG_MAP[tag]
  if (idx != null) return TAG_PALETTE[idx]
  return TAG_PALETTE[getCustomTagIndex(tag)]
}

/** Get inline style object for a tag badge (light mode) */
export function getTagStyle(tag) {
  const p = getTagPalette(tag)
  return {
    backgroundColor: p.bg,
    color: p.text,
    borderColor: p.border,
  }
}

/** Get inline style object for a tag badge on dark sidebar */
export function getTagDarkStyle(tag) {
  const p = getTagPalette(tag)
  return {
    backgroundColor: p.darkBg,
    color: p.darkText,
    borderColor: p.darkBorder,
  }
}

/** Get button colors for tag toggle (add/edit modals) — returns inline styles */
export function getTagButtonColor(tag) {
  const p = getTagPalette(tag)
  return {
    active: {
      backgroundColor: p.activeBg,
      color: '#FFFFFF',
      borderColor: p.activeBorder,
    },
    inactive: {
      backgroundColor: p.bg,
      color: p.text,
      borderColor: p.border,
    },
    inactiveHover: {
      backgroundColor: p.hoverBg,
      color: p.text,
      borderColor: p.border,
    },
  }
}

export function generateId() {
  return 'evt_' + crypto.randomUUID().slice(0, 12)
}

// ─── Default color for untagged events ──────────────────────
const DEFAULT_EVENT_COLOR = { dot: '#525252', light: '#F5F5F5', stroke: '#D4D4D4' }

/**
 * Get display colors (dot, light bg, stroke) for an event based on its first tag.
 * Falls back to a default blue if untagged.
 */
export function getEventColor(event) {
  const tag = event.tags?.[0]
  if (!tag) return DEFAULT_EVENT_COLOR
  const p = getTagPalette(tag)
  return { dot: p.activeBg, light: p.bg, stroke: p.border }
}

/**
 * Escape a string for safe HTML embedding.
 * Handles &, <, >, and " characters.
 */
export function escapeHtml(s) {
  return String(s || '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
}

export const SAMPLE_TEXT = `My grandfather, James Mitchell, was born in rural Wisconsin in 1928. He grew up on a small dairy farm during the Great Depression.

In the spring of 1946, he enlisted in the Army and served in occupied Germany until 1948. After returning home, he used the GI Bill to attend the University of Wisconsin, where he studied engineering.

He met my grandmother, Eleanor Price, at a campus dance in October 1950. They married on June 14, 1952, at St. Mary's Church in Madison.

Their first child, my father Robert, was born in March 1954. The family moved to Chicago in 1956 when James took a job at an aerospace company. A second child, my aunt Patricia, was born in 1958.

James worked on early satellite programs throughout the 1960s. Eleanor volunteered at the local school and was active in the neighborhood association.

In the summer of 1972, the family took a cross-country road trip to California. James retired from the company in 1990 after 34 years of service.`
