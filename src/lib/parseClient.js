import { timelineDataSchema } from './schema';

export async function parseTimelineFromText({ text, photoFilenames }) {
  const res = await fetch('/api/parse', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ text, photoFilenames }),
  });

  const body = await res.json();
  if (!res.ok) throw new Error(body.error || 'Failed to parse timeline');

  return timelineDataSchema.parse(body);
}
