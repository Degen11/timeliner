import { useMemo, useState } from 'react';
import { stableSortTimeline } from '../lib/dateParse';

export function useTimelineData(initialData) {
  const [data, setData] = useState(initialData);
  const [filters, setFilters] = useState({ search: '', people: [], tag: '', density: 'expanded' });

  const filteredItems = useMemo(() => {
    const q = filters.search.toLowerCase();
    return stableSortTimeline(data.items).filter((item) => {
      const matchesSearch =
        !q ||
        item.title.toLowerCase().includes(q) ||
        item.description.toLowerCase().includes(q) ||
        item.source_text.toLowerCase().includes(q);
      const matchesPeople = filters.people.length === 0 || filters.people.every((p) => item.people.includes(p));
      const matchesTag = !filters.tag || item.tags.includes(filters.tag);
      return matchesSearch && matchesPeople && matchesTag;
    });
  }, [data.items, filters]);

  return { data, setData, filters, setFilters, filteredItems };
}
