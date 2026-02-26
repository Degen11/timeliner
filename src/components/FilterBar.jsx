import { Search, X } from 'lucide-react';

export default function FilterBar({ filters, setFilters, peopleOptions, tagOptions }) {
  return (
    <div className="filter-bar">
      <label>
        <Search size={14} />
        <input
          placeholder="Search"
          value={filters.search}
          onChange={(e) => setFilters((f) => ({ ...f, search: e.target.value }))}
        />
      </label>
      <div className="chips">
        {peopleOptions.map((person) => (
          <button
            key={person}
            className={filters.people.includes(person) ? 'chip active' : 'chip'}
            onClick={() =>
              setFilters((f) => ({
                ...f,
                people: f.people.includes(person) ? f.people.filter((p) => p !== person) : [...f.people, person],
              }))
            }
          >
            {person}
          </button>
        ))}
      </div>
      <select value={filters.tag} onChange={(e) => setFilters((f) => ({ ...f, tag: e.target.value }))}>
        <option value="">All tags</option>
        {tagOptions.map((tag) => (
          <option key={tag} value={tag}>
            {tag}
          </option>
        ))}
      </select>
      <button onClick={() => setFilters({ search: '', people: [], tag: '', density: 'expanded' })}>
        <X size={14} /> Clear
      </button>
    </div>
  );
}
