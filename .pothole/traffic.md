# Traffic Report

Generated 2026-11-02T11:12:29.000Z · 356 commits over last 24 months · complexity via scc.
Traffic = recency-weighted churn (half-life 90 days), normalized to [0,1].
181 file(s) measured, and 47 churned path(s) excluded because they no longer exist. Debt cannot be repaired in a deleted file, and counting one would pad the census that every RQI divides by.

## Hotspots (traffic × complexity)

| File | Commits | Traffic | Complexity | Hotspot | Authors |
|---|---|---|---|---|---|
| src/utils/dateUtils.js | 19 | 0.32 | 153 | 0.32 | 3 |
| src/components/timeline/EventCard.jsx | 76 | 0.83 | 55 | 0.30 | 3 |
| src/components/timeline/TimelinePage.jsx | 90 | 0.92 | 40 | 0.24 | 3 |
| src/store/selectors.js | 14 | 0.26 | 97 | 0.16 | 3 |
| src/utils/exportHelpers.js | 31 | 0.31 | 73 | 0.15 | 3 |
| src/components/timeline/TimelineToolbar.jsx | 43 | 0.48 | 42 | 0.13 | 3 |
| src/components/timeline/HorizontalView.jsx | 39 | 0.35 | 50 | 0.11 | 2 |
| src/store/slices/eventsSlice.js | 22 | 0.25 | 61 | 0.10 | 3 |
| src/components/timeline/InlineImportPanel.jsx | 24 | 0.27 | 57 | 0.10 | 2 |
| src/components/timeline/VerticalView.jsx | 34 | 0.42 | 35 | 0.10 | 3 |
| src/components/timeline/InsightsPanel.jsx | 13 | 0.18 | 76 | 0.09 | 3 |
| src/components/shared/DatePicker.jsx | 25 | 0.20 | 51 | 0.07 | 1 |
| src/utils/constants.js | 35 | 0.56 | 14 | 0.05 | 4 |
| src/components/timeline/GraphView.jsx | 13 | 0.17 | 46 | 0.05 | 2 |
| api/parse.js | 20 | 0.20 | 38 | 0.05 | 4 |
| src/components/timeline/EditEventModal.jsx | 31 | 0.30 | 26 | 0.05 | 2 |
| src/components/timeline/PhotoLibrary.jsx | 20 | 0.19 | 38 | 0.05 | 2 |
| src/utils/importHelpers.js | 9 | 0.09 | 71 | 0.04 | 2 |
| src/components/shared/EventFormFields.jsx | 11 | 0.20 | 31 | 0.04 | 3 |
| src/lib/dataService.js | 19 | 0.16 | 38 | 0.04 | 2 |

## Change coupling (files that move together)

| A | B | Co-changes | Strength |
|---|---|---|---|
| src/components/timeline/EventCard.jsx | src/components/timeline/TimelinePage.jsx | 38 | 0.50 |
| src/components/timeline/EventCard.jsx | src/components/timeline/HorizontalView.jsx | 22 | 0.56 |
| src/components/timeline/GridView.jsx | src/components/timeline/VerticalView.jsx | 21 | 0.62 |
| src/components/timeline/GridView.jsx | src/components/timeline/TimelinePage.jsx | 20 | 0.57 |
| src/components/layout/Header.jsx | src/components/timeline/TimelinePage.jsx | 19 | 0.61 |
| src/components/layout/Shell.jsx | src/components/timeline/TimelinePage.jsx | 18 | 0.90 |
| src/components/timeline/TimelinePage.jsx | src/store/useTimelineStore.js | 18 | 0.53 |
| src/components/timeline/TimelinePage.jsx | src/components/timeline/VerticalView.jsx | 17 | 0.50 |
| src/components/timeline/AddEventModal.jsx | src/components/timeline/TimelinePage.jsx | 16 | 0.59 |
| src/components/timeline/AddEventModal.jsx | src/components/timeline/EventCard.jsx | 15 | 0.56 |
| src/components/timeline/HorizontalFilmStrip.jsx | src/components/timeline/HorizontalPanoramic.jsx | 14 | 0.78 |
| src/components/timeline/HorizontalFilmStrip.jsx | src/components/timeline/HorizontalWave.jsx | 14 | 0.78 |
| src/components/timeline/HorizontalPanoramic.jsx | src/components/timeline/HorizontalWave.jsx | 14 | 0.78 |
| src/components/timeline/VerticalCinematic.jsx | src/components/timeline/VerticalMagazine.jsx | 13 | 0.87 |
| src/components/timeline/VerticalMagazine.jsx | src/components/timeline/VerticalNarrative.jsx | 13 | 0.87 |
| src/components/timeline/VerticalCinematic.jsx | src/components/timeline/VerticalNarrative.jsx | 13 | 0.81 |
| src/components/layout/Sidebar.jsx | src/components/layout/SidebarContent.jsx | 12 | 0.55 |
| src/components/timeline/EventCard.jsx | src/components/timeline/TimelineManager.jsx | 12 | 0.55 |
| src/components/shared/Badge.jsx | src/components/timeline/EventCard.jsx | 11 | 0.65 |
| src/components/timeline/TimelinePage.jsx | src/store/slices/eventsSlice.js | 11 | 0.50 |

## Bus-factor-1 files (≥5 commits, ≥80% one author)

- src/components/timeline/TimelinePage.jsx
- src/components/timeline/EventCard.jsx
- src/index.css
- src/components/layout/Sidebar.jsx
- src/components/timeline/TimelineToolbar.jsx
- src/components/timeline/GridView.jsx
- src/components/timeline/HorizontalView.jsx
- src/utils/exportHelpers.js
- src/components/layout/Header.jsx
- src/components/timeline/EditEventModal.jsx
- src/components/timeline/InlineImportPanel.jsx
- src/store/slices/eventsSlice.js
- src/store/useTimelineStore.js
- api/share.js
- src/components/timeline/BatchActionBar.jsx
- src/components/timeline/AddEventModal.jsx
- api/parse.js
- src/components/shared/DatePicker.jsx
- src/components/timeline/PhotoLibrary.jsx
- src/components/timeline/HorizontalFilmStrip.jsx
- src/components/layout/Shell.jsx
- src/components/filters/SearchInput.jsx
- src/components/timeline/HorizontalPanoramic.jsx
- src/components/timeline/HorizontalWave.jsx
- src/components/filters/MultiSelect.jsx
- src/lib/dataService.js
- src/components/timeline/MapView.jsx
- src/components/shared/AnimatedModal.jsx
- src/components/timeline/SortBar.jsx
- src/components/timeline/VerticalCinematic.jsx
- src/components/timeline/LandingContent.jsx
- src/components/timeline/VerticalNarrative.jsx
- src/components/timeline/ImportMenu.jsx
- src/components/shared/Badge.jsx
- src/components/timeline/VerticalMagazine.jsx
- src/components/timeline/PhotoPreview.jsx
- src/store/slices/timelinesSlice.js
- api/analyze.js
- src/components/shared/Toast.jsx
- src/components/input/TextInput.jsx
- src/utils/importHelpers.js
- src/lib/db.js
- src/store/slices/photosSlice.js
- src/components/shared/PhotoLightbox.jsx
- src/hooks/useGroupedVirtualizer.js
- src/lib/photoStore.js
- supabase-migration.sql
- src/schemas/event.js
- src/components/layout/Logo.jsx
- src/components/timeline/EventPhotoUploader.jsx
- src/utils/dedupeHelpers.js
- src/hooks/useEventForm.js
- src/components/timeline/TimelineViewRenderer.jsx
- api/rateLimit.js
- src/lib/photoSync.js
- .github/workflows/ci.yml
- eslint.config.js
- src/hooks/useCardClick.js
- src/components/shared/EmptyState.jsx
