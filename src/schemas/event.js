import { z } from 'zod'

// ─── Shared primitives ──────────────────────────────────────

/** ISO date: YYYY, YYYY-MM, or YYYY-MM-DD */
const isoDate = z
  .string()
  .regex(/^\d{4}(-\d{2}(-\d{2})?)?$/, 'Must be YYYY, YYYY-MM, or YYYY-MM-DD')

const datePrecision = z.enum(['day', 'month', 'year', 'decade', 'approximate'])

// ─── Event schema ───────────────────────────────────────────

export const eventSchema = z.object({
  id: z.string().min(1),
  title: z.string().min(1, 'Title is required'),
  description: z.string().nullable().default(null),
  dateStart: isoDate.nullable().default(null),
  dateEnd: isoDate.nullable().default(null),
  dateRaw: z.string().nullable().default(null),
  datePrecision: datePrecision.default('day'),
  flagged: z.boolean().default(false),
  flagReason: z.string().nullable().default(null),
  people: z.array(z.string()).default([]),
  tags: z.array(z.string()).default([]),
  photos: z.array(z.string()).default([]),
})

// ─── Loose schema for external data (AI responses, imports) ─
// Coerces missing/wrong types to safe defaults instead of failing.

export const looseEventSchema = z
  .object({
    id: z.string().optional(),
    title: z.any().transform((v) => (typeof v === 'string' && v.trim() ? v.trim() : null)),
    description: z.any().transform((v) => (typeof v === 'string' ? v : null)),
    dateStart: z.any().transform((v) => (typeof v === 'string' && isoDate.safeParse(v).success ? v : null)),
    dateEnd: z.any().transform((v) => (typeof v === 'string' && isoDate.safeParse(v).success ? v : null)),
    dateRaw: z.any().transform((v) => (typeof v === 'string' ? v : null)),
    datePrecision: z.any().transform((v) => (datePrecision.safeParse(v).success ? v : 'day')),
    flagged: z.any().transform((v) => Boolean(v)),
    flagReason: z.any().transform((v) => (typeof v === 'string' ? v : null)),
    people: z.any().transform((v) => (Array.isArray(v) ? v.filter((s) => typeof s === 'string') : [])),
    tags: z.any().transform((v) => (Array.isArray(v) ? v.filter((s) => typeof s === 'string') : [])),
    photos: z.any().transform((v) => (Array.isArray(v) ? v.filter((s) => typeof s === 'string') : [])),
  })
  .transform((e) => (e.title ? e : null))

/** Validate an array of loosely-typed events (e.g. from AI or JSON import). */
export function parseLooseEvents(data) {
  const arr = Array.isArray(data) ? data : data?.events
  if (!Array.isArray(arr)) return []
  return arr
    .map((item) => looseEventSchema.safeParse(item))
    .filter((r) => r.success && r.data !== null)
    .map((r) => r.data)
}
