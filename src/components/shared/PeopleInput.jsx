import { dropdownCls } from '@/utils/ui'

function PeopleInput({
  people,
  value,
  onChange,
  className,
  placeholder = 'Comma-separated names',
}) {
  return (
    <>
      <input
        ref={people.inputRef}
        type="text"
        value={value}
        onChange={(e) => people.handleChange(e.target.value, onChange)}
        onKeyDown={(e) => people.handleKeyDown(e, (p) => people.accept(p, onChange))}
        onBlur={people.dismiss}
        className={className}
        placeholder={placeholder}
        autoComplete="off"
      />
      {people.suggestions.length > 0 && (
        <div className={`${dropdownCls} left-0 right-0 max-h-40 overflow-y-auto app-scroll`}>
          {people.suggestions.map((person, i) => (
            <button
              key={person}
              type="button"
              onMouseDown={(e) => e.preventDefault()}
              onClick={() => people.accept(person, onChange)}
              className={`w-full text-left px-3 py-2 text-sm cursor-pointer transition-colors duration-150 ${
                i === people.activeIndex
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
