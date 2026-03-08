import { supabase, getDeviceId } from './supabase'

// ─── Helpers ──────────────────────────────────────────────

function isOnline() {
  return supabase !== null
}

function mapEventToRow(event, timelineId, index) {
  return {
    id: event.id,
    timeline_id: timelineId,
    title: event.title || 'Untitled',
    description: event.description || null,
    date_start: event.dateStart || null,
    date_end: event.dateEnd || null,
    date_raw: event.dateRaw || null,
    date_precision: event.datePrecision || 'day',
    flagged: event.flagged || false,
    flag_reason: event.flagReason || null,
    people: event.people || [],
    tags: event.tags || [],
    photos: event.photos || [],
    location: event.location || null,
    sort_index: index,
  }
}

function mapRowToEvent(row) {
  return {
    id: row.id,
    title: row.title,
    description: row.description,
    dateStart: row.date_start,
    dateEnd: row.date_end,
    dateRaw: row.date_raw,
    datePrecision: row.date_precision,
    flagged: row.flagged,
    flagReason: row.flag_reason,
    people: row.people || [],
    tags: row.tags || [],
    photos: row.photos || [],
    location: row.location || null,
  }
}

// ─── Timelines ────────────────────────────────────────────

async function fetchTimelines() {
  if (!isOnline()) return null
  const deviceId = getDeviceId()
  const { data, error } = await supabase
    .from('timelines')
    .select('*')
    .eq('device_id', deviceId)
    .order('created_at', { ascending: true })

  if (error) {
    console.error('fetchTimelines error:', error)
    return null
  }
  return data
}

async function fetchTimelineWithEvents(timelineId) {
  if (!isOnline()) return null
  const { data: events, error } = await supabase
    .from('events')
    .select('*')
    .eq('timeline_id', timelineId)
    .order('sort_index', { ascending: true })

  if (error) {
    console.error('fetchTimelineWithEvents error:', error)
    return null
  }
  return events.map(mapRowToEvent)
}

export async function upsertTimeline({ id, name, sortOrder, activeView }) {
  if (!isOnline()) return
  const deviceId = getDeviceId()
  const { error } = await supabase.from('timelines').upsert(
    {
      id,
      device_id: deviceId,
      name: name || 'Untitled',
      sort_order: sortOrder || 'date-asc',
      active_view: activeView || 'vertical',
      updated_at: new Date().toISOString(),
    },
    { onConflict: 'id' }
  )
  if (error) {
    console.error('upsertTimeline error:', error)
    throw new Error(`upsertTimeline: ${error.message}`)
  }
}

export async function deleteTimelineRemote(timelineId) {
  if (!isOnline()) return
  const { error } = await supabase.from('timelines').delete().eq('id', timelineId)
  if (error) {
    console.error('deleteTimeline error:', error)
    throw new Error(`deleteTimeline: ${error.message}`)
  }
}

export async function renameTimelineRemote(timelineId, name) {
  if (!isOnline()) return
  const { error } = await supabase
    .from('timelines')
    .update({ name, updated_at: new Date().toISOString() })
    .eq('id', timelineId)
  if (error) {
    console.error('renameTimeline error:', error)
    throw new Error(`renameTimeline: ${error.message}`)
  }
}

// ─── Events ───────────────────────────────────────────────

export async function syncEvents(timelineId, events) {
  if (!isOnline() || !timelineId) return

  const rows = events.map((e, i) => mapEventToRow(e, timelineId, i))
  const localIds = new Set(events.map((e) => e.id))

  // Upsert current events in batches (safe — no data loss on partial failure)
  const BATCH = 500
  for (let i = 0; i < rows.length; i += BATCH) {
    const batch = rows.slice(i, i + BATCH)
    const { error } = await supabase.from('events').upsert(batch, { onConflict: 'id,timeline_id' })
    if (error) {
      console.error('syncEvents upsert error:', error)
      throw new Error(`syncEvents upsert: ${error.message}`)
    }
  }

  // Remove remote events that no longer exist locally
  const { data: remoteEvents, error: fetchError } = await supabase
    .from('events')
    .select('id')
    .eq('timeline_id', timelineId)

  if (fetchError) {
    console.error('syncEvents fetch-for-delete error:', fetchError)
    throw new Error(`syncEvents fetch-for-delete: ${fetchError.message}`)
  }

  const toDelete = (remoteEvents || []).map((r) => r.id).filter((id) => !localIds.has(id))

  if (toDelete.length > 0) {
    const { error: deleteError } = await supabase
      .from('events')
      .delete()
      .eq('timeline_id', timelineId)
      .in('id', toDelete)
    if (deleteError) {
      console.error('syncEvents cleanup error:', deleteError)
      throw new Error(`syncEvents cleanup: ${deleteError.message}`)
    }
  }
}

export async function deleteEventRemote(timelineId, eventId) {
  if (!isOnline() || !timelineId) return
  const { error } = await supabase
    .from('events')
    .delete()
    .eq('id', eventId)
    .eq('timeline_id', timelineId)
  if (error) {
    console.error('deleteEvent error:', error)
    throw new Error(`deleteEvent: ${error.message}`)
  }
}

// ─── Connection test ──────────────────────────────────────

export async function testConnection() {
  if (!isOnline()) {
    console.warn('[Timeliner] Supabase offline — no client configured')
    return false
  }
  try {
    const { error } = await supabase.from('timelines').select('id').limit(1)
    if (error) {
      console.error('[Timeliner] Supabase connection FAILED:', error.message)
      return false
    }
    if (import.meta.env.DEV) console.log('[Timeliner] Supabase connection OK')
    return true
  } catch (err) {
    console.error('[Timeliner] Supabase connection FAILED:', err.message)
    return false
  }
}

// ─── Initial load ─────────────────────────────────────────

export async function loadInitialData() {
  if (!isOnline()) return null

  const timelines = await fetchTimelines()
  if (!timelines || timelines.length === 0) return null

  // Single query for all events across all timelines (replaces N+1 loop)
  const timelineIds = timelines.map((tl) => tl.id)
  const { data: allEvents, error } = await supabase
    .from('events')
    .select('*')
    .in('timeline_id', timelineIds)
    .order('sort_index', { ascending: true })

  if (error) {
    console.error('loadInitialData events error:', error)
  }

  // Group events by timeline_id
  const eventsByTimeline = new Map()
  for (const row of allEvents || []) {
    const list = eventsByTimeline.get(row.timeline_id) || []
    list.push(mapRowToEvent(row))
    eventsByTimeline.set(row.timeline_id, list)
  }

  return timelines.map((tl) => ({
    id: tl.id,
    name: tl.name,
    sortOrder: tl.sort_order,
    activeView: tl.active_view,
    events: eventsByTimeline.get(tl.id) || [],
    photoMap: {},
    createdAt: tl.created_at,
    updatedAt: tl.updated_at,
  }))
}
