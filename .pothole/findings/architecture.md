# Findings: architecture

Detector: detect-architecture. Coverage: madge ran and reported 0 import cycles, so file-level cycle detection is tool-backed and clean. Drift checked against the CLAUDE.md declarations recorded in the survey: api/ imports nothing from src/ (clean), components/ui imports no store/feature code (Tooltip only pulls CAN_HOVER from constants), heavy views are React.lazy in both dispatchers, store slices only write events via commitEvents/undo/redo or timeline load/switch, photoMap only written inside slices. God-module check: constants.js, dateUtils.js, selectors.js, dataService.js import no feature/component code back, so they are libraries, not god modules. Zombie-path and god-module coverage is AI-only. Seen but not reported (no declared layering rule covers them): src/hooks/useTimelineShell.jsx imports components/layout/Sidebar and timeline/TimelineToolbar, and src/hooks/useLightbox.jsx imports shared/PhotoLightbox (hooks layer depending on components); components/shared/SharedViewPage is a route page that imports four timeline views, giving a directory-level shared<->timeline loop madge cannot see at file level. Architecture should recheck these if the survey ever declares a hooks/components or shared/timeline direction. [coverage=full]

## PH-709 Shared-link page keeps its own view dispatcher that never received the per-view error boundary or skeleton fixes

```yaml
id: PH-709
category: architecture
title: Shared-link page keeps its own view dispatcher that never received the
  per-view error boundary or skeleton fixes
severity: major
traffic: 0.21056578289863104
confidence: ai-suspected
evidence:
  - src/components/shared/SharedViewPage.jsx:221
  - src/components/timeline/TimelineViewRenderer.jsx:163
  - src/components/timeline/TimelineViewRenderer.jsx:18
  - 98d208a
source:
  - detect-architecture
repair_cost: M
fingerprint: architecture:src/components/shared:shared-view-dispatcher-zombie
```

Two live paths decide which view component renders a timeline: TimelineViewRenderer (editor, route /) and an inline chain of activeView conditionals in SharedViewPage (public /s route, mounted at src/App.jsx:56). Commit 98d208a added ViewErrorBoundary keyed by view+variant to TimelineViewRenderer only, and the ViewSkeleton Suspense fallbacks also landed only there; SharedViewPage.jsx:221-233 still renders VerticalView/HorizontalView/GridView bare and lazy Map/Graph with ad-hoc spinner fallbacks, so a render error in any view on a public share link falls through to the app-wide ErrorBoundary instead of the recoverable per-view card. The shared page also cannot show any of the 6 design variants. Every future view-level fix (caps, boundaries, fallbacks, new views) has to be made twice or the share surface diverges further; it also makes components/shared import four components/timeline views, inverting the shared-to-feature direction. Root fix: give TimelineViewRenderer a read-only mode (editable/onEditEvent optional) and render it from SharedViewPage - a few files, under a day, hence M.
