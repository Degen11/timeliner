import { useState, useRef, useCallback, useEffect, useMemo } from 'react'

/**
 * Shared people autocomplete logic used by AddEventModal and EditEventModal.
 * Manages suggestion list, keyboard navigation, and comma-separated input.
 */
export default function usePeopleAutocomplete(knownPeople) {
  const [suggestions, setSuggestions] = useState([])
  const [activeIndex, setActiveIndex] = useState(-1)
  const inputRef = useRef(null)
  const dismissTimerRef = useRef(null)

  // Pre-compute lowercased people list to avoid redundant .toLowerCase() per keystroke
  const lowerPeople = useMemo(
    () => knownPeople.map((p) => ({ original: p, lower: p.toLowerCase() })),
    [knownPeople]
  )

  // Cleanup dismiss timer on unmount
  useEffect(() => {
    return () => clearTimeout(dismissTimerRef.current)
  }, [])

  const handleChange = useCallback((value, setFormPeople) => {
    setFormPeople(value)
    const parts = value.split(',')
    const current = parts[parts.length - 1].trim().toLowerCase()
    const alreadyAdded = parts.slice(0, -1).map((p) => p.trim().toLowerCase()).filter(Boolean)
    if (current.length > 0) {
      const matches = lowerPeople
        .filter((p) => p.lower.includes(current) && !alreadyAdded.includes(p.lower))
        .map((p) => p.original)
      setSuggestions(matches.slice(0, 5))
    } else {
      setSuggestions([])
    }
    setActiveIndex(-1)
  }, [lowerPeople])

  const accept = useCallback((person, setFormPeople) => {
    setFormPeople((prev) => {
      const parts = prev.split(',')
      parts[parts.length - 1] = ' ' + person
      return parts.join(',') + ', '
    })
    setSuggestions([])
    setActiveIndex(-1)
    inputRef.current?.focus()
  }, [])

  const handleKeyDown = useCallback((e, acceptFn) => {
    if (suggestions.length === 0) return
    if (e.key === 'ArrowDown') {
      e.preventDefault()
      setActiveIndex((i) => Math.min(i + 1, suggestions.length - 1))
    } else if (e.key === 'ArrowUp') {
      e.preventDefault()
      setActiveIndex((i) => Math.max(i - 1, 0))
    } else if ((e.key === 'Enter' || e.key === 'Tab') && activeIndex >= 0) {
      e.preventDefault()
      acceptFn(suggestions[activeIndex])
    }
  }, [suggestions, activeIndex])

  const dismiss = useCallback(() => {
    dismissTimerRef.current = setTimeout(() => setSuggestions([]), 150)
  }, [])

  const reset = useCallback(() => {
    setSuggestions([])
    setActiveIndex(-1)
  }, [])

  return { suggestions, activeIndex, inputRef, handleChange, accept, handleKeyDown, dismiss, reset }
}
