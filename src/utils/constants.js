export const VIEWS = {
  VERTICAL: 'vertical',
  HORIZONTAL: 'horizontal',
  GRID: 'grid',
}

export const DATE_PRECISION = {
  DAY: 'day',
  MONTH: 'month',
  YEAR: 'year',
  DECADE: 'decade',
  APPROXIMATE: 'approximate',
}

export const STORAGE_KEY = 'timeliner_data'

export const MAX_TEXT_LENGTH = 50_000

export const SORT_OPTIONS = {
  DATE_ASC: 'date-asc',
  DATE_DESC: 'date-desc',
  TITLE_ASC: 'title-asc',
  TITLE_DESC: 'title-desc',
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

// Badge display colors per tag
export const TAG_COLORS = {
  career:     'bg-blue-100 text-blue-700',
  education:  'bg-violet-100 text-violet-700',
  travel:     'bg-emerald-100 text-emerald-700',
  family:     'bg-rose-100 text-rose-700',
  health:     'bg-red-100 text-red-700',
  military:   'bg-slate-200 text-slate-700',
  relocation: 'bg-amber-100 text-amber-700',
}

// Toggle button colors for tag selection (add/edit modals)
export const TAG_BUTTON_COLORS = {
  career:     { active: 'bg-blue-600 text-white', inactive: 'bg-blue-100 text-blue-700 hover:bg-blue-200' },
  education:  { active: 'bg-violet-600 text-white', inactive: 'bg-violet-100 text-violet-700 hover:bg-violet-200' },
  travel:     { active: 'bg-emerald-600 text-white', inactive: 'bg-emerald-100 text-emerald-700 hover:bg-emerald-200' },
  family:     { active: 'bg-rose-600 text-white', inactive: 'bg-rose-100 text-rose-700 hover:bg-rose-200' },
  health:     { active: 'bg-red-600 text-white', inactive: 'bg-red-100 text-red-700 hover:bg-red-200' },
  military:   { active: 'bg-slate-600 text-white', inactive: 'bg-slate-200 text-slate-700 hover:bg-slate-300' },
  relocation: { active: 'bg-amber-600 text-white', inactive: 'bg-amber-100 text-amber-700 hover:bg-amber-200' },
}

// Color palette for user-created custom tags (cycles via hash)
const CUSTOM_TAG_PALETTE = [
  { badge: 'bg-cyan-100 text-cyan-700', button: { active: 'bg-cyan-600 text-white', inactive: 'bg-cyan-100 text-cyan-700 hover:bg-cyan-200' } },
  { badge: 'bg-pink-100 text-pink-700', button: { active: 'bg-pink-600 text-white', inactive: 'bg-pink-100 text-pink-700 hover:bg-pink-200' } },
  { badge: 'bg-lime-100 text-lime-700', button: { active: 'bg-lime-600 text-white', inactive: 'bg-lime-100 text-lime-700 hover:bg-lime-200' } },
  { badge: 'bg-indigo-100 text-indigo-700', button: { active: 'bg-indigo-600 text-white', inactive: 'bg-indigo-100 text-indigo-700 hover:bg-indigo-200' } },
  { badge: 'bg-orange-100 text-orange-700', button: { active: 'bg-orange-600 text-white', inactive: 'bg-orange-100 text-orange-700 hover:bg-orange-200' } },
  { badge: 'bg-teal-100 text-teal-700', button: { active: 'bg-teal-600 text-white', inactive: 'bg-teal-100 text-teal-700 hover:bg-teal-200' } },
  { badge: 'bg-fuchsia-100 text-fuchsia-700', button: { active: 'bg-fuchsia-600 text-white', inactive: 'bg-fuchsia-100 text-fuchsia-700 hover:bg-fuchsia-200' } },
  { badge: 'bg-yellow-100 text-yellow-700', button: { active: 'bg-yellow-600 text-white', inactive: 'bg-yellow-100 text-yellow-700 hover:bg-yellow-200' } },
]

function hashStr(s) {
  let h = 0
  for (let i = 0; i < s.length; i++) h = ((h << 5) - h) + s.charCodeAt(i) | 0
  return Math.abs(h)
}

/** Get badge color class for any tag (built-in or custom) */
export function getTagColor(tag) {
  if (TAG_COLORS[tag]) return TAG_COLORS[tag]
  return CUSTOM_TAG_PALETTE[hashStr(tag) % CUSTOM_TAG_PALETTE.length].badge
}

/** Get button colors for any tag (built-in or custom) */
export function getTagButtonColor(tag) {
  if (TAG_BUTTON_COLORS[tag]) return TAG_BUTTON_COLORS[tag]
  return CUSTOM_TAG_PALETTE[hashStr(tag) % CUSTOM_TAG_PALETTE.length].button
}

export function generateId() {
  return 'evt_' + Math.random().toString(36).slice(2, 9)
}

export const SAMPLE_TEXT = `My grandfather, James Mitchell, was born in rural Wisconsin in 1928. He grew up on a small dairy farm during the Great Depression.

In the spring of 1946, he enlisted in the Army and served in occupied Germany until 1948. After returning home, he used the GI Bill to attend the University of Wisconsin, where he studied engineering.

He met my grandmother, Eleanor Price, at a campus dance in October 1950. They married on June 14, 1952, at St. Mary's Church in Madison.

Their first child, my father Robert, was born in March 1954. The family moved to Chicago in 1956 when James took a job at an aerospace company. A second child, my aunt Patricia, was born in 1958.

James worked on early satellite programs throughout the 1960s. Eleanor volunteered at the local school and was active in the neighborhood association.

In the summer of 1972, the family took a cross-country road trip to California. James retired from the company in 1990 after 34 years of service.`
