import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

// Stable device ID so we can scope data without auth
const DEVICE_KEY = 'timeliner_device_id'

export function getDeviceId() {
  let id = localStorage.getItem(DEVICE_KEY)
  if (!id) {
    id = crypto.randomUUID()
    localStorage.setItem(DEVICE_KEY, id)
  }
  return id
}

if (!supabaseUrl || !supabaseAnonKey) {
  console.warn('[Timeliner] Supabase env vars missing — running in local-only mode')
} else {
  console.log('[Timeliner] Supabase client configured for', supabaseUrl)
}

// Pass device_id as a global custom header so RLS policies can enforce
// data isolation at the database level (see supabase-migration.sql).
export const supabase =
  supabaseUrl && supabaseAnonKey
    ? createClient(supabaseUrl, supabaseAnonKey, {
        global: {
          headers: { 'x-device-id': getDeviceId() },
        },
      })
    : null
