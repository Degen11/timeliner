/**
 * Shared UI class helpers for consistent styling across the app.
 */

/**
 * Returns Tailwind classes for a standard form input field.
 * @param {string} [errorField] - field name to check for error styling
 * @param {Object} [errors] - error object keyed by field name
 * @returns {string} Tailwind class string
 */
export function inputCls(errorField, errors) {
  const hasError = errorField && errors && errors[errorField]
  return `w-full rounded-lg border border-gray-200 px-3 py-2 text-sm text-text-default bg-canvas focus:outline-none focus:ring-2 focus:ring-secondary/15 focus:border-secondary transition-colors ${
    hasError ? 'border-error focus:border-error' : ''
  }`
}

/**
 * Standard dropdown container classes.
 */
export const dropdownCls =
  'absolute z-20 mt-1 rounded-xl border border-gray-200 bg-surface shadow-lg py-1.5 animate-[tooltip-in_0.15s_ease-out]'

/**
 * Standard dropdown item classes.
 */
export const dropdownItemCls =
  'w-full text-left px-3 py-2 text-sm text-text-default hover:bg-surface-raised transition-colors duration-150 cursor-pointer'

/**
 * Standard card transition classes.
 * Color changes at 150ms, transform/shadow at 200ms.
 */
export const cardTransition =
  'transition-[color,background-color,border-color,opacity] duration-150 transition-[transform,box-shadow] duration-200'

// Simplified single-property transition shorthand for cards that need hover lift.
// Use this on EventCard and similar interactive cards.
export const cardHoverCls =
  'transition-all duration-200 hover:bg-white/90 hover:shadow-md hover:-translate-y-0.5'
