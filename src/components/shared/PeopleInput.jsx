import { dropdownCls } from '@/utils/ui'

function PeopleInput({
  people,
  value,
  onChange,
  className,
  placeholder = 'Comma-separated names',
}) {
  // Destructure the autocomplete bag so the input ref stays separate from the
  // render-time values — passing `people.inputRef` straight to `ref=` would
  // otherwise taint the whole `people` object as ref-like to the compiler.
  const { inputRef, suggestions, activeIndex, handleChange, handleKeyDown, accept, dismiss } =
    people
  return (
    <>
      <input
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
