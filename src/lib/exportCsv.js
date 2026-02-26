export function timelineToCsv(data) {
  const headers = ['date_display', 'start', 'end', 'title', 'description', 'people', 'tags', 'photo_filenames'];
  const rows = data.items.map((item) => [
    item.date.display,
    item.date.start,
    item.date.end,
    item.title,
    item.description,
    item.people.join('|'),
    item.tags.join('|'),
    item.photo_refs.map((p) => p.filename).join('|'),
  ]);

  const esc = (v) => `"${String(v ?? '').replaceAll('"', '""')}"`;
  return [headers, ...rows].map((row) => row.map(esc).join(',')).join('\n');
}
