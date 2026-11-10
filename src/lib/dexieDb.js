import Dexie from 'dexie'

// Single Dexie database for all app data.
// Version 1: basic key-value stores for state and photos. Dexie multiplies
// declared versions by 10, so the on-disk IndexedDB version is 10, which is
// above the raw-IndexedDB versions the pre-Dexie code used.
const db = new Dexie('timeliner')

db.version(1).stores({
  // Key-value store for app state (events, timelines, settings)
  state: '',      // outbound primary key (no auto-increment)
  // Key-value store for photos (filename → Blob)
  photos: '',     // outbound primary key
})

export default db
