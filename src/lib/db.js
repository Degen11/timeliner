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
  }
}

// ─── Timelines ────────────────────────────────────────────

export async function fetchTimelines() {
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

export async function fetchTimelineWithEvents(timelineId) {
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
  const { error } = await supabase
    .from('timelines')
    .upsert(
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
  if (error) console.error('upsertTimeline error:', error)
}

export async function deleteTimelineRemote(timelineId) {
  if (!isOnline()) return
  const { error } = await supabase
    .from('timelines')
    .delete()
    .eq('id', timelineId)
  if (error) console.error('deleteTimeline error:', error)
}

export async function renameTimelineRemote(timelineId, name) {
  if (!isOnline()) return
  const { error } = await supabase
    .from('timelines')
    .update({ name, updated_at: new Date().toISOString() })
    .eq('id', timelineId)
  if (error) console.error('renameTimeline error:', error)
}

// ─── Events ───────────────────────────────────────────────

export async function syncEvents(timelineId, events) {
  if (!isOnline() || !timelineId) return

  // Delete all existing events for this timeline and replace
  const { error: deleteError } = await supabase
    .from('events')
    .delete()
    .eq('timeline_id', timelineId)

  if (deleteError) {
    console.error('syncEvents delete error:', deleteError)
    return
  }

  if (events.length === 0) return

  const rows = events.map((e, i) => mapEventToRow(e, timelineId, i))

  // Supabase has a max of ~1000 rows per insert, batch if needed
  const BATCH = 500
  for (let i = 0; i < rows.length; i += BATCH) {
    const batch = rows.slice(i, i + BATCH)
    const { error } = await supabase.from('events').insert(batch)
    if (error) {
      console.error('syncEvents insert error:', error)
      return
    }
  }
}

export async function upsertEvent(timelineId, event, sortIndex = 0) {
  if (!isOnline() || !timelineId) return
  const row = mapEventToRow(event, timelineId, sortIndex)
  const { error } = await supabase
    .from('events')
    .upsert(row, { onConflict: 'id,timeline_id' })
  if (error) console.error('upsertEvent error:', error)
}

export async function deleteEventRemote(timelineId, eventId) {
  if (!isOnline() || !timelineId) return
  const { error } = await supabase
    .from('events')
    .delete()
    .eq('id', eventId)
    .eq('timeline_id', timelineId)
  if (error) console.error('deleteEvent error:', error)
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
    console.log('[Timeliner] Supabase connection OK')
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

  // Load events for each timeline
  const result = []
  for (const tl of timelines) {
    const events = await fetchTimelineWithEvents(tl.id)
    result.push({
      id: tl.id,
      name: tl.name,
      sortOrder: tl.sort_order,
      activeView: tl.active_view,
      events: events || [],
      photoMap: {},
      createdAt: tl.created_at,
      updatedAt: tl.updated_at,
    })
  }

  return result
}
