import { z } from 'zod'
import { isValidISODate } from '@/utils/dateUtils'

// ─── Shared primitives ──────────────────────────────────────

/** ISO date: YYYY, YYYY-MM, or YYYY-MM-DD — validated semantically */
const isoDate = z
  .string()
  .refine(isValidISODate, 'Must be a valid YYYY, YYYY-MM, or YYYY-MM-DD date')

const datePrecision = z.enum(['day', 'month', 'year', 'decade', 'approximate'])

const recurrenceSchema = z.object({
  type: z.enum(['yearly', 'monthly', 'weekly', 'custom']),
  interval: z.number().int().positive().default(1),
  endDate: isoDate.nullable().default(null),
}).nullable().default(null)

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
  location: z.string().nullable().default(null),
  tags: z.array(z.string()).default([]),
  photos: z.array(z.string()).default([]),
  recurrence: recurrenceSchema,
  attachments: z.array(z.object({
    type: z.enum(['link', 'document', 'audio']),
    url: z.string(),
    label: z.string().optional(),
  })).default([]),
})

// ─── Loose schema for external data (AI responses, imports) ─
// Coerces missing/wrong types to safe defaults instead of failing.

export const looseEventSchema = z
  .object({
    id: z.string().optional(),
    title: z.any().optional().transform((v) => (typeof v === 'string' && v.trim() ? v.trim() : null)),
    description: z.any().optional().transform((v) => (typeof v === 'string' ? v : null)),
    dateStart: z.any().optional().transform((v) => (typeof v === 'string' && isValidISODate(v) ? v : null)),
    dateEnd: z.any().optional().transform((v) => (typeof v === 'string' && isValidISODate(v) ? v : null)),
    dateRaw: z.any().optional().transform((v) => (typeof v === 'string' ? v : null)),
    datePrecision: z.any().optional().transform((v) => (datePrecision.safeParse(v).success ? v : 'day')),
    flagged: z.any().optional().transform((v) => Boolean(v)),
    flagReason: z.any().optional().transform((v) => (typeof v === 'string' ? v : null)),
    people: z.any().optional().transform((v) => (Array.isArray(v) ? v.filter((s) => typeof s === 'string') : [])),
    location: z.any().optional().transform((v) => (typeof v === 'string' && v.trim() ? v.trim() : null)),
    tags: z.any().optional().transform((v) => (Array.isArray(v) ? v.filter((s) => typeof s === 'string') : [])),
    photos: z.any().optional().transform((v) => (Array.isArray(v) ? v.filter((s) => typeof s === 'string') : [])),
    recurrence: z.any().optional().transform((v) => {
      if (v && typeof v === 'object' && v.type) {
        const validTypes = ['yearly', 'monthly', 'weekly', 'custom']
        if (!validTypes.includes(v.type)) return null
        return {
          type: v.type,
          interval: typeof v.interval === 'number' && v.interval > 0 ? v.interval : 1,
          endDate: typeof v.endDate === 'string' && isValidISODate(v.endDate) ? v.endDate : null,
        }
      }
      return null
    }),
    attachments: z.any().optional().transform((v) => {
      if (!Array.isArray(v)) return []
      return v.filter((a) => a && typeof a === 'object' && typeof a.url === 'string' && ['link', 'document', 'audio'].includes(a.type))
    }),
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
