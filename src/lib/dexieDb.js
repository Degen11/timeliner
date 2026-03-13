import Dexie from 'dexie'

// Single Dexie database for all app data.
// Version 1: basic key-value stores for state and photos.
// Version 2: no schema change, just bumped to match old photo DB version.
const db = new Dexie('timeliner')

db.version(1).stores({
  // Key-value store for app state (events, timelines, settings)
  state: '',      // outbound primary key (no auto-increment)
  // Key-value store for photos (filename → Blob)
  photos: '',     // outbound primary key
})

export default db
