import Anthropic from '@anthropic-ai/sdk';
import { z } from 'zod';

const timelineDateSchema = z.object({
  start: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  end: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  display: z.string(),
  granularity: z.enum(['day', 'month', 'year', 'approx']),
  confidence: z.number().min(0).max(1),
});

const timelineItemSchema = z.object({
  id: z.string(),
  title: z.string(),
  description: z.string(),
  date: timelineDateSchema,
  people: z.array(z.string()),
  tags: z.array(z.string()),
  photo_refs: z.array(z.object({ filename: z.string(), dataURL: z.string().optional() })),
  source_text: z.string(),
  needs_review: z.boolean(),
  review_reason: z.string(),
});

const timelineDataSchema = z.object({
  items: z.array(timelineItemSchema),
  detected_people: z.array(z.string()),
  version: z.string(),
});

const RULES = `Rules:
1. EVERY date must be converted to start/end/display/granularity format
2. For partial dates:
   - "Aug 1965" → start=1965-08-01, end=1965-08-31, display="Aug 1965", granularity=month
   - "1965" → start=1965-01-01, end=1965-12-31, display="1965", granularity=year
   - "around 1965" → same ranges + granularity=approx
   - "1965-1968" → start=1965-01-01, end=1968-12-31, display="1965-1968", granularity=year
3. If date is ambiguous, set needs_review: true and explain in review_reason
4. Preserve original text in source_text
5. Link photos by filename when text mentions them or date matches
6. Extract people names (family members, historical figures)
7. Extract category tags (birth, marriage, career, move, death, etc.)`;

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const key = process.env.ANTHROPIC_API_KEY || process.env.VITE_ANTHROPIC_API_KEY;
  if (!key) return res.status(500).json({ error: 'Missing ANTHROPIC_API_KEY environment variable' });

  try {
    const { text, photoFilenames = [] } = req.body || {};
    if (!text || typeof text !== 'string') return res.status(400).json({ error: 'text is required' });

    const client = new Anthropic({ apiKey: key });
    const prompt = `${RULES}\n\nOutput ONLY valid JSON matching this shape:\n{\"items\":[...],\"detected_people\":[...],\"version\":\"1.0.0\"}\n\nInput text:\n${text}\n\nPhoto filenames:\n${photoFilenames.join(', ')}`;

    const msg = await client.messages.create({
      model: 'claude-3-haiku-20240307',
      max_tokens: 4000,
      temperature: 0,
      messages: [{ role: 'user', content: prompt }],
    });

    const output = msg.content.find((part) => part.type === 'text')?.text;
    if (!output) return res.status(502).json({ error: 'No model output returned' });

    const firstBrace = output.indexOf('{');
    const lastBrace = output.lastIndexOf('}');
    const jsonText = output.slice(firstBrace, lastBrace + 1);
    const parsed = JSON.parse(jsonText);
    const validated = timelineDataSchema.parse(parsed);
    return res.status(200).json(validated);
  } catch (error) {
    return res.status(500).json({ error: error?.message || 'Unexpected server error while parsing timeline' });
  }
}
