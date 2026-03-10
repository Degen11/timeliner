# Timeliner Codebase Audit Report

**Date:** 2026-03-10
**Scope:** Full codebase audit — bugs, broken behavior, dead code, UX issues

---

## CRITICAL Priority

### 1. SharedViewPage "Copy to my timelines" creates empty timeline then appends

- **Files:** `src/components/shared/SharedViewPage.jsx:80-88`
- **Issue:** `handleCopyToTimelines` calls `saveCurrentAsTimeline(name)` which snapshots the *current* store events (which are empty for a visitor), then calls `appendEvents(events)`. The result is a new timeline is created with 0 events, and the shared events get appended to the *working set* but are never actually saved into the timeline's snapshot. On next timeline switch, the events are lost.
- **Why it matters:** Users who click "Copy to my timelines" on a shared link will lose those events on their next session or timeline switch.
- **Fix:** Either call `appendEvents` first then `saveCurrentAsTimeline`, or use a dedicated `createTimelineFromEvents(name, events)` method that atomically creates a timeline with the given events.

### 2. `createNewTimeline` → `handleParse(false)` race condition

- **Files:** `src/components/timeline/InlineImportPanel.jsx:252-255`
- **Issue:** `handleCreateNew` calls `createNewTimeline` then immediately `handleParse(false)`. `createNewTimeline` calls `persistActiveTimeline(get, set)` which triggers async remote sync, and `handleParse(false)` immediately starts a fetch. If the parse completes very fast, the `syncEventsRemote` from `persistActiveTimeline` could overwrite the new events with old events.
- **Why it matters:** Users creating a "New Timeline" from existing could lose the newly parsed events in a race condition with sync.
- **Fix:** Await or gate the sync before parsing, or ensure `handleParse` uses the new timeline ID.

### 3. Undo/Redo stacks are module-level singletons shared across all timelines

- **Files:** `src/store/slices/eventsSlice.js:11-13`, `src/store/slices/timelinesSlice.js:225`
- **Issue:** The `undoStack` and `redoStack` are module-level variables. When switching timelines, `resetHistory()` is called, which correctly clears them. But if two concurrent `commitEvents` calls happen (e.g., from `attachPhotoToEvent` + `updateEvent`), both push to the same shared stack, creating corrupted undo states.
- **Why it matters:** Undo could restore events from a corrupted mixed state if mutations overlap.
- **Fix:** Add a lock/queue mechanism to prevent concurrent commits, or scope stacks per timeline ID.

### 4. Delete + Undo race condition with remote sync

- **Files:** `src/store/slices/eventsSlice.js:78-93`
- **Issue:** `deleteEvent` fires `removeEventRemote()` immediately, then shows an "Undo" toast. If the user clicks Undo, events are restored locally, but the remote delete may have already completed. The next `debouncedSync` will re-upsert, but there's a window where the event is gone remotely.
- **Why it matters:** On slow networks, undo after delete may fail to restore the event remotely, causing data loss on next sync.
- **Fix:** Delay the remote delete until after the undo window expires, or queue it for the next sync cycle.

---

## HIGH Priority

### 5. Weak event ID generation uses `Math.random()` — collision risk

- **Files:** `src/utils/constants.js:352-354`
- **Issue:** Event IDs are generated with `'evt_' + Math.random().toString(36).slice(2, 9)` which is cryptographically weak and produces only ~7 chars of entropy (~36 bits). With many events, collisions become increasingly likely. Timeline IDs and device IDs correctly use `crypto.randomUUID()`.
- **Why it matters:** ID collisions could silently overwrite events; predictable IDs in a multi-device sync scenario could cause data corruption.
- **Fix:** Replace with `'evt_' + crypto.randomUUID().slice(0, 12)` to match the pattern used for timeline IDs.

### 6. Missing security headers: HSTS and CSP

- **Files:** `api/rateLimit.js:90-94`
- **Issue:** Security headers include `X-Content-Type-Options`, `X-Frame-Options`, and `Referrer-Policy` but are missing `Strict-Transport-Security` (HSTS) and `Content-Security-Policy` (CSP).
- **Why it matters:** Without HSTS, users can be downgraded to HTTP. Without CSP, the app is more vulnerable to XSS attacks.
- **Fix:** Add `Strict-Transport-Security: max-age=31536000; includeSubDomains` and a basic CSP header.

### 7. `localStorage` is read synchronously on module load — blocks page render

- **Files:** `src/store/useTimelineStore.js:16` → `src/lib/dataService.js:19-27`
- **Issue:** `loadLocal()` is called at module import time and calls `JSON.parse(localStorage.getItem(...))`. For users with large settings objects, this blocks the main thread during initial JS evaluation.
- **Why it matters:** Users with large persisted state experience a slower time-to-interactive.
- **Fix:** Profile impact; consider lazy init if parsed data exceeds a size threshold.

### 8. Full state written to IndexedDB on every debounced mutation

- **Files:** `src/store/useTimelineStore.js:26-29`, `src/lib/dataService.js:56-86`
- **Issue:** Every `persist()` call writes the *entire* state (events + timelines) to IndexedDB. With 500+ events and multiple timelines, this `structuredClone` + IDB write on every mutation can cause jank.
- **Why it matters:** Performance degrades with timeline size.
- **Fix:** Implement incremental/dirty-field persistence.

### 9. `photos: []` legacy field is still read/written but never used

- **Files:** `src/store/slices/photosSlice.js:11`, `src/store/slices/timelinesSlice.js:177,248,298`
- **Issue:** The `photos` array field is set to `[]` in multiple places but is never read by the UI. The actual photo system uses `photoMap` and `photoOrder`.
- **Why it matters:** Dead state; confusing for developers; adds unnecessary data to persistence.
- **Fix:** Remove all references to `photos: []`.

### 10. `InlineImportPanel` calls `storePhotos(photos)` — writes to dead state

- **Files:** `src/components/timeline/InlineImportPanel.jsx:138,184,225`
- **Issue:** `storePhotos` is `setPhotos` which writes File objects to the dead `photos: []` state. Actual photo storage is handled by `addToPhotoMap`.
- **Why it matters:** Misleading code; wasted memory storing unreferenced File objects.
- **Fix:** Remove the `storePhotos(photos)` calls and the `setPhotos` state entirely.

### 11. No IndexedDB fallback if browser clears storage

- **Files:** `src/lib/dataService.js:7-12,33-49`
- **Issue:** `SETTINGS_FIELDS` (written to localStorage) does not include `events` or `timelines`. If IndexedDB is cleared by the browser under storage pressure, events are permanently lost.
- **Why it matters:** Data loss without user action.
- **Fix:** Add a "last synced" timestamp to localStorage as a staleness check, or periodically snapshot events.

### 12. Rate limiter `remaining` header is off-by-one

- **Files:** `api/rateLimit.js:50-53,78-84`
- **Issue:** The `remaining` calculation returns inaccurate values relative to the actual enforcement.
- **Why it matters:** Rate limit headers may confuse API consumers.
- **Fix:** Return `remaining: Math.max(0, maxRequests - entry.count)` consistently.

### 13. CORS reflects origin without `Vary: Origin` header

- **Files:** `api/rateLimit.js:99-108`
- **Issue:** When `ALLOWED_ORIGIN=*`, the code reflects the request origin but doesn't set `Vary: Origin`, which can cause CDN caching issues.
- **Why it matters:** Could cause stale CORS headers in CDN-cached responses.
- **Fix:** Add `Vary: Origin` header when reflecting origin.

---

## MEDIUM Priority

### 14. SharedViewPage silently swallows expired share link errors

- **Files:** `src/components/shared/SharedViewPage.jsx:57-58`
- **Issue:** If a server share fetch fails (404, 410 expired), the code silently falls through to hash-based decoding, then shows a generic error.
- **Why it matters:** Users see "Invalid or missing timeline" when their share link has expired.
- **Fix:** Check HTTP status and show specific "expired" or "not found" messages.

### 15. PDF export uses hardcoded 300ms timeout for rendering

- **Files:** `src/utils/exportHelpers.js:169`
- **Issue:** `setTimeout(r, 300)` before html2canvas capture may not be enough for slow machines or large timelines.
- **Why it matters:** PDF exports may have missing fonts or broken layouts.
- **Fix:** Use `iframe.contentWindow.onload` or `document.fonts.ready`.

### 16. Print silently fails with popup blockers

- **Files:** `src/utils/exportHelpers.js:147-153`
- **Issue:** `window.open('', '_blank')` returns null with popup blockers, but no feedback is shown.
- **Why it matters:** Users click "Print" and nothing happens.
- **Fix:** Show a toast explaining popups need to be allowed.

### 17. `LocationInput` dual state can diverge

- **Files:** `src/components/shared/LocationInput.jsx:27,38-40,143-151`
- **Issue:** Internal `query` state + external `value` prop with useEffect sync creates timing issues on blur.
- **Why it matters:** Location field may lose user input in some timing scenarios.
- **Fix:** Use controlled input directly or useRef for comparison.

### 18. `EventPhotoUploader` FileReader has no error handling

- **Files:** `src/components/timeline/EventPhotoUploader.jsx`
- **Issue:** `reader.readAsDataURL()` has no `onerror` handler. A corrupted file can stall the upload.
- **Why it matters:** One bad photo file permanently stalls the upload flow.
- **Fix:** Add `reader.onerror` handler.

### 19. `PhotoUpload` leaks `URL.createObjectURL` on unmount

- **Files:** `src/components/input/PhotoUpload.jsx`
- **Issue:** Object URLs for previews are not revoked on component unmount.
- **Why it matters:** Memory leak proportional to previewed photos per session.
- **Fix:** Add cleanup effect that revokes object URLs on unmount.

### 20. `PhotoLightbox` mutates ref during render

- **Files:** `src/components/shared/PhotoLightbox.jsx`
- **Issue:** `layerRef.current = pushModal()` during render violates React's purity contract.
- **Why it matters:** Could cause bugs with React strict mode or concurrent rendering.
- **Fix:** Move `pushModal()` to `useEffect`.

### 21. Uncleaned `setTimeout` in confirmation patterns

- **Files:** `src/components/timeline/BatchActionBar.jsx:63-71`, `src/components/timeline/TimelineManager.jsx:77`
- **Issue:** "Confirm delete" timeouts without cleanup refs; React warns on unmounted state updates.
- **Why it matters:** Console warnings; potential state corruption on quick remount.
- **Fix:** Use `useRef` for timer cleanup (pattern already in `EditEventModal`).

### 22. API returns raw AI JSON without schema validation

- **Files:** `api/parse.js:139-140`
- **Issue:** AI response is parsed and returned directly without validating event structure.
- **Why it matters:** Malformed AI responses could crash the UI (missing `id`, wrong types).
- **Fix:** Validate parsed events for required fields before returning.

---

## LOW Priority

### 23. Dead code: `fetchTimelineWithEvents` function

- **Files:** `src/lib/db.js:65-78`
- **Issue:** Never imported or called; replaced by batch query in `loadInitialData`.
- **Fix:** Remove the function.

### 24. Dead code: `decodeTimeline` in `shareEncoder.js`

- **Files:** `src/utils/shareEncoder.js:17-25`
- **Issue:** Exported but never imported. `SharedViewPage` uses LZString directly.
- **Fix:** Use the helper in SharedViewPage or remove it.

### 25. Dead `field` property in `exportCSV` columns array

- **Files:** `src/utils/exportHelpers.js:50-76`
- **Issue:** `columns` array defines `field` properties that are never used.
- **Fix:** Simplify to an array of header strings.

### 26. 5 unused component files never imported

- **Files:**
  - `src/components/shared/AnimatedSidePanel.jsx`
  - `src/components/timeline/InlinePersonAdder.jsx`
  - `src/components/timeline/InlineTagEditor.jsx`
  - `src/components/timeline/MergeConfirmModal.jsx`
  - `src/components/timeline/InlineEditField.jsx`
- **Issue:** These components are exported but never imported by any other file in the codebase.
- **Why it matters:** Dead code adds maintenance burden and bundle size.
- **Fix:** Remove the files, or wire them into the UI if they were intended to be used.

### 27. Unused exported utility functions

- **Files:**
  - `src/utils/modalStack.js` — `getModalZIndex()` exported but never imported
  - `src/utils/constants.js` — `getTagHoverBg()` and `getTagSelectedStyle()` exported but never imported
- **Issue:** Functions exist but have no consumers.
- **Fix:** Remove unused exports.

### 28. Unused CSS keyframes and classes

- **Files:** `src/index.css`
- **Issue:** Several CSS keyframes and classes are defined but never referenced in JSX:
  - `@keyframes landing-gradient-shift`, `landing-float`, `landing-pulse-ring`, `landing-draw-line`, `landing-typewriter`
  - `.landing-timeline-dot::after`, `.cinematic-card-row`, `.design-variant-btn`
- **Why it matters:** Dead CSS increases bundle size and confuses developers.
- **Fix:** Remove unused keyframes and classes.

### 29. Excessive `useEffect` dependencies for toolbar

- **Files:** `src/components/timeline/TimelinePage.jsx:230-278`
- **Issue:** 14 dependencies trigger toolbar re-creation on every change.
- **Why it matters:** Minor performance impact; unnecessary re-renders.
- **Fix:** Extract toolbar into a connected component reading from store directly.

### 30. Dark mode toggle in SharedViewPage disconnected from store

- **Files:** `src/components/shared/SharedViewPage.jsx:37-43`
- **Issue:** Local dark mode state doesn't persist or sync with the main app store.
- **Why it matters:** Inconsistent dark mode when navigating between views.
- **Fix:** Use the store's `toggleDarkMode` or sync on navigation.

### 31. `api/share.js` service role key fallback

- **Files:** `api/share.js:6-9`
- **Issue:** Key priority includes `SUPABASE_SERVICE_ROLE_KEY` which bypasses RLS.
- **Why it matters:** If misconfigured, full database access without RLS protection.
- **Fix:** Only use anon key for share operations.

### 32. Inconsistent modal stack usage

- **Files:** `src/utils/modalStack.js`, various modal components
- **Issue:** Some modals use the stack manager, others don't. Escape key may close wrong modal.
- **Fix:** Ensure all modals use the shared modal stack.

### 33. `usePeopleAutocomplete` dismiss timeout has no cleanup

- **Files:** `src/hooks/usePeopleAutocomplete.js:53-55`
- **Issue:** `setTimeout(() => setSuggestions([]), 150)` without cleanup ref.
- **Why it matters:** Minor — could set state on unmounted component.
- **Fix:** Store timeout ref and clear on unmount.

---

## Summary

| Priority | Count | Key Themes |
|----------|-------|------------|
| **Critical** | 4 | Data loss risks (shared timeline copy, undo corruption, delete+undo race, sync race) |
| **High** | 9 | Weak IDs, missing security headers, performance, dead state, rate limit, CORS |
| **Medium** | 9 | Silent failures (PDF, print, photo upload), state divergence, unvalidated AI output, timer leaks |
| **Low** | 11 | Dead code (5 unused components, 3 unused functions, unused CSS), UX inconsistencies, security config |

### Recommended fix order

1. **Critical #1** — SharedViewPage copy creates empty timeline (data loss)
2. **Critical #3** — Undo/redo corruption from concurrent commits
3. **Critical #4** — Delete + undo remote sync race
4. **Critical #2** — createNewTimeline parse race condition
5. **High #5** — Replace `Math.random()` with `crypto.randomUUID()` for event IDs
6. **High #6** — Add HSTS and CSP security headers
7. **High #9 + #10** — Remove dead `photos: []` state (quick cleanup)
8. **Medium #22** — Validate AI response schema (prevents crashes)
9. **Medium #14** — Show specific error for expired share links
10. Remaining issues by group
