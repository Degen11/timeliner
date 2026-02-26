import { z } from 'zod';

export const timelineDateSchema = z.object({
  start: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  end: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  display: z.string().min(1),
  granularity: z.enum(['day', 'month', 'year', 'approx']),
  confidence: z.number().min(0).max(1),
});

export const photoRefSchema = z.object({
  filename: z.string().min(1),
  dataURL: z.string().optional(),
});

export const timelineItemSchema = z.object({
  id: z.string().min(1),
  title: z.string().min(1),
  description: z.string().default(''),
  date: timelineDateSchema,
  people: z.array(z.string()).default([]),
  tags: z.array(z.string()).default([]),
  photo_refs: z.array(photoRefSchema).default([]),
  source_text: z.string().default(''),
  needs_review: z.boolean().default(false),
  review_reason: z.string().default(''),
});

export const timelineDataSchema = z.object({
  items: z.array(timelineItemSchema),
  detected_people: z.array(z.string()).default([]),
  version: z.string().default('1.0.0'),
});

export const shareStateSchema = z.object({
  timeline: timelineDataSchema,
  view: z.enum(['vertical', 'horizontal', 'grid']),
  filters: z.object({
    search: z.string().default(''),
    people: z.array(z.string()).default([]),
    tag: z.string().default(''),
    density: z.enum(['compact', 'expanded']).default('expanded'),
  }),
});
