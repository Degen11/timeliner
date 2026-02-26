const patterns = [
  /(\d{4})[-_.](\d{2})[-_.](\d{2})/,
  /(\d{4})(\d{2})(\d{2})/,
  /IMG_(\d{4})(\d{2})(\d{2})_/i,
];

export function parseDateFromFilename(filename) {
  for (const pattern of patterns) {
    const match = filename.match(pattern);
    if (!match) continue;
    const [, y, m, d] = match;
    const iso = `${y}-${m}-${d}`;
    if (!Number.isNaN(new Date(iso).valueOf())) return iso;
  }
  return null;
}

export function addDateHintsToPhotos(files) {
  return files.map((file) => ({ filename: file.name, parsedDate: parseDateFromFilename(file.name) }));
}

export function stableSortTimeline(items) {
  return [...items].sort((a, b) => {
    const dateDiff = a.date.start.localeCompare(b.date.start);
    if (dateDiff !== 0) return dateDiff;
    return a.title.localeCompare(b.title);
  });
}

export function decadeLabel(start) {
  return `${Math.floor(Number(start.slice(0, 4)) / 10) * 10}s`;
}
