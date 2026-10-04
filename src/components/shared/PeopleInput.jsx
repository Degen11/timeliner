import { X } from 'lucide-react'
import { dropdownCls, parsePeopleString } from '@/utils/ui'

// Split the comma string into committed names and the in-progress last segment
function splitPeople(value) {
  const parts = value.split(',')
  return { committed: parsePeopleString(parts.slice(0, -1).join(',')), draft: parts[parts.length - 1].trimStart() }
}

const joinPeople = (names, draft = '') => (names.length ? `${names.join(', ')}, ${draft}` : draft)

/**
 * Chip variant: committed names render as removable chips and the input edits
 * only the next name. The form value stays a comma-separated string, so the
 * shared autocomplete hook works unchanged.
 */
function PeopleChips({ people, value, onChange, placeholder, id }) {
  const { inputRef, suggestions, activeIndex, handleChange, handleKeyDown, accept, dismiss } = people
  const { committed, draft } = splitPeople(value)

  const commitDraft = () => {
    if (!draft.trim()) return
    onChange(`${joinPeople(committed, draft.trim())}, `)
  }

  const removeAt = (index) => {
    onChange(joinPeople(committed.filter((_, i) => i !== index), draft))
    inputRef.current?.focus()
  }

  const onKeyDown = (e) => {
    handleKeyDown(e, (p) => accept(p, onChange))
    if (e.defaultPrevented) return
    if (e.key === 'Enter') {
      // Enter adds the typed name rather than submitting the form
      e.preventDefault()
      commitDraft()
    } else if (e.key === 'Backspace' && !draft && committed.length > 0) {
      e.preventDefault()
      onChange(joinPeople(committed.slice(0, -1)))
    }
  }

  return (
    <>
      <div
        className="flex min-h-11 sm:min-h-10 w-full flex-wrap items-center gap-1 rounded-[10px] border border-gray-200 bg-surface p-1 transition-colors focus-within:border-secondary focus-within:ring-2 focus-within:ring-secondary/15 cursor-text"
        onClick={(e) => { if (e.target === e.currentTarget) inputRef.current?.focus() }}
      >
        {committed.map((name, i) => (
          <span
            key={`${name}-${i}`}
            className="inline-flex h-8 sm:h-7 max-w-full items-center gap-1 rounded-[7px] bg-soft-accent dark:bg-surface-raised pl-2.5 pr-1 text-[13px] text-text-strong"
          >
            <span className="truncate">{name}</span>
            <button
              type="button"
              onClick={() => removeAt(i)}
              aria-label={`Remove ${name}`}
              className="flex h-6 w-6 sm:h-5 sm:w-5 items-center justify-center rounded text-text-muted hover:bg-gray-200 hover:text-text-strong cursor-pointer"
            >
              <X size={12} strokeWidth={2.5} />
            </button>
          </span>
        ))}
        <input
          id={id}
          ref={inputRef}
          type="text"
          value={draft}
          onChange={(e) => handleChange(joinPeople(committed, e.target.value), onChange)}
          onKeyDown={onKeyDown}
          onBlur={() => {
            dismiss()
            commitDraft()
          }}
          className="h-8 sm:h-7 min-w-[6rem] flex-1 bg-transparent px-1.5 text-base sm:text-sm text-text-strong placeholder:text-text-muted outline-none"
          placeholder={committed.length ? 'Add…' : placeholder}
          autoComplete="off"
        />
      </div>
      {suggestions.length > 0 && (
        <div className={`${dropdownCls} left-0 right-0 max-h-40 overflow-y-auto app-scroll`}>
          {suggestions.map((person, i) => (
            <button
              key={person}
              type="button"
              onMouseDown={(e) => e.preventDefault()}
              onClick={() => accept(person, onChange)}
              className={`w-full text-left px-3 py-2 text-sm cursor-pointer transition-colors duration-150 ${
                i === activeIndex
                  ? 'bg-secondary/10 text-secondary'
                  : 'text-text-default hover:bg-surface-raised'
              }`}
            >
              {person}
            </button>
          ))}
        </div>
      )}
    </>
  )
}

function PeopleInput({
  people,
  value,
  onChange,
  className,
  placeholder = 'Comma-separated names',
  variant = 'text',
  id,
}) {
  if (variant === 'chips') {
    return <PeopleChips people={people} value={value} onChange={onChange} placeholder={placeholder} id={id} />
  }
  // Destructure the autocomplete bag so the input ref stays separate from the
  // render-time values — passing `people.inputRef` straight to `ref=` would
  // otherwise taint the whole `people` object as ref-like to the compiler.
  const { inputRef, suggestions, activeIndex, handleChange, handleKeyDown, accept, dismiss } =
    people
  return (
    <>
      <input
        id={id}
        ref={inputRef}
        type="text"
        value={value}
        onChange={(e) => handleChange(e.target.value, onChange)}
        onKeyDown={(e) => handleKeyDown(e, (p) => accept(p, onChange))}
        onBlur={dismiss}
        className={className}
        placeholder={placeholder}
        autoComplete="off"
      />
      {suggestions.length > 0 && (
        <div className={`${dropdownCls} left-0 right-0 max-h-40 overflow-y-auto app-scroll`}>
          {suggestions.map((person, i) => (
            <button
              key={person}
              type="button"
              onMouseDown={(e) => e.preventDefault()}
              onClick={() => accept(person, onChange)}
              className={`w-full text-left px-3 py-2 text-sm cursor-pointer transition-colors duration-150 ${
                i === activeIndex
                  ? 'bg-secondary/10 text-secondary'
                  : 'text-text-default hover:bg-surface-raised'
              }`}
            >
              {person}
            </button>
          ))}
        </div>
      )}
    </>
  )
}

export default PeopleInput
