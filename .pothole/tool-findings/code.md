# Tool findings: code

Tools run: eslint-sonar (80 findings), jscpd (68 findings), gitleaks (0 findings), osv-scanner (0 findings), madge (0 findings), repowise-dead-code (0 findings), repowise-health (60 findings). Skipped (not measured): sonar — set SONAR_HOST_URL, SONAR_TOKEN, SONAR_PROJECT_KEY (or sonar-project.properties); semgrep — failed (exit 2; message withheld — tool output can echo repo contents); lcov — no coverage/lcov.info in the repo (Pothole never runs the target's tests, so it cannot produce one): coverage is not measured. Coverage notes: repowise-health — TRUNCATED at 60 of 201 health findings: coverage is partial.

## PH-003 Refactor this function to reduce its Cognitive Complexity from 18 to the 15 allowed.

```yaml
id: PH-003
category: code
title: Refactor this function to reduce its Cognitive Complexity from 18 to the
  15 allowed.
severity: minor
traffic: 0.2043498187424466
confidence: tool-reported
evidence:
  - api/parse.js:153
source:
  - eslint-sonar
repair_cost: M
kind: terrible
repair: "Refactor: split the function and flatten the branching until it reads
  top to bottom."
fingerprint: code:api/parse.js:sonarjs/cognitive-complexity
```

## PH-004 Extract this nested ternary operation into an independent statement.

```yaml
id: PH-004
category: code
title: Extract this nested ternary operation into an independent statement.
severity: minor
traffic: 0.2043498187424466
confidence: tool-reported
evidence:
  - api/parse.js:185
source:
  - eslint-sonar
repair_cost: S
fingerprint: code:api/parse.js:sonarjs/no-nested-conditional
```

## PH-006 Remove this unused import of 'js'.

```yaml
id: PH-006
category: code
title: Remove this unused import of 'js'.
severity: minor
traffic: 0.04643710281189316
confidence: tool-reported
evidence:
  - eslint.config.js:1
source:
  - eslint-sonar
repair_cost: S
fingerprint: code:eslint.config.js:sonarjs/unused-import
```

## PH-008 Add at least one assertion to this test case.

```yaml
id: PH-008
category: code
title: Add at least one assertion to this test case.
severity: minor
traffic: 0.026506220253271366
confidence: tool-reported
evidence:
  - src/components/__tests__/views.smoke.test.jsx:204
source:
  - eslint-sonar
repair_cost: S
fingerprint: code:src/components/__tests__/views.smoke.test.jsx:sonarjs/assertions-in-tests
```

## PH-009 Extract this nested ternary operation into an independent statement.

```yaml
id: PH-009
category: code
title: Extract this nested ternary operation into an independent statement.
severity: minor
traffic: 0.16379004172754474
confidence: tool-reported
evidence:
  - src/components/filters/MultiSelect.jsx:100
source:
  - eslint-sonar
repair_cost: S
fingerprint: code:src/components/filters/MultiSelect.jsx:sonarjs/no-nested-conditional
```

## PH-010 Extract this nested ternary operation into an independent statement. (3× in file)

```yaml
id: PH-010
category: code
title: Extract this nested ternary operation into an independent statement. (3×
  in file)
severity: minor
traffic: 0.07701923695103502
confidence: tool-reported
evidence:
  - src/components/filters/YearRangeFilter.jsx:149
  - src/components/filters/YearRangeFilter.jsx:150
  - src/components/filters/YearRangeFilter.jsx:150
source:
  - eslint-sonar
repair_cost: S
fingerprint: code:src/components/filters/YearRangeFilter.jsx:sonarjs/no-nested-conditional
```

## PH-011 Extract this nested ternary operation into an independent statement.

```yaml
id: PH-011
category: code
title: Extract this nested ternary operation into an independent statement.
severity: minor
traffic: 0.5125840063161025
confidence: tool-reported
evidence:
  - src/components/layout/Sidebar.jsx:147
source:
  - eslint-sonar
repair_cost: S
fingerprint: code:src/components/layout/Sidebar.jsx:sonarjs/no-nested-conditional
```

## PH-012 Refactor this code to not use nested template literals.

```yaml
id: PH-012
category: code
title: Refactor this code to not use nested template literals.
severity: minor
traffic: 0.2809655465816707
confidence: tool-reported
evidence:
  - src/components/layout/SidebarContent.jsx:29
source:
  - eslint-sonar
repair_cost: S
fingerprint: code:src/components/layout/SidebarContent.jsx:sonarjs/no-nested-template-literals
```

## PH-013 Extract this nested ternary operation into an independent statement. (2× in file)

```yaml
id: PH-013
category: code
title: Extract this nested ternary operation into an independent statement. (2×
  in file)
severity: minor
traffic: 0.14602326368898638
confidence: tool-reported
evidence:
  - src/components/review/ReviewPanel.jsx:82
  - src/components/review/ReviewPanel.jsx:84
source:
  - eslint-sonar
repair_cost: S
fingerprint: code:src/components/review/ReviewPanel.jsx:sonarjs/no-nested-conditional
```

## PH-014 Refactor this function to reduce its Cognitive Complexity from 18 to the 15 allowed.

```yaml
id: PH-014
category: code
title: Refactor this function to reduce its Cognitive Complexity from 18 to the
  15 allowed.
severity: minor
traffic: 0.12766327377943257
confidence: tool-reported
evidence:
  - src/components/shared/Badge.jsx:18
source:
  - eslint-sonar
repair_cost: M
kind: terrible
repair: "Refactor: split the function and flatten the branching until it reads
  top to bottom."
fingerprint: code:src/components/shared/Badge.jsx:sonarjs/cognitive-complexity
```

## PH-015 Refactor this function to reduce its Cognitive Complexity from 16 to the 15 allowed.

```yaml
id: PH-015
category: code
title: Refactor this function to reduce its Cognitive Complexity from 16 to the
  15 allowed.
severity: minor
traffic: 0.20302791937224024
confidence: tool-reported
evidence:
  - src/components/shared/DatePicker.jsx:35
source:
  - eslint-sonar
repair_cost: M
kind: terrible
repair: "Refactor: split the function and flatten the branching until it reads
  top to bottom."
fingerprint: code:src/components/shared/DatePicker.jsx:sonarjs/cognitive-complexity
```

## PH-016 Extract this nested ternary operation into an independent statement. (3× in file)

```yaml
id: PH-016
category: code
title: Extract this nested ternary operation into an independent statement. (3×
  in file)
severity: minor
traffic: 0.20302791937224024
confidence: tool-reported
evidence:
  - src/components/shared/DatePicker.jsx:282
  - src/components/shared/DatePicker.jsx:284
  - src/components/shared/DatePicker.jsx:422
source:
  - eslint-sonar
repair_cost: S
fingerprint: code:src/components/shared/DatePicker.jsx:sonarjs/no-nested-conditional
```

## PH-017 Refactor this function to reduce its Cognitive Complexity from 17 to the 15 allowed.

```yaml
id: PH-017
category: code
title: Refactor this function to reduce its Cognitive Complexity from 17 to the
  15 allowed.
severity: minor
traffic: 0.10626962583365701
confidence: tool-reported
evidence:
  - src/components/shared/LocationInput.jsx:24
source:
  - eslint-sonar
repair_cost: M
kind: terrible
repair: "Refactor: split the function and flatten the branching until it reads
  top to bottom."
fingerprint: code:src/components/shared/LocationInput.jsx:sonarjs/cognitive-complexity
```

## PH-018 Extract this nested ternary operation into an independent statement. (4× in file)

```yaml
id: PH-018
category: code
title: Extract this nested ternary operation into an independent statement. (4×
  in file)
severity: minor
traffic: 0.10626962583365701
confidence: tool-reported
evidence:
  - src/components/shared/LocationInput.jsx:191
  - src/components/shared/LocationInput.jsx:196
  - src/components/shared/LocationInput.jsx:264
  - src/components/shared/LocationInput.jsx:267
source:
  - eslint-sonar
repair_cost: S
fingerprint: code:src/components/shared/LocationInput.jsx:sonarjs/no-nested-conditional
```

## PH-019 Extract this nested ternary operation into an independent statement.

```yaml
id: PH-019
category: code
title: Extract this nested ternary operation into an independent statement.
severity: minor
traffic: 0.21056578289863104
confidence: tool-reported
evidence:
  - src/components/shared/SharedViewPage.jsx:43
source:
  - eslint-sonar
repair_cost: S
fingerprint: code:src/components/shared/SharedViewPage.jsx:sonarjs/no-nested-conditional
```

## PH-020 Refactor this function to reduce its Cognitive Complexity from 18 to the 15 allowed.

```yaml
id: PH-020
category: code
title: Refactor this function to reduce its Cognitive Complexity from 18 to the
  15 allowed.
severity: minor
traffic: 0.03858127814655072
confidence: tool-reported
evidence:
  - src/components/shared/WhenField.jsx:17
source:
  - eslint-sonar
repair_cost: M
kind: terrible
repair: "Refactor: split the function and flatten the branching until it reads
  top to bottom."
fingerprint: code:src/components/shared/WhenField.jsx:sonarjs/cognitive-complexity
```

## PH-021 Extract this nested ternary operation into an independent statement. (2× in file)

```yaml
id: PH-021
category: code
title: Extract this nested ternary operation into an independent statement. (2×
  in file)
severity: minor
traffic: 0.03858127814655072
confidence: tool-reported
evidence:
  - src/components/shared/WhenField.jsx:53
  - src/components/shared/WhenField.jsx:55
source:
  - eslint-sonar
repair_cost: S
fingerprint: code:src/components/shared/WhenField.jsx:sonarjs/no-nested-conditional
```

## PH-022 Refactor this function to reduce its Cognitive Complexity from 23 to the 15 allowed.

```yaml
id: PH-022
category: code
title: Refactor this function to reduce its Cognitive Complexity from 23 to the
  15 allowed.
severity: minor
traffic: 0.8257399982582982
confidence: tool-reported
evidence:
  - src/components/timeline/EventCard.jsx:56
source:
  - eslint-sonar
repair_cost: M
kind: terrible
repair: "Refactor: split the function and flatten the branching until it reads
  top to bottom."
fingerprint: code:src/components/timeline/EventCard.jsx:sonarjs/cognitive-complexity
```

## PH-023 Extract this nested ternary operation into an independent statement. (2× in file)

```yaml
id: PH-023
category: code
title: Extract this nested ternary operation into an independent statement. (2×
  in file)
severity: minor
traffic: 0.8257399982582982
confidence: tool-reported
evidence:
  - src/components/timeline/EventCard.jsx:77
  - src/components/timeline/EventCard.jsx:387
source:
  - eslint-sonar
repair_cost: S
fingerprint: code:src/components/timeline/EventCard.jsx:sonarjs/no-nested-conditional
```

## PH-024 Extract this nested ternary operation into an independent statement. (3× in file)

```yaml
id: PH-024
category: code
title: Extract this nested ternary operation into an independent statement. (3×
  in file)
severity: minor
traffic: 0.09718636513061821
confidence: tool-reported
evidence:
  - src/components/timeline/EventDetailView.jsx:47
  - src/components/timeline/EventDetailView.jsx:47
  - src/components/timeline/EventDetailView.jsx:47
source:
  - eslint-sonar
repair_cost: S
fingerprint: code:src/components/timeline/EventDetailView.jsx:sonarjs/no-nested-conditional
```

## PH-025 Refactor this function to reduce its Cognitive Complexity from 27 to the 15 allowed.

```yaml
id: PH-025
category: code
title: Refactor this function to reduce its Cognitive Complexity from 27 to the
  15 allowed.
severity: minor
traffic: 0.09718636513061821
confidence: tool-reported
evidence:
  - src/components/timeline/EventDetailView.jsx:62
source:
  - eslint-sonar
repair_cost: M
kind: terrible
repair: "Refactor: split the function and flatten the branching until it reads
  top to bottom."
fingerprint: code:src/components/timeline/EventDetailView.jsx:sonarjs/cognitive-complexity
```

## PH-026 Refactor this code to not nest functions more than 4 levels deep.

```yaml
id: PH-026
category: code
title: Refactor this code to not nest functions more than 4 levels deep.
severity: minor
traffic: 0.07509467384231483
confidence: tool-reported
evidence:
  - src/components/timeline/EventPhotoUploader.jsx:95
source:
  - eslint-sonar
repair_cost: S
fingerprint: code:src/components/timeline/EventPhotoUploader.jsx:sonarjs/no-nested-functions
```

## PH-027 Extract this nested ternary operation into an independent statement. (2× in file)

```yaml
id: PH-027
category: code
title: Extract this nested ternary operation into an independent statement. (2×
  in file)
severity: minor
traffic: 0.06848178823921588
confidence: tool-reported
evidence:
  - src/components/timeline/FilterEmptyState.jsx:55
  - src/components/timeline/FilterEmptyState.jsx:96
source:
  - eslint-sonar
repair_cost: S
fingerprint: code:src/components/timeline/FilterEmptyState.jsx:sonarjs/no-nested-conditional
```

## PH-028 Refactor this function to reduce its Cognitive Complexity from 22 to the 15 allowed.

```yaml
id: PH-028
category: code
title: Refactor this function to reduce its Cognitive Complexity from 22 to the
  15 allowed.
severity: minor
traffic: 0.17099978351784823
confidence: tool-reported
evidence:
  - src/components/timeline/GraphView.jsx:44
source:
  - eslint-sonar
repair_cost: M
kind: terrible
repair: "Refactor: split the function and flatten the branching until it reads
  top to bottom."
fingerprint: code:src/components/timeline/GraphView.jsx:sonarjs/cognitive-complexity
```

## PH-029 Extract this nested ternary operation into an independent statement.

```yaml
id: PH-029
category: code
title: Extract this nested ternary operation into an independent statement.
severity: minor
traffic: 0.17099978351784823
confidence: tool-reported
evidence:
  - src/components/timeline/GraphView.jsx:287
source:
  - eslint-sonar
repair_cost: S
fingerprint: code:src/components/timeline/GraphView.jsx:sonarjs/no-nested-conditional
```

## PH-030 Refactor this function to reduce its Cognitive Complexity from 24 to the 15 allowed.

```yaml
id: PH-030
category: code
title: Refactor this function to reduce its Cognitive Complexity from 24 to the
  15 allowed.
severity: minor
traffic: 0.17053956872507722
confidence: tool-reported
evidence:
  - src/components/timeline/HorizontalPanoramic.jsx:25
source:
  - eslint-sonar
repair_cost: M
kind: terrible
repair: "Refactor: split the function and flatten the branching until it reads
  top to bottom."
fingerprint: code:src/components/timeline/HorizontalPanoramic.jsx:sonarjs/cognitive-complexity
```

## PH-031 Extract this nested ternary operation into an independent statement. (5× in file)

```yaml
id: PH-031
category: code
title: Extract this nested ternary operation into an independent statement. (5×
  in file)
severity: minor
traffic: 0.17053956872507722
confidence: tool-reported
evidence:
  - src/components/timeline/HorizontalPanoramic.jsx:45
  - src/components/timeline/HorizontalPanoramic.jsx:46
  - src/components/timeline/HorizontalPanoramic.jsx:47
  - src/components/timeline/HorizontalPanoramic.jsx:61
  - src/components/timeline/HorizontalPanoramic.jsx:284
source:
  - eslint-sonar
repair_cost: S
fingerprint: code:src/components/timeline/HorizontalPanoramic.jsx:sonarjs/no-nested-conditional
```

## PH-032 Refactor this function to reduce its Cognitive Complexity from 17 to the 15 allowed.

```yaml
id: PH-032
category: code
title: Refactor this function to reduce its Cognitive Complexity from 17 to the
  15 allowed.
severity: minor
traffic: 0.35158351559294687
confidence: tool-reported
evidence:
  - src/components/timeline/HorizontalView.jsx:366
source:
  - eslint-sonar
repair_cost: M
kind: terrible
repair: "Refactor: split the function and flatten the branching until it reads
  top to bottom."
fingerprint: code:src/components/timeline/HorizontalView.jsx:sonarjs/cognitive-complexity
```

## PH-033 Extract this nested ternary operation into an independent statement.

```yaml
id: PH-033
category: code
title: Extract this nested ternary operation into an independent statement.
severity: minor
traffic: 0.16805638865901032
confidence: tool-reported
evidence:
  - src/components/timeline/HorizontalWave.jsx:33
source:
  - eslint-sonar
repair_cost: S
fingerprint: code:src/components/timeline/HorizontalWave.jsx:sonarjs/no-nested-conditional
```

## PH-034 Refactor this function to reduce its Cognitive Complexity from 43 to the 15 allowed.

```yaml
id: PH-034
category: code
title: Refactor this function to reduce its Cognitive Complexity from 43 to the
  15 allowed.
severity: minor
traffic: 0.27051323455460075
confidence: tool-reported
evidence:
  - src/components/timeline/InlineImportPanel.jsx:322
source:
  - eslint-sonar
repair_cost: M
kind: terrible
repair: "Refactor: split the function and flatten the branching until it reads
  top to bottom."
fingerprint: code:src/components/timeline/InlineImportPanel.jsx:sonarjs/cognitive-complexity
```

## PH-035 Refactor this code to not nest functions more than 4 levels deep.

```yaml
id: PH-035
category: code
title: Refactor this code to not nest functions more than 4 levels deep.
severity: minor
traffic: 0.27051323455460075
confidence: tool-reported
evidence:
  - src/components/timeline/InlineImportPanel.jsx:365
source:
  - eslint-sonar
repair_cost: S
fingerprint: code:src/components/timeline/InlineImportPanel.jsx:sonarjs/no-nested-functions
```

## PH-036 Extract this nested ternary operation into an independent statement. (2× in file)

```yaml
id: PH-036
category: code
title: Extract this nested ternary operation into an independent statement. (2×
  in file)
severity: minor
traffic: 0.27051323455460075
confidence: tool-reported
evidence:
  - src/components/timeline/InlineImportPanel.jsx:781
  - src/components/timeline/InlineImportPanel.jsx:783
source:
  - eslint-sonar
repair_cost: S
fingerprint: code:src/components/timeline/InlineImportPanel.jsx:sonarjs/no-nested-conditional
```

## PH-037 Refactor this function to reduce its Cognitive Complexity from 34 to the 15 allowed.

```yaml
id: PH-037
category: code
title: Refactor this function to reduce its Cognitive Complexity from 34 to the
  15 allowed.
severity: minor
traffic: 0.1834675704862081
confidence: tool-reported
evidence:
  - src/components/timeline/InsightsPanel.jsx:279
source:
  - eslint-sonar
repair_cost: M
kind: terrible
repair: "Refactor: split the function and flatten the branching until it reads
  top to bottom."
fingerprint: code:src/components/timeline/InsightsPanel.jsx:sonarjs/cognitive-complexity
```

## PH-038 Extract this nested ternary operation into an independent statement. (7× in file)

```yaml
id: PH-038
category: code
title: Extract this nested ternary operation into an independent statement. (7×
  in file)
severity: minor
traffic: 0.1834675704862081
confidence: tool-reported
evidence:
  - src/components/timeline/InsightsPanel.jsx:389
  - src/components/timeline/InsightsPanel.jsx:391
  - src/components/timeline/InsightsPanel.jsx:392
  - src/components/timeline/InsightsPanel.jsx:393
  - src/components/timeline/InsightsPanel.jsx:440
  - src/components/timeline/InsightsPanel.jsx:449
  - src/components/timeline/InsightsPanel.jsx:490
source:
  - eslint-sonar
repair_cost: S
fingerprint: code:src/components/timeline/InsightsPanel.jsx:sonarjs/no-nested-conditional
```

## PH-039 Extract this nested ternary operation into an independent statement. (3× in file)

```yaml
id: PH-039
category: code
title: Extract this nested ternary operation into an independent statement. (3×
  in file)
severity: minor
traffic: 0.1928428742985504
confidence: tool-reported
evidence:
  - src/components/timeline/PhotoLibrary.jsx:203
  - src/components/timeline/PhotoLibrary.jsx:331
  - src/components/timeline/PhotoLibrary.jsx:442
source:
  - eslint-sonar
repair_cost: S
fingerprint: code:src/components/timeline/PhotoLibrary.jsx:sonarjs/no-nested-conditional
```

## PH-040 Extract this nested ternary operation into an independent statement. (3× in file)

```yaml
id: PH-040
category: code
title: Extract this nested ternary operation into an independent statement. (3×
  in file)
severity: minor
traffic: 0.12087724694540253
confidence: tool-reported
evidence:
  - src/components/timeline/PhotoPreview.jsx:41
  - src/components/timeline/PhotoPreview.jsx:109
  - src/components/timeline/PhotoPreview.jsx:141
source:
  - eslint-sonar
repair_cost: S
fingerprint: code:src/components/timeline/PhotoPreview.jsx:sonarjs/no-nested-conditional
```

## PH-041 Refactor this function to reduce its Cognitive Complexity from 31 to the 15 allowed.

```yaml
id: PH-041
category: code
title: Refactor this function to reduce its Cognitive Complexity from 31 to the
  15 allowed.
severity: minor
traffic: 0.12087724694540253
confidence: tool-reported
evidence:
  - src/components/timeline/PhotoPreview.jsx:87
source:
  - eslint-sonar
repair_cost: M
kind: terrible
repair: "Refactor: split the function and flatten the branching until it reads
  top to bottom."
fingerprint: code:src/components/timeline/PhotoPreview.jsx:sonarjs/cognitive-complexity
```

## PH-042 Extract this nested ternary operation into an independent statement.

```yaml
id: PH-042
category: code
title: Extract this nested ternary operation into an independent statement.
severity: minor
traffic: 0.11068932208642898
confidence: tool-reported
evidence:
  - src/components/timeline/StatsModal.jsx:172
source:
  - eslint-sonar
repair_cost: S
fingerprint: code:src/components/timeline/StatsModal.jsx:sonarjs/no-nested-conditional
```

## PH-043 Refactor this function to reduce its Cognitive Complexity from 31 to the 15 allowed.

```yaml
id: PH-043
category: code
title: Refactor this function to reduce its Cognitive Complexity from 31 to the
  15 allowed.
severity: minor
traffic: 0.27310525578343997
confidence: tool-reported
evidence:
  - src/components/timeline/TimelineManager.jsx:12
source:
  - eslint-sonar
repair_cost: M
kind: terrible
repair: "Refactor: split the function and flatten the branching until it reads
  top to bottom."
fingerprint: code:src/components/timeline/TimelineManager.jsx:sonarjs/cognitive-complexity
```

## PH-044 Extract this nested ternary operation into an independent statement. (3× in file)

```yaml
id: PH-044
category: code
title: Extract this nested ternary operation into an independent statement. (3×
  in file)
severity: minor
traffic: 0.27310525578343997
confidence: tool-reported
evidence:
  - src/components/timeline/TimelineManager.jsx:39
  - src/components/timeline/TimelineManager.jsx:42
  - src/components/timeline/TimelineManager.jsx:102
source:
  - eslint-sonar
repair_cost: S
fingerprint: code:src/components/timeline/TimelineManager.jsx:sonarjs/no-nested-conditional
```

## PH-045 Refactor this function to reduce its Cognitive Complexity from 56 to the 15 allowed.

```yaml
id: PH-045
category: code
title: Refactor this function to reduce its Cognitive Complexity from 56 to the
  15 allowed.
severity: minor
traffic: 0.920718317118289
confidence: tool-reported
evidence:
  - src/components/timeline/TimelinePage.jsx:110
source:
  - eslint-sonar
repair_cost: M
kind: terrible
repair: "Refactor: split the function and flatten the branching until it reads
  top to bottom."
fingerprint: code:src/components/timeline/TimelinePage.jsx:sonarjs/cognitive-complexity
```

## PH-046 Extract this nested ternary operation into an independent statement. (3× in file)

```yaml
id: PH-046
category: code
title: Extract this nested ternary operation into an independent statement. (3×
  in file)
severity: minor
traffic: 0.920718317118289
confidence: tool-reported
evidence:
  - src/components/timeline/TimelinePage.jsx:290
  - src/components/timeline/TimelinePage.jsx:305
  - src/components/timeline/TimelinePage.jsx:373
source:
  - eslint-sonar
repair_cost: S
fingerprint: code:src/components/timeline/TimelinePage.jsx:sonarjs/no-nested-conditional
```

## PH-047 Extract this nested ternary operation into an independent statement.

```yaml
id: PH-047
category: code
title: Extract this nested ternary operation into an independent statement.
severity: minor
traffic: 0.47761948749057187
confidence: tool-reported
evidence:
  - src/components/timeline/TimelineToolbar.jsx:553
source:
  - eslint-sonar
repair_cost: S
fingerprint: code:src/components/timeline/TimelineToolbar.jsx:sonarjs/no-nested-conditional
```

## PH-048 Refactor this function to reduce its Cognitive Complexity from 23 to the 15 allowed.

```yaml
id: PH-048
category: code
title: Refactor this function to reduce its Cognitive Complexity from 23 to the
  15 allowed.
severity: minor
traffic: 0.12962539060128375
confidence: tool-reported
evidence:
  - src/components/timeline/VerticalNarrative.jsx:12
source:
  - eslint-sonar
repair_cost: M
kind: terrible
repair: "Refactor: split the function and flatten the branching until it reads
  top to bottom."
fingerprint: code:src/components/timeline/VerticalNarrative.jsx:sonarjs/cognitive-complexity
```

## PH-049 Extract this nested ternary operation into an independent statement.

```yaml
id: PH-049
category: code
title: Extract this nested ternary operation into an independent statement.
severity: minor
traffic: 0.4188597992790474
confidence: tool-reported
evidence:
  - src/components/timeline/VerticalView.jsx:116
source:
  - eslint-sonar
repair_cost: S
fingerprint: code:src/components/timeline/VerticalView.jsx:sonarjs/no-nested-conditional
```

## PH-050 Refactor this code to not nest functions more than 4 levels deep.

```yaml
id: PH-050
category: code
title: Refactor this code to not nest functions more than 4 levels deep.
severity: minor
traffic: 0.4188597992790474
confidence: tool-reported
evidence:
  - src/components/timeline/VerticalView.jsx:289
source:
  - eslint-sonar
repair_cost: S
fingerprint: code:src/components/timeline/VerticalView.jsx:sonarjs/no-nested-functions
```

## PH-051 Refactor this function to reduce its Cognitive Complexity from 27 to the 15 allowed.

```yaml
id: PH-051
category: code
title: Refactor this function to reduce its Cognitive Complexity from 27 to the
  15 allowed.
severity: minor
traffic: 0.16288759396704247
confidence: tool-reported
evidence:
  - src/lib/dataService.js:176
source:
  - eslint-sonar
repair_cost: M
kind: terrible
repair: "Refactor: split the function and flatten the branching until it reads
  top to bottom."
fingerprint: code:src/lib/dataService.js:sonarjs/cognitive-complexity
```

## PH-054 Remove the declaration of the unused '_e' variable. (4× in file)

```yaml
id: PH-054
category: code
title: Remove the declaration of the unused '_e' variable. (4× in file)
severity: minor
traffic: 0.10404379040542859
confidence: tool-reported
evidence:
  - src/store/__tests__/eventsSlice.test.js:48
  - src/store/__tests__/eventsSlice.test.js:49
  - src/store/__tests__/eventsSlice.test.js:50
  - src/store/__tests__/eventsSlice.test.js:51
source:
  - eslint-sonar
repair_cost: S
fingerprint: code:src/store/__tests__/eventsSlice.test.js:sonarjs/no-unused-vars
```

## PH-057 Remove the declaration of the unused '_e' variable. (10× in file)

```yaml
id: PH-057
category: code
title: Remove the declaration of the unused '_e' variable. (10× in file)
severity: minor
traffic: 0.02124313771490268
confidence: tool-reported
evidence:
  - src/store/__tests__/timelinesSlice.test.js:66
  - src/store/__tests__/timelinesSlice.test.js:66
  - src/store/__tests__/timelinesSlice.test.js:66
  - src/store/__tests__/timelinesSlice.test.js:66
  - src/store/__tests__/timelinesSlice.test.js:68
  - src/store/__tests__/timelinesSlice.test.js:68
  - src/store/__tests__/timelinesSlice.test.js:68
  - src/store/__tests__/timelinesSlice.test.js:69
  - src/store/__tests__/timelinesSlice.test.js:69
  - src/store/__tests__/timelinesSlice.test.js:69
source:
  - eslint-sonar
repair_cost: S
fingerprint: code:src/store/__tests__/timelinesSlice.test.js:sonarjs/no-unused-vars
```

## PH-058 Extract this nested ternary operation into an independent statement. (6× in file)

```yaml
id: PH-058
category: code
title: Extract this nested ternary operation into an independent statement. (6×
  in file)
severity: minor
traffic: 0.2569365117006605
confidence: tool-reported
evidence:
  - src/store/selectors.js:108
  - src/store/selectors.js:109
  - src/store/selectors.js:131
  - src/store/selectors.js:132
  - src/store/selectors.js:145
  - src/store/selectors.js:147
source:
  - eslint-sonar
repair_cost: S
fingerprint: code:src/store/selectors.js:sonarjs/no-nested-conditional
```

## PH-059 Refactor this function to reduce its Cognitive Complexity from 29 to the 15 allowed. (2× in file)

```yaml
id: PH-059
category: code
title: Refactor this function to reduce its Cognitive Complexity from 29 to the
  15 allowed. (2× in file)
severity: minor
traffic: 0.2569365117006605
confidence: tool-reported
evidence:
  - src/store/selectors.js:269
  - src/store/selectors.js:359
source:
  - eslint-sonar
repair_cost: M
kind: terrible
repair: "Refactor: split the function and flatten the branching until it reads
  top to bottom."
fingerprint: code:src/store/selectors.js:sonarjs/cognitive-complexity
```

## PH-060 Refactor this code to not use nested template literals.

```yaml
id: PH-060
category: code
title: Refactor this code to not use nested template literals.
severity: minor
traffic: 0.2543626862864197
confidence: tool-reported
evidence:
  - src/store/slices/eventsSlice.js:467
source:
  - eslint-sonar
repair_cost: S
fingerprint: code:src/store/slices/eventsSlice.js:sonarjs/no-nested-template-literals
```

## PH-061 Refactor this function to reduce its Cognitive Complexity from 22 to the 15 allowed.

```yaml
id: PH-061
category: code
title: Refactor this function to reduce its Cognitive Complexity from 22 to the
  15 allowed.
severity: minor
traffic: 0.08871930695727588
confidence: tool-reported
evidence:
  - src/store/slices/photosSlice.js:28
source:
  - eslint-sonar
repair_cost: M
kind: terrible
repair: "Refactor: split the function and flatten the branching until it reads
  top to bottom."
fingerprint: code:src/store/slices/photosSlice.js:sonarjs/cognitive-complexity
```

## PH-062 Refactor this code to not nest functions more than 4 levels deep. (3× in file)

```yaml
id: PH-062
category: code
title: Refactor this code to not nest functions more than 4 levels deep. (3× in file)
severity: minor
traffic: 0.08871930695727588
confidence: tool-reported
evidence:
  - src/store/slices/photosSlice.js:38
  - src/store/slices/photosSlice.js:82
  - src/store/slices/photosSlice.js:97
source:
  - eslint-sonar
repair_cost: S
fingerprint: code:src/store/slices/photosSlice.js:sonarjs/no-nested-functions
```

## PH-063 Remove the declaration of the unused '_' variable.

```yaml
id: PH-063
category: code
title: Remove the declaration of the unused '_' variable.
severity: minor
traffic: 0.08871930695727588
confidence: tool-reported
evidence:
  - src/store/slices/photosSlice.js:89
source:
  - eslint-sonar
repair_cost: S
fingerprint: code:src/store/slices/photosSlice.js:sonarjs/no-unused-vars
```

## PH-064 Refactor this function to reduce its Cognitive Complexity from 22 to the 15 allowed.

```yaml
id: PH-064
category: code
title: Refactor this function to reduce its Cognitive Complexity from 22 to the
  15 allowed.
severity: minor
traffic: 0.10694046755254454
confidence: tool-reported
evidence:
  - src/store/slices/timelinesSlice.js:103
source:
  - eslint-sonar
repair_cost: M
kind: terrible
repair: "Refactor: split the function and flatten the branching until it reads
  top to bottom."
fingerprint: code:src/store/slices/timelinesSlice.js:sonarjs/cognitive-complexity
```

## PH-065 Refactor this code to not use nested template literals.

```yaml
id: PH-065
category: code
title: Refactor this code to not use nested template literals.
severity: minor
traffic: 0.251418831310741
confidence: tool-reported
evidence:
  - src/store/useTimelineStore.js:48
source:
  - eslint-sonar
repair_cost: S
fingerprint: code:src/store/useTimelineStore.js:sonarjs/no-nested-template-literals
```

## PH-067 Extract this nested ternary operation into an independent statement. (4× in file)

```yaml
id: PH-067
category: code
title: Extract this nested ternary operation into an independent statement. (4×
  in file)
severity: minor
traffic: 0.31737583906559763
confidence: tool-reported
evidence:
  - src/utils/dateUtils.js:208
  - src/utils/dateUtils.js:277
  - src/utils/dateUtils.js:313
  - src/utils/dateUtils.js:666
source:
  - eslint-sonar
repair_cost: S
fingerprint: code:src/utils/dateUtils.js:sonarjs/no-nested-conditional
```

## PH-068 Refactor this function to reduce its Cognitive Complexity from 24 to the 15 allowed. (4× in file)

```yaml
id: PH-068
category: code
title: Refactor this function to reduce its Cognitive Complexity from 24 to the
  15 allowed. (4× in file)
severity: minor
traffic: 0.31737583906559763
confidence: tool-reported
evidence:
  - src/utils/dateUtils.js:327
  - src/utils/dateUtils.js:450
  - src/utils/dateUtils.js:534
  - src/utils/dateUtils.js:655
source:
  - eslint-sonar
repair_cost: M
kind: terrible
repair: "Refactor: split the function and flatten the branching until it reads
  top to bottom."
fingerprint: code:src/utils/dateUtils.js:sonarjs/cognitive-complexity
```

## PH-070 Replace this character class by the character itself.

```yaml
id: PH-070
category: code
title: Replace this character class by the character itself.
severity: minor
traffic: 0.31737583906559763
confidence: tool-reported
evidence:
  - src/utils/dateUtils.js:538
source:
  - eslint-sonar
repair_cost: S
fingerprint: code:src/utils/dateUtils.js:sonarjs/single-char-in-character-classes
```

## PH-071 Simplify this regular expression to reduce its complexity from 54 to the 20 allowed.

```yaml
id: PH-071
category: code
title: Simplify this regular expression to reduce its complexity from 54 to the
  20 allowed.
severity: minor
traffic: 0.31737583906559763
confidence: tool-reported
evidence:
  - src/utils/dateUtils.js:614
source:
  - eslint-sonar
repair_cost: S
fingerprint: code:src/utils/dateUtils.js:sonarjs/regex-complexity
```

## PH-072 Refactor this code to not use nested template literals.

```yaml
id: PH-072
category: code
title: Refactor this code to not use nested template literals.
severity: minor
traffic: 0.31737583906559763
confidence: tool-reported
evidence:
  - src/utils/dateUtils.js:675
source:
  - eslint-sonar
repair_cost: S
fingerprint: code:src/utils/dateUtils.js:sonarjs/no-nested-template-literals
```

## PH-073 Refactor this function to reduce its Cognitive Complexity from 19 to the 15 allowed. (4× in file)

```yaml
id: PH-073
category: code
title: Refactor this function to reduce its Cognitive Complexity from 19 to the
  15 allowed. (4× in file)
severity: minor
traffic: 0.3149790492633774
confidence: tool-reported
evidence:
  - src/utils/exportHelpers.js:11
  - src/utils/exportHelpers.js:30
  - src/utils/exportHelpers.js:150
  - src/utils/exportHelpers.js:465
source:
  - eslint-sonar
repair_cost: M
kind: terrible
repair: "Refactor: split the function and flatten the branching until it reads
  top to bottom."
fingerprint: code:src/utils/exportHelpers.js:sonarjs/cognitive-complexity
```

## PH-074 Refactor this function to reduce its Cognitive Complexity from 35 to the 15 allowed.

```yaml
id: PH-074
category: code
title: Refactor this function to reduce its Cognitive Complexity from 35 to the
  15 allowed.
severity: minor
traffic: 0.09091787210140102
confidence: tool-reported
evidence:
  - src/utils/importHelpers.js:104
source:
  - eslint-sonar
repair_cost: M
kind: terrible
repair: "Refactor: split the function and flatten the branching until it reads
  top to bottom."
fingerprint: code:src/utils/importHelpers.js:sonarjs/cognitive-complexity
```

## PH-075 Extract this nested ternary operation into an independent statement.

```yaml
id: PH-075
category: code
title: Extract this nested ternary operation into an independent statement.
severity: minor
traffic: 0.09091787210140102
confidence: tool-reported
evidence:
  - src/utils/importHelpers.js:212
source:
  - eslint-sonar
repair_cost: S
fingerprint: code:src/utils/importHelpers.js:sonarjs/no-nested-conditional
```

## PH-078 Refactor this function to reduce its Cognitive Complexity from 22 to the 15 allowed.

```yaml
id: PH-078
category: code
title: Refactor this function to reduce its Cognitive Complexity from 22 to the
  15 allowed.
severity: minor
traffic: 0.009177927505226289
confidence: tool-reported
evidence:
  - src/workers/importWorker.js:67
source:
  - eslint-sonar
repair_cost: M
kind: terrible
repair: "Refactor: split the function and flatten the branching until it reads
  top to bottom."
fingerprint: code:src/workers/importWorker.js:sonarjs/cognitive-complexity
```

## PH-079 Extract this nested ternary operation into an independent statement.

```yaml
id: PH-079
category: code
title: Extract this nested ternary operation into an independent statement.
severity: minor
traffic: 0.009177927505226289
confidence: tool-reported
evidence:
  - src/workers/importWorker.js:207
source:
  - eslint-sonar
repair_cost: S
fingerprint: code:src/workers/importWorker.js:sonarjs/no-nested-conditional
```

## PH-081 Identical block (16 lines) copied between api/__tests__/analyze.test.js and api/__tests__/parse.test.js

```yaml
id: PH-081
category: code
title: Identical block (16 lines) copied between api/__tests__/analyze.test.js
  and api/__tests__/parse.test.js
severity: minor
traffic: 0.05292251071331573
confidence: tool-reported
evidence:
  - api/__tests__/analyze.test.js:12
  - api/__tests__/parse.test.js:12
source:
  - jscpd
repair_cost: S
kind: duplication
repair: Extract the duplicated block into one shared function and import it from
  both files.
fingerprint: code:api/__tests__/analyze.test.js:dup-api/__tests__/parse.test.js-16
```

## PH-082 Identical block (8 lines) copied between api/__tests__/analyze.test.js and api/__tests__/og.test.js

```yaml
id: PH-082
category: code
title: Identical block (8 lines) copied between api/__tests__/analyze.test.js
  and api/__tests__/og.test.js
severity: minor
traffic: 0.04697500242772937
confidence: tool-reported
evidence:
  - api/__tests__/analyze.test.js:17
  - api/__tests__/og.test.js:41
source:
  - jscpd
repair_cost: S
kind: duplication
repair: Extract the duplicated block into one shared function and import it from
  both files.
fingerprint: code:api/__tests__/analyze.test.js:dup-api/__tests__/og.test.js-8
```

## PH-083 Identical block (8 lines) copied between api/__tests__/analyze.test.js and api/__tests__/share.test.js

```yaml
id: PH-083
category: code
title: Identical block (8 lines) copied between api/__tests__/analyze.test.js
  and api/__tests__/share.test.js
severity: minor
traffic: 0.08139063056204297
confidence: tool-reported
evidence:
  - api/__tests__/analyze.test.js:17
  - api/__tests__/share.test.js:51
source:
  - jscpd
repair_cost: S
kind: duplication
repair: Extract the duplicated block into one shared function and import it from
  both files.
fingerprint: code:api/__tests__/analyze.test.js:dup-api/__tests__/share.test.js-8
```

## PH-084 Identical block (8 lines) copied between api/__tests__/analyze.test.js and api/__tests__/share.test.js

```yaml
id: PH-084
category: code
title: Identical block (8 lines) copied between api/__tests__/analyze.test.js
  and api/__tests__/share.test.js
severity: minor
traffic: 0.08139063056204297
confidence: tool-reported
evidence:
  - api/__tests__/analyze.test.js:23
  - api/__tests__/share.test.js:58
source:
  - jscpd
repair_cost: S
kind: duplication
repair: Extract the duplicated block into one shared function and import it from
  both files.
fingerprint: code:api/__tests__/analyze.test.js:dup-api/__tests__/share.test.js-8
```

## PH-085 Identical block (20 lines) copied between api/__tests__/analyze.test.js and api/__tests__/parse.test.js

```yaml
id: PH-085
category: code
title: Identical block (20 lines) copied between api/__tests__/analyze.test.js
  and api/__tests__/parse.test.js
severity: minor
traffic: 0.05292251071331573
confidence: tool-reported
evidence:
  - api/__tests__/analyze.test.js:43
  - api/__tests__/parse.test.js:38
source:
  - jscpd
repair_cost: S
kind: duplication
repair: Extract the duplicated block into one shared function and import it from
  both files.
fingerprint: code:api/__tests__/analyze.test.js:dup-api/__tests__/parse.test.js-20
```

## PH-086 Identical block (7 lines) copied between api/__tests__/analyze.test.js and api/__tests__/parse.test.js

```yaml
id: PH-086
category: code
title: Identical block (7 lines) copied between api/__tests__/analyze.test.js
  and api/__tests__/parse.test.js
severity: minor
traffic: 0.05292251071331573
confidence: tool-reported
evidence:
  - api/__tests__/analyze.test.js:90
  - api/__tests__/parse.test.js:96
source:
  - jscpd
repair_cost: S
kind: duplication
repair: Extract the duplicated block into one shared function and import it from
  both files.
fingerprint: code:api/__tests__/analyze.test.js:dup-api/__tests__/parse.test.js-7
```

## PH-087 Identical block (11 lines) copied between api/__tests__/analyze.test.js and api/__tests__/parse.test.js

```yaml
id: PH-087
category: code
title: Identical block (11 lines) copied between api/__tests__/analyze.test.js
  and api/__tests__/parse.test.js
severity: minor
traffic: 0.05292251071331573
confidence: tool-reported
evidence:
  - api/__tests__/analyze.test.js:96
  - api/__tests__/parse.test.js:102
source:
  - jscpd
repair_cost: S
kind: duplication
repair: Extract the duplicated block into one shared function and import it from
  both files.
fingerprint: code:api/__tests__/analyze.test.js:dup-api/__tests__/parse.test.js-11
```

## PH-088 Identical block (9 lines) copied between api/__tests__/analyze.test.js and api/__tests__/parse.test.js

```yaml
id: PH-088
category: code
title: Identical block (9 lines) copied between api/__tests__/analyze.test.js
  and api/__tests__/parse.test.js
severity: minor
traffic: 0.05292251071331573
confidence: tool-reported
evidence:
  - api/__tests__/analyze.test.js:106
  - api/__tests__/parse.test.js:112
source:
  - jscpd
repair_cost: S
kind: duplication
repair: Extract the duplicated block into one shared function and import it from
  both files.
fingerprint: code:api/__tests__/analyze.test.js:dup-api/__tests__/parse.test.js-9
```

## PH-089 Identical block (9 lines) copied between api/__tests__/analyze.test.js and api/__tests__/analyze.test.js

```yaml
id: PH-089
category: code
title: Identical block (9 lines) copied between api/__tests__/analyze.test.js
  and api/__tests__/analyze.test.js
severity: minor
traffic: 0.04697500242772937
confidence: tool-reported
evidence:
  - api/__tests__/analyze.test.js:179
  - api/__tests__/analyze.test.js:196
source:
  - jscpd
repair_cost: S
kind: duplication
repair: Extract the duplicated block into one shared function and import it from
  both files.
fingerprint: code:api/__tests__/analyze.test.js:dup-api/__tests__/analyze.test.js-9
```

## PH-090 Identical block (16 lines) copied between api/__tests__/og.test.js and api/__tests__/share.test.js

```yaml
id: PH-090
category: code
title: Identical block (16 lines) copied between api/__tests__/og.test.js and
  api/__tests__/share.test.js
severity: minor
traffic: 0.08139063056204297
confidence: tool-reported
evidence:
  - api/__tests__/og.test.js:9
  - api/__tests__/share.test.js:20
source:
  - jscpd
repair_cost: S
kind: duplication
repair: Extract the duplicated block into one shared function and import it from
  both files.
fingerprint: code:api/__tests__/og.test.js:dup-api/__tests__/share.test.js-16
```

## PH-091 Identical block (8 lines) copied between api/__tests__/og.test.js and api/__tests__/share.test.js

```yaml
id: PH-091
category: code
title: Identical block (8 lines) copied between api/__tests__/og.test.js and
  api/__tests__/share.test.js
severity: minor
traffic: 0.08139063056204297
confidence: tool-reported
evidence:
  - api/__tests__/og.test.js:45
  - api/__tests__/share.test.js:55
source:
  - jscpd
repair_cost: S
kind: duplication
repair: Extract the duplicated block into one shared function and import it from
  both files.
fingerprint: code:api/__tests__/og.test.js:dup-api/__tests__/share.test.js-8
```

## PH-092 Identical block (8 lines) copied between api/__tests__/parse.test.js and api/__tests__/parse.test.js

```yaml
id: PH-092
category: code
title: Identical block (8 lines) copied between api/__tests__/parse.test.js and
  api/__tests__/parse.test.js
severity: minor
traffic: 0.05292251071331573
confidence: tool-reported
evidence:
  - api/__tests__/parse.test.js:142
  - api/__tests__/parse.test.js:204
source:
  - jscpd
repair_cost: S
kind: duplication
repair: Extract the duplicated block into one shared function and import it from
  both files.
fingerprint: code:api/__tests__/parse.test.js:dup-api/__tests__/parse.test.js-8
```

## PH-093 Identical block (7 lines) copied between api/__tests__/share.test.js and api/__tests__/share.test.js

```yaml
id: PH-093
category: code
title: Identical block (7 lines) copied between api/__tests__/share.test.js and
  api/__tests__/share.test.js
severity: minor
traffic: 0.08139063056204297
confidence: tool-reported
evidence:
  - api/__tests__/share.test.js:181
  - api/__tests__/share.test.js:191
source:
  - jscpd
repair_cost: S
kind: duplication
repair: Extract the duplicated block into one shared function and import it from
  both files.
fingerprint: code:api/__tests__/share.test.js:dup-api/__tests__/share.test.js-7
```

## PH-094 Identical block (6 lines) copied between api/__tests__/share.test.js and api/__tests__/share.test.js

```yaml
id: PH-094
category: code
title: Identical block (6 lines) copied between api/__tests__/share.test.js and
  api/__tests__/share.test.js
severity: minor
traffic: 0.08139063056204297
confidence: tool-reported
evidence:
  - api/__tests__/share.test.js:205
  - api/__tests__/share.test.js:221
source:
  - jscpd
repair_cost: S
kind: duplication
repair: Extract the duplicated block into one shared function and import it from
  both files.
fingerprint: code:api/__tests__/share.test.js:dup-api/__tests__/share.test.js-6
```

## PH-095 Identical block (6 lines) copied between api/__tests__/share.test.js and api/__tests__/share.test.js

```yaml
id: PH-095
category: code
title: Identical block (6 lines) copied between api/__tests__/share.test.js and
  api/__tests__/share.test.js
severity: minor
traffic: 0.08139063056204297
confidence: tool-reported
evidence:
  - api/__tests__/share.test.js:205
  - api/__tests__/share.test.js:247
source:
  - jscpd
repair_cost: S
kind: duplication
repair: Extract the duplicated block into one shared function and import it from
  both files.
fingerprint: code:api/__tests__/share.test.js:dup-api/__tests__/share.test.js-6
```

## PH-096 Identical block (18 lines) copied between api/analyze.js and api/parse.js

```yaml
id: PH-096
category: code
title: Identical block (18 lines) copied between api/analyze.js and api/parse.js
severity: minor
traffic: 0.2043498187424466
confidence: tool-reported
evidence:
  - api/analyze.js:175
  - api/parse.js:105
source:
  - jscpd
repair_cost: S
kind: duplication
repair: Extract the duplicated block into one shared function and import it from
  both files.
fingerprint: code:api/analyze.js:dup-api/parse.js-18
```

## PH-097 Identical block (21 lines) copied between api/analyze.js and api/parse.js

```yaml
id: PH-097
category: code
title: Identical block (21 lines) copied between api/analyze.js and api/parse.js
severity: minor
traffic: 0.2043498187424466
confidence: tool-reported
evidence:
  - api/analyze.js:192
  - api/parse.js:124
source:
  - jscpd
repair_cost: S
kind: duplication
repair: Extract the duplicated block into one shared function and import it from
  both files.
fingerprint: code:api/analyze.js:dup-api/parse.js-21
```

## PH-098 Identical block (13 lines) copied between api/analyze.js and api/parse.js

```yaml
id: PH-098
category: code
title: Identical block (13 lines) copied between api/analyze.js and api/parse.js
severity: minor
traffic: 0.2043498187424466
confidence: tool-reported
evidence:
  - api/analyze.js:218
  - api/parse.js:194
source:
  - jscpd
repair_cost: S
kind: duplication
repair: Extract the duplicated block into one shared function and import it from
  both files.
fingerprint: code:api/analyze.js:dup-api/parse.js-13
```

## PH-099 Identical block (16 lines) copied between api/analyze.js and api/parse.js

```yaml
id: PH-099
category: code
title: Identical block (16 lines) copied between api/analyze.js and api/parse.js
severity: minor
traffic: 0.2043498187424466
confidence: tool-reported
evidence:
  - api/analyze.js:230
  - api/parse.js:206
source:
  - jscpd
repair_cost: S
kind: duplication
repair: Extract the duplicated block into one shared function and import it from
  both files.
fingerprint: code:api/analyze.js:dup-api/parse.js-16
```

## PH-100 Identical block (20 lines) copied between api/og.js and api/share.js

```yaml
id: PH-100
category: code
title: Identical block (20 lines) copied between api/og.js and api/share.js
severity: minor
traffic: 0.2509477199194409
confidence: tool-reported
evidence:
  - api/og.js:4
  - api/share.js:2
source:
  - jscpd
repair_cost: S
kind: duplication
repair: Extract the duplicated block into one shared function and import it from
  both files.
fingerprint: code:api/og.js:dup-api/share.js-20
```

## PH-101 Identical block (6 lines) copied between api/parse.js and src/schemas/event.js

```yaml
id: PH-101
category: code
title: Identical block (6 lines) copied between api/parse.js and src/schemas/event.js
severity: minor
traffic: 0.2043498187424466
confidence: tool-reported
evidence:
  - api/parse.js:4
  - src/schemas/event.js:47
source:
  - jscpd
repair_cost: S
kind: duplication
repair: Extract the duplicated block into one shared function and import it from
  both files.
fingerprint: code:api/parse.js:dup-src/schemas/event.js-6
```

## PH-102 Identical block (7 lines) copied between api/parse.js and src/schemas/event.js

```yaml
id: PH-102
category: code
title: Identical block (7 lines) copied between api/parse.js and src/schemas/event.js
severity: minor
traffic: 0.2043498187424466
confidence: tool-reported
evidence:
  - api/parse.js:14
  - src/schemas/event.js:55
source:
  - jscpd
repair_cost: S
kind: duplication
repair: Extract the duplicated block into one shared function and import it from
  both files.
fingerprint: code:api/parse.js:dup-src/schemas/event.js-7
```

## PH-103 Identical block (7 lines) copied between public/favicon.svg and scripts/og-image.html

```yaml
id: PH-103
category: code
title: Identical block (7 lines) copied between public/favicon.svg and
  scripts/og-image.html
severity: minor
traffic: 0.07425741642703756
confidence: tool-reported
evidence:
  - public/favicon.svg:1
  - scripts/og-image.html:59
source:
  - jscpd
repair_cost: S
kind: duplication
repair: Extract the duplicated block into one shared function and import it from
  both files.
fingerprint: code:public/favicon.svg:dup-scripts/og-image.html-7
```

## PH-104 Identical block (8 lines) copied between src/components/layout/ExportModal.jsx and src/components/timeline/EventCard.jsx

```yaml
id: PH-104
category: code
title: Identical block (8 lines) copied between
  src/components/layout/ExportModal.jsx and
  src/components/timeline/EventCard.jsx
severity: minor
traffic: 0.8257399982582982
confidence: tool-reported
evidence:
  - src/components/layout/ExportModal.jsx:160
  - src/components/timeline/EventCard.jsx:470
source:
  - jscpd
repair_cost: S
kind: duplication
repair: Extract the duplicated block into one shared function and import it from
  both files.
fingerprint: code:src/components/layout/ExportModal.jsx:dup-src/components/timeline/EventCard.jsx-8
```

## PH-105 Identical block (12 lines) copied between src/components/shared/AnimatedModal.jsx and src/components/shared/AnimatedModal.jsx

```yaml
id: PH-105
category: code
title: Identical block (12 lines) copied between
  src/components/shared/AnimatedModal.jsx and
  src/components/shared/AnimatedModal.jsx
severity: minor
traffic: 0.1469070173511929
confidence: tool-reported
evidence:
  - src/components/shared/AnimatedModal.jsx:22
  - src/components/shared/AnimatedModal.jsx:106
source:
  - jscpd
repair_cost: S
kind: duplication
repair: Extract the duplicated block into one shared function and import it from
  both files.
fingerprint: code:src/components/shared/AnimatedModal.jsx:dup-src/components/shared/AnimatedModal.jsx-12
```

## PH-106 Identical block (12 lines) copied between src/components/shared/ErrorBoundary.jsx and src/components/timeline/TimelineViewRenderer.jsx

```yaml
id: PH-106
category: code
title: Identical block (12 lines) copied between
  src/components/shared/ErrorBoundary.jsx and
  src/components/timeline/TimelineViewRenderer.jsx
severity: minor
traffic: 0.05991520585190514
confidence: tool-reported
evidence:
  - src/components/shared/ErrorBoundary.jsx:5
  - src/components/timeline/TimelineViewRenderer.jsx:18
source:
  - jscpd
repair_cost: S
kind: duplication
repair: Extract the duplicated block into one shared function and import it from
  both files.
fingerprint: code:src/components/shared/ErrorBoundary.jsx:dup-src/components/timeline/TimelineViewRenderer.jsx-12
```

## PH-107 Identical block (6 lines) copied between src/components/shared/EventFormFields.jsx and src/components/timeline/InlineImportPanel.jsx

```yaml
id: PH-107
category: code
title: Identical block (6 lines) copied between
  src/components/shared/EventFormFields.jsx and
  src/components/timeline/InlineImportPanel.jsx
severity: minor
traffic: 0.27051323455460075
confidence: tool-reported
evidence:
  - src/components/shared/EventFormFields.jsx:25
  - src/components/timeline/InlineImportPanel.jsx:490
source:
  - jscpd
repair_cost: S
kind: duplication
repair: Extract the duplicated block into one shared function and import it from
  both files.
fingerprint: code:src/components/shared/EventFormFields.jsx:dup-src/components/timeline/InlineImportPanel.jsx-6
```

## PH-108 Identical block (23 lines) copied between src/components/shared/PeopleInput.jsx and src/components/shared/PeopleInput.jsx

```yaml
id: PH-108
category: code
title: Identical block (23 lines) copied between
  src/components/shared/PeopleInput.jsx and
  src/components/shared/PeopleInput.jsx
severity: minor
traffic: 0.07181845123895003
confidence: tool-reported
evidence:
  - src/components/shared/PeopleInput.jsx:81
  - src/components/shared/PeopleInput.jsx:135
source:
  - jscpd
repair_cost: S
kind: duplication
repair: Extract the duplicated block into one shared function and import it from
  both files.
fingerprint: code:src/components/shared/PeopleInput.jsx:dup-src/components/shared/PeopleInput.jsx-23
```

## PH-109 Identical block (8 lines) copied between src/components/timeline/AddEventModal.jsx and src/components/timeline/EditEventModal.jsx

```yaml
id: PH-109
category: code
title: Identical block (8 lines) copied between
  src/components/timeline/AddEventModal.jsx and
  src/components/timeline/EditEventModal.jsx
severity: minor
traffic: 0.2953090369058261
confidence: tool-reported
evidence:
  - src/components/timeline/AddEventModal.jsx:12
  - src/components/timeline/EditEventModal.jsx:20
source:
  - jscpd
repair_cost: S
kind: duplication
repair: Extract the duplicated block into one shared function and import it from
  both files.
fingerprint: code:src/components/timeline/AddEventModal.jsx:dup-src/components/timeline/EditEventModal.jsx-8
```

## PH-110 Identical block (16 lines) copied between src/components/timeline/AddEventModal.jsx and src/components/timeline/EditEventModal.jsx

```yaml
id: PH-110
category: code
title: Identical block (16 lines) copied between
  src/components/timeline/AddEventModal.jsx and
  src/components/timeline/EditEventModal.jsx
severity: minor
traffic: 0.2953090369058261
confidence: tool-reported
evidence:
  - src/components/timeline/AddEventModal.jsx:78
  - src/components/timeline/EditEventModal.jsx:177
source:
  - jscpd
repair_cost: S
kind: duplication
repair: Extract the duplicated block into one shared function and import it from
  both files.
fingerprint: code:src/components/timeline/AddEventModal.jsx:dup-src/components/timeline/EditEventModal.jsx-16
```

## PH-111 Identical block (9 lines) copied between src/components/timeline/GridView.jsx and src/components/timeline/VerticalView.jsx

```yaml
id: PH-111
category: code
title: Identical block (9 lines) copied between
  src/components/timeline/GridView.jsx and
  src/components/timeline/VerticalView.jsx
severity: minor
traffic: 0.4188597992790474
confidence: tool-reported
evidence:
  - src/components/timeline/GridView.jsx:12
  - src/components/timeline/VerticalView.jsx:80
source:
  - jscpd
repair_cost: S
kind: duplication
repair: Extract the duplicated block into one shared function and import it from
  both files.
fingerprint: code:src/components/timeline/GridView.jsx:dup-src/components/timeline/VerticalView.jsx-9
```

## PH-112 Identical block (21 lines) copied between src/components/timeline/GridView.jsx and src/components/timeline/VerticalView.jsx

```yaml
id: PH-112
category: code
title: Identical block (21 lines) copied between
  src/components/timeline/GridView.jsx and
  src/components/timeline/VerticalView.jsx
severity: minor
traffic: 0.4188597992790474
confidence: tool-reported
evidence:
  - src/components/timeline/GridView.jsx:184
  - src/components/timeline/VerticalView.jsx:327
source:
  - jscpd
repair_cost: S
kind: duplication
repair: Extract the duplicated block into one shared function and import it from
  both files.
fingerprint: code:src/components/timeline/GridView.jsx:dup-src/components/timeline/VerticalView.jsx-21
```

## PH-113 Identical block (12 lines) copied between src/components/timeline/GridView.jsx and src/components/timeline/VerticalView.jsx

```yaml
id: PH-113
category: code
title: Identical block (12 lines) copied between
  src/components/timeline/GridView.jsx and
  src/components/timeline/VerticalView.jsx
severity: minor
traffic: 0.4188597992790474
confidence: tool-reported
evidence:
  - src/components/timeline/GridView.jsx:221
  - src/components/timeline/VerticalView.jsx:369
source:
  - jscpd
repair_cost: S
kind: duplication
repair: Extract the duplicated block into one shared function and import it from
  both files.
fingerprint: code:src/components/timeline/GridView.jsx:dup-src/components/timeline/VerticalView.jsx-12
```

## PH-114 Identical block (9 lines) copied between src/components/timeline/HorizontalFilmStrip.jsx and src/components/timeline/HorizontalWave.jsx

```yaml
id: PH-114
category: code
title: Identical block (9 lines) copied between
  src/components/timeline/HorizontalFilmStrip.jsx and
  src/components/timeline/HorizontalWave.jsx
severity: minor
traffic: 0.19242993821823773
confidence: tool-reported
evidence:
  - src/components/timeline/HorizontalFilmStrip.jsx:28
  - src/components/timeline/HorizontalWave.jsx:36
source:
  - jscpd
repair_cost: S
kind: duplication
repair: Extract the duplicated block into one shared function and import it from
  both files.
fingerprint: code:src/components/timeline/HorizontalFilmStrip.jsx:dup-src/components/timeline/HorizontalWave.jsx-9
```

## PH-115 Identical block (13 lines) copied between src/components/timeline/HorizontalFilmStrip.jsx and src/components/timeline/VerticalCinematic.jsx

```yaml
id: PH-115
category: code
title: Identical block (13 lines) copied between
  src/components/timeline/HorizontalFilmStrip.jsx and
  src/components/timeline/VerticalCinematic.jsx
severity: minor
traffic: 0.19242993821823773
confidence: tool-reported
evidence:
  - src/components/timeline/HorizontalFilmStrip.jsx:152
  - src/components/timeline/VerticalCinematic.jsx:99
source:
  - jscpd
repair_cost: S
kind: duplication
repair: Extract the duplicated block into one shared function and import it from
  both files.
fingerprint: code:src/components/timeline/HorizontalFilmStrip.jsx:dup-src/components/timeline/VerticalCinematic.jsx-13
```

## PH-116 Identical block (10 lines) copied between src/components/timeline/HorizontalFilmStrip.jsx and src/components/timeline/HorizontalWave.jsx

```yaml
id: PH-116
category: code
title: Identical block (10 lines) copied between
  src/components/timeline/HorizontalFilmStrip.jsx and
  src/components/timeline/HorizontalWave.jsx
severity: minor
traffic: 0.19242993821823773
confidence: tool-reported
evidence:
  - src/components/timeline/HorizontalFilmStrip.jsx:174
  - src/components/timeline/HorizontalWave.jsx:122
source:
  - jscpd
repair_cost: S
kind: duplication
repair: Extract the duplicated block into one shared function and import it from
  both files.
fingerprint: code:src/components/timeline/HorizontalFilmStrip.jsx:dup-src/components/timeline/HorizontalWave.jsx-10
```

## PH-117 Identical block (7 lines) copied between src/components/timeline/HorizontalFilmStrip.jsx and src/components/timeline/HorizontalPanoramic.jsx

```yaml
id: PH-117
category: code
title: Identical block (7 lines) copied between
  src/components/timeline/HorizontalFilmStrip.jsx and
  src/components/timeline/HorizontalPanoramic.jsx
severity: minor
traffic: 0.19242993821823773
confidence: tool-reported
evidence:
  - src/components/timeline/HorizontalFilmStrip.jsx:209
  - src/components/timeline/HorizontalPanoramic.jsx:197
source:
  - jscpd
repair_cost: S
kind: duplication
repair: Extract the duplicated block into one shared function and import it from
  both files.
fingerprint: code:src/components/timeline/HorizontalFilmStrip.jsx:dup-src/components/timeline/HorizontalPanoramic.jsx-7
```

## PH-118 Identical block (7 lines) copied between src/components/timeline/HorizontalFilmStrip.jsx and src/components/timeline/HorizontalWave.jsx

```yaml
id: PH-118
category: code
title: Identical block (7 lines) copied between
  src/components/timeline/HorizontalFilmStrip.jsx and
  src/components/timeline/HorizontalWave.jsx
severity: minor
traffic: 0.19242993821823773
confidence: tool-reported
evidence:
  - src/components/timeline/HorizontalFilmStrip.jsx:209
  - src/components/timeline/HorizontalWave.jsx:192
source:
  - jscpd
repair_cost: S
kind: duplication
repair: Extract the duplicated block into one shared function and import it from
  both files.
fingerprint: code:src/components/timeline/HorizontalFilmStrip.jsx:dup-src/components/timeline/HorizontalWave.jsx-7
```

## PH-119 Identical block (16 lines) copied between src/components/timeline/HorizontalFilmStrip.jsx and src/components/timeline/HorizontalPanoramic.jsx

```yaml
id: PH-119
category: code
title: Identical block (16 lines) copied between
  src/components/timeline/HorizontalFilmStrip.jsx and
  src/components/timeline/HorizontalPanoramic.jsx
severity: minor
traffic: 0.19242993821823773
confidence: tool-reported
evidence:
  - src/components/timeline/HorizontalFilmStrip.jsx:230
  - src/components/timeline/HorizontalPanoramic.jsx:205
source:
  - jscpd
repair_cost: S
kind: duplication
repair: Extract the duplicated block into one shared function and import it from
  both files.
fingerprint: code:src/components/timeline/HorizontalFilmStrip.jsx:dup-src/components/timeline/HorizontalPanoramic.jsx-16
```

## PH-120 Identical block (16 lines) copied between src/components/timeline/HorizontalFilmStrip.jsx and src/components/timeline/HorizontalView.jsx

```yaml
id: PH-120
category: code
title: Identical block (16 lines) copied between
  src/components/timeline/HorizontalFilmStrip.jsx and
  src/components/timeline/HorizontalView.jsx
severity: minor
traffic: 0.35158351559294687
confidence: tool-reported
evidence:
  - src/components/timeline/HorizontalFilmStrip.jsx:230
  - src/components/timeline/HorizontalView.jsx:235
source:
  - jscpd
repair_cost: S
kind: duplication
repair: Extract the duplicated block into one shared function and import it from
  both files.
fingerprint: code:src/components/timeline/HorizontalFilmStrip.jsx:dup-src/components/timeline/HorizontalView.jsx-16
```

## PH-121 Identical block (16 lines) copied between src/components/timeline/HorizontalFilmStrip.jsx and src/components/timeline/HorizontalWave.jsx

```yaml
id: PH-121
category: code
title: Identical block (16 lines) copied between
  src/components/timeline/HorizontalFilmStrip.jsx and
  src/components/timeline/HorizontalWave.jsx
severity: minor
traffic: 0.19242993821823773
confidence: tool-reported
evidence:
  - src/components/timeline/HorizontalFilmStrip.jsx:230
  - src/components/timeline/HorizontalWave.jsx:197
source:
  - jscpd
repair_cost: S
kind: duplication
repair: Extract the duplicated block into one shared function and import it from
  both files.
fingerprint: code:src/components/timeline/HorizontalFilmStrip.jsx:dup-src/components/timeline/HorizontalWave.jsx-16
```

## PH-122 Identical block (18 lines) copied between src/components/timeline/HorizontalPanoramic.jsx and src/components/timeline/HorizontalWave.jsx

```yaml
id: PH-122
category: code
title: Identical block (18 lines) copied between
  src/components/timeline/HorizontalPanoramic.jsx and
  src/components/timeline/HorizontalWave.jsx
severity: minor
traffic: 0.17053956872507722
confidence: tool-reported
evidence:
  - src/components/timeline/HorizontalPanoramic.jsx:1
  - src/components/timeline/HorizontalWave.jsx:1
source:
  - jscpd
repair_cost: S
kind: duplication
repair: Extract the duplicated block into one shared function and import it from
  both files.
fingerprint: code:src/components/timeline/HorizontalPanoramic.jsx:dup-src/components/timeline/HorizontalWave.jsx-18
```

## PH-123 Identical block (11 lines) copied between src/components/timeline/HorizontalPanoramic.jsx and src/components/timeline/HorizontalWave.jsx

```yaml
id: PH-123
category: code
title: Identical block (11 lines) copied between
  src/components/timeline/HorizontalPanoramic.jsx and
  src/components/timeline/HorizontalWave.jsx
severity: minor
traffic: 0.17053956872507722
confidence: tool-reported
evidence:
  - src/components/timeline/HorizontalPanoramic.jsx:71
  - src/components/timeline/HorizontalWave.jsx:58
source:
  - jscpd
repair_cost: S
kind: duplication
repair: Extract the duplicated block into one shared function and import it from
  both files.
fingerprint: code:src/components/timeline/HorizontalPanoramic.jsx:dup-src/components/timeline/HorizontalWave.jsx-11
```

## PH-124 Identical block (8 lines) copied between src/components/timeline/HorizontalPanoramic.jsx and src/components/timeline/HorizontalWave.jsx

```yaml
id: PH-124
category: code
title: Identical block (8 lines) copied between
  src/components/timeline/HorizontalPanoramic.jsx and
  src/components/timeline/HorizontalWave.jsx
severity: minor
traffic: 0.17053956872507722
confidence: tool-reported
evidence:
  - src/components/timeline/HorizontalPanoramic.jsx:117
  - src/components/timeline/HorizontalWave.jsx:91
source:
  - jscpd
repair_cost: S
kind: duplication
repair: Extract the duplicated block into one shared function and import it from
  both files.
fingerprint: code:src/components/timeline/HorizontalPanoramic.jsx:dup-src/components/timeline/HorizontalWave.jsx-8
```

## PH-125 Identical block (17 lines) copied between src/components/timeline/HorizontalPanoramic.jsx and src/components/timeline/HorizontalWave.jsx

```yaml
id: PH-125
category: code
title: Identical block (17 lines) copied between
  src/components/timeline/HorizontalPanoramic.jsx and
  src/components/timeline/HorizontalWave.jsx
severity: minor
traffic: 0.17053956872507722
confidence: tool-reported
evidence:
  - src/components/timeline/HorizontalPanoramic.jsx:126
  - src/components/timeline/HorizontalWave.jsx:105
source:
  - jscpd
repair_cost: S
kind: duplication
repair: Extract the duplicated block into one shared function and import it from
  both files.
fingerprint: code:src/components/timeline/HorizontalPanoramic.jsx:dup-src/components/timeline/HorizontalWave.jsx-17
```

## PH-126 Identical block (29 lines) copied between src/components/timeline/HorizontalPanoramic.jsx and src/components/timeline/HorizontalWave.jsx

```yaml
id: PH-126
category: code
title: Identical block (29 lines) copied between
  src/components/timeline/HorizontalPanoramic.jsx and
  src/components/timeline/HorizontalWave.jsx
severity: minor
traffic: 0.17053956872507722
confidence: tool-reported
evidence:
  - src/components/timeline/HorizontalPanoramic.jsx:146
  - src/components/timeline/HorizontalWave.jsx:125
source:
  - jscpd
repair_cost: S
kind: duplication
repair: Extract the duplicated block into one shared function and import it from
  both files.
fingerprint: code:src/components/timeline/HorizontalPanoramic.jsx:dup-src/components/timeline/HorizontalWave.jsx-29
```

## PH-127 Identical block (7 lines) copied between src/components/timeline/HorizontalPanoramic.jsx and src/components/timeline/HorizontalView.jsx

```yaml
id: PH-127
category: code
title: Identical block (7 lines) copied between
  src/components/timeline/HorizontalPanoramic.jsx and
  src/components/timeline/HorizontalView.jsx
severity: minor
traffic: 0.35158351559294687
confidence: tool-reported
evidence:
  - src/components/timeline/HorizontalPanoramic.jsx:153
  - src/components/timeline/HorizontalView.jsx:65
source:
  - jscpd
repair_cost: S
kind: duplication
repair: Extract the duplicated block into one shared function and import it from
  both files.
fingerprint: code:src/components/timeline/HorizontalPanoramic.jsx:dup-src/components/timeline/HorizontalView.jsx-7
```

## PH-128 Identical block (8 lines) copied between src/components/timeline/HorizontalPanoramic.jsx and src/components/timeline/HorizontalView.jsx

```yaml
id: PH-128
category: code
title: Identical block (8 lines) copied between
  src/components/timeline/HorizontalPanoramic.jsx and
  src/components/timeline/HorizontalView.jsx
severity: minor
traffic: 0.35158351559294687
confidence: tool-reported
evidence:
  - src/components/timeline/HorizontalPanoramic.jsx:174
  - src/components/timeline/HorizontalView.jsx:192
source:
  - jscpd
repair_cost: S
kind: duplication
repair: Extract the duplicated block into one shared function and import it from
  both files.
fingerprint: code:src/components/timeline/HorizontalPanoramic.jsx:dup-src/components/timeline/HorizontalView.jsx-8
```

## PH-129 Identical block (11 lines) copied between src/components/timeline/HorizontalPanoramic.jsx and src/components/timeline/HorizontalView.jsx

```yaml
id: PH-129
category: code
title: Identical block (11 lines) copied between
  src/components/timeline/HorizontalPanoramic.jsx and
  src/components/timeline/HorizontalView.jsx
severity: minor
traffic: 0.35158351559294687
confidence: tool-reported
evidence:
  - src/components/timeline/HorizontalPanoramic.jsx:212
  - src/components/timeline/HorizontalView.jsx:242
source:
  - jscpd
repair_cost: S
kind: duplication
repair: Extract the duplicated block into one shared function and import it from
  both files.
fingerprint: code:src/components/timeline/HorizontalPanoramic.jsx:dup-src/components/timeline/HorizontalView.jsx-11
```

## PH-130 Identical block (11 lines) copied between src/components/timeline/HorizontalPanoramic.jsx and src/components/timeline/HorizontalWave.jsx

```yaml
id: PH-130
category: code
title: Identical block (11 lines) copied between
  src/components/timeline/HorizontalPanoramic.jsx and
  src/components/timeline/HorizontalWave.jsx
severity: minor
traffic: 0.17053956872507722
confidence: tool-reported
evidence:
  - src/components/timeline/HorizontalPanoramic.jsx:212
  - src/components/timeline/HorizontalWave.jsx:204
source:
  - jscpd
repair_cost: S
kind: duplication
repair: Extract the duplicated block into one shared function and import it from
  both files.
fingerprint: code:src/components/timeline/HorizontalPanoramic.jsx:dup-src/components/timeline/HorizontalWave.jsx-11
```

## PH-131 Identical block (11 lines) copied between src/components/timeline/HorizontalPanoramic.jsx and src/components/timeline/HorizontalWave.jsx

```yaml
id: PH-131
category: code
title: Identical block (11 lines) copied between
  src/components/timeline/HorizontalPanoramic.jsx and
  src/components/timeline/HorizontalWave.jsx
severity: minor
traffic: 0.17053956872507722
confidence: tool-reported
evidence:
  - src/components/timeline/HorizontalPanoramic.jsx:309
  - src/components/timeline/HorizontalWave.jsx:288
source:
  - jscpd
repair_cost: S
kind: duplication
repair: Extract the duplicated block into one shared function and import it from
  both files.
fingerprint: code:src/components/timeline/HorizontalPanoramic.jsx:dup-src/components/timeline/HorizontalWave.jsx-11
```

## PH-132 Identical block (8 lines) copied between src/components/timeline/ImportMenu.jsx and src/components/timeline/ImportMenu.jsx

```yaml
id: PH-132
category: code
title: Identical block (8 lines) copied between
  src/components/timeline/ImportMenu.jsx and
  src/components/timeline/ImportMenu.jsx
severity: minor
traffic: 0.12904779956476028
confidence: tool-reported
evidence:
  - src/components/timeline/ImportMenu.jsx:11
  - src/components/timeline/ImportMenu.jsx:53
source:
  - jscpd
repair_cost: S
kind: duplication
repair: Extract the duplicated block into one shared function and import it from
  both files.
fingerprint: code:src/components/timeline/ImportMenu.jsx:dup-src/components/timeline/ImportMenu.jsx-8
```

## PH-133 Identical block (8 lines) copied between src/components/timeline/MapView.jsx and src/components/timeline/MapView.jsx

```yaml
id: PH-133
category: code
title: Identical block (8 lines) copied between
  src/components/timeline/MapView.jsx and src/components/timeline/MapView.jsx
severity: minor
traffic: 0.1563712816041086
confidence: tool-reported
evidence:
  - src/components/timeline/MapView.jsx:128
  - src/components/timeline/MapView.jsx:148
source:
  - jscpd
repair_cost: S
kind: duplication
repair: Extract the duplicated block into one shared function and import it from
  both files.
fingerprint: code:src/components/timeline/MapView.jsx:dup-src/components/timeline/MapView.jsx-8
```

## PH-134 Identical block (6 lines) copied between src/components/timeline/TimelineToolbar.jsx and src/components/timeline/TimelineToolbar.jsx

```yaml
id: PH-134
category: code
title: Identical block (6 lines) copied between
  src/components/timeline/TimelineToolbar.jsx and
  src/components/timeline/TimelineToolbar.jsx
severity: minor
traffic: 0.47761948749057187
confidence: tool-reported
evidence:
  - src/components/timeline/TimelineToolbar.jsx:173
  - src/components/timeline/TimelineToolbar.jsx:405
source:
  - jscpd
repair_cost: S
kind: duplication
repair: Extract the duplicated block into one shared function and import it from
  both files.
fingerprint: code:src/components/timeline/TimelineToolbar.jsx:dup-src/components/timeline/TimelineToolbar.jsx-6
```

## PH-135 Identical block (10 lines) copied between src/components/timeline/VerticalCinematic.jsx and src/components/timeline/VerticalMagazine.jsx

```yaml
id: PH-135
category: code
title: Identical block (10 lines) copied between
  src/components/timeline/VerticalCinematic.jsx and
  src/components/timeline/VerticalMagazine.jsx
severity: minor
traffic: 0.13051402658105676
confidence: tool-reported
evidence:
  - src/components/timeline/VerticalCinematic.jsx:1
  - src/components/timeline/VerticalMagazine.jsx:1
source:
  - jscpd
repair_cost: S
kind: duplication
repair: Extract the duplicated block into one shared function and import it from
  both files.
fingerprint: code:src/components/timeline/VerticalCinematic.jsx:dup-src/components/timeline/VerticalMagazine.jsx-10
```

## PH-136 Identical block (12 lines) copied between src/components/timeline/VerticalCinematic.jsx and src/components/timeline/VerticalNarrative.jsx

```yaml
id: PH-136
category: code
title: Identical block (12 lines) copied between
  src/components/timeline/VerticalCinematic.jsx and
  src/components/timeline/VerticalNarrative.jsx
severity: minor
traffic: 0.13051402658105676
confidence: tool-reported
evidence:
  - src/components/timeline/VerticalCinematic.jsx:1
  - src/components/timeline/VerticalNarrative.jsx:1
source:
  - jscpd
repair_cost: S
kind: duplication
repair: Extract the duplicated block into one shared function and import it from
  both files.
fingerprint: code:src/components/timeline/VerticalCinematic.jsx:dup-src/components/timeline/VerticalNarrative.jsx-12
```

## PH-137 Identical block (11 lines) copied between src/components/timeline/VerticalCinematic.jsx and src/components/timeline/VerticalMagazine.jsx

```yaml
id: PH-137
category: code
title: Identical block (11 lines) copied between
  src/components/timeline/VerticalCinematic.jsx and
  src/components/timeline/VerticalMagazine.jsx
severity: minor
traffic: 0.13051402658105676
confidence: tool-reported
evidence:
  - src/components/timeline/VerticalCinematic.jsx:12
  - src/components/timeline/VerticalMagazine.jsx:14
source:
  - jscpd
repair_cost: S
kind: duplication
repair: Extract the duplicated block into one shared function and import it from
  both files.
fingerprint: code:src/components/timeline/VerticalCinematic.jsx:dup-src/components/timeline/VerticalMagazine.jsx-11
```

## PH-138 Identical block (11 lines) copied between src/components/timeline/VerticalCinematic.jsx and src/components/timeline/VerticalMagazine.jsx

```yaml
id: PH-138
category: code
title: Identical block (11 lines) copied between
  src/components/timeline/VerticalCinematic.jsx and
  src/components/timeline/VerticalMagazine.jsx
severity: minor
traffic: 0.13051402658105676
confidence: tool-reported
evidence:
  - src/components/timeline/VerticalCinematic.jsx:161
  - src/components/timeline/VerticalMagazine.jsx:222
source:
  - jscpd
repair_cost: S
kind: duplication
repair: Extract the duplicated block into one shared function and import it from
  both files.
fingerprint: code:src/components/timeline/VerticalCinematic.jsx:dup-src/components/timeline/VerticalMagazine.jsx-11
```

## PH-139 Identical block (8 lines) copied between src/components/timeline/VerticalCinematic.jsx and src/components/timeline/VerticalNarrative.jsx

```yaml
id: PH-139
category: code
title: Identical block (8 lines) copied between
  src/components/timeline/VerticalCinematic.jsx and
  src/components/timeline/VerticalNarrative.jsx
severity: minor
traffic: 0.13051402658105676
confidence: tool-reported
evidence:
  - src/components/timeline/VerticalCinematic.jsx:161
  - src/components/timeline/VerticalNarrative.jsx:194
source:
  - jscpd
repair_cost: S
kind: duplication
repair: Extract the duplicated block into one shared function and import it from
  both files.
fingerprint: code:src/components/timeline/VerticalCinematic.jsx:dup-src/components/timeline/VerticalNarrative.jsx-8
```

## PH-140 Identical block (11 lines) copied between src/components/timeline/VerticalMagazine.jsx and src/components/timeline/VerticalMagazine.jsx

```yaml
id: PH-140
category: code
title: Identical block (11 lines) copied between
  src/components/timeline/VerticalMagazine.jsx and
  src/components/timeline/VerticalMagazine.jsx
severity: minor
traffic: 0.12200538192919079
confidence: tool-reported
evidence:
  - src/components/timeline/VerticalMagazine.jsx:14
  - src/components/timeline/VerticalMagazine.jsx:141
source:
  - jscpd
repair_cost: S
kind: duplication
repair: Extract the duplicated block into one shared function and import it from
  both files.
fingerprint: code:src/components/timeline/VerticalMagazine.jsx:dup-src/components/timeline/VerticalMagazine.jsx-11
```

## PH-141 Identical block (14 lines) copied between src/components/timeline/VerticalView.jsx and src/components/timeline/VerticalView.jsx

```yaml
id: PH-141
category: code
title: Identical block (14 lines) copied between
  src/components/timeline/VerticalView.jsx and
  src/components/timeline/VerticalView.jsx
severity: minor
traffic: 0.4188597992790474
confidence: tool-reported
evidence:
  - src/components/timeline/VerticalView.jsx:285
  - src/components/timeline/VerticalView.jsx:397
source:
  - jscpd
repair_cost: S
kind: duplication
repair: Extract the duplicated block into one shared function and import it from
  both files.
fingerprint: code:src/components/timeline/VerticalView.jsx:dup-src/components/timeline/VerticalView.jsx-14
```

## PH-142 Identical block (10 lines) copied between src/index.css and src/index.css

```yaml
id: PH-142
category: code
title: Identical block (10 lines) copied between src/index.css and src/index.css
severity: minor
traffic: 0.7988072644356804
confidence: tool-reported
evidence:
  - src/index.css:930
  - src/index.css:941
source:
  - jscpd
repair_cost: S
kind: duplication
repair: Extract the duplicated block into one shared function and import it from
  both files.
fingerprint: code:src/index.css:dup-src/index.css-10
```

## PH-143 Identical block (6 lines) copied between src/store/__tests__/timelinesSlice.test.js and src/store/__tests__/timelinesSlice.test.js

```yaml
id: PH-143
category: code
title: Identical block (6 lines) copied between
  src/store/__tests__/timelinesSlice.test.js and
  src/store/__tests__/timelinesSlice.test.js
severity: minor
traffic: 0.02124313771490268
confidence: tool-reported
evidence:
  - src/store/__tests__/timelinesSlice.test.js:83
  - src/store/__tests__/timelinesSlice.test.js:106
source:
  - jscpd
repair_cost: S
kind: duplication
repair: Extract the duplicated block into one shared function and import it from
  both files.
fingerprint: code:src/store/__tests__/timelinesSlice.test.js:dup-src/store/__tests__/timelinesSlice.test.js-6
```

## PH-144 Identical block (11 lines) copied between src/utils/importHelpers.js and src/workers/importWorker.js

```yaml
id: PH-144
category: code
title: Identical block (11 lines) copied between src/utils/importHelpers.js and
  src/workers/importWorker.js
severity: minor
traffic: 0.09091787210140102
confidence: tool-reported
evidence:
  - src/utils/importHelpers.js:9
  - src/workers/importWorker.js:34
source:
  - jscpd
repair_cost: S
kind: duplication
repair: Extract the duplicated block into one shared function and import it from
  both files.
fingerprint: code:src/utils/importHelpers.js:dup-src/workers/importWorker.js-11
```

## PH-145 Identical block (7 lines) copied between src/utils/importHelpers.js and src/workers/importWorker.js

```yaml
id: PH-145
category: code
title: Identical block (7 lines) copied between src/utils/importHelpers.js and
  src/workers/importWorker.js
severity: minor
traffic: 0.09091787210140102
confidence: tool-reported
evidence:
  - src/utils/importHelpers.js:28
  - src/workers/importWorker.js:103
source:
  - jscpd
repair_cost: S
kind: duplication
repair: Extract the duplicated block into one shared function and import it from
  both files.
fingerprint: code:src/utils/importHelpers.js:dup-src/workers/importWorker.js-7
```

## PH-146 Identical block (9 lines) copied between src/utils/importHelpers.js and src/workers/importWorker.js

```yaml
id: PH-146
category: code
title: Identical block (9 lines) copied between src/utils/importHelpers.js and
  src/workers/importWorker.js
severity: minor
traffic: 0.09091787210140102
confidence: tool-reported
evidence:
  - src/utils/importHelpers.js:34
  - src/workers/importWorker.js:109
source:
  - jscpd
repair_cost: S
kind: duplication
repair: Extract the duplicated block into one shared function and import it from
  both files.
fingerprint: code:src/utils/importHelpers.js:dup-src/workers/importWorker.js-9
```

## PH-147 Identical block (14 lines) copied between src/utils/importHelpers.js and src/workers/importWorker.js

```yaml
id: PH-147
category: code
title: Identical block (14 lines) copied between src/utils/importHelpers.js and
  src/workers/importWorker.js
severity: minor
traffic: 0.09091787210140102
confidence: tool-reported
evidence:
  - src/utils/importHelpers.js:114
  - src/workers/importWorker.js:150
source:
  - jscpd
repair_cost: S
kind: duplication
repair: Extract the duplicated block into one shared function and import it from
  both files.
fingerprint: code:src/utils/importHelpers.js:dup-src/workers/importWorker.js-14
```

## PH-148 Identical block (16 lines) copied between src/utils/importHelpers.js and src/workers/importWorker.js

```yaml
id: PH-148
category: code
title: Identical block (16 lines) copied between src/utils/importHelpers.js and
  src/workers/importWorker.js
severity: minor
traffic: 0.09091787210140102
confidence: tool-reported
evidence:
  - src/utils/importHelpers.js:223
  - src/workers/importWorker.js:212
source:
  - jscpd
repair_cost: S
kind: duplication
repair: Extract the duplicated block into one shared function and import it from
  both files.
fingerprint: code:src/utils/importHelpers.js:dup-src/workers/importWorker.js-16
```

## PH-149 Hard-to-maintain code: handler has cyclomatic complexity 15 (api/og.js)

```yaml
id: PH-149
category: code
title: "Hard-to-maintain code: handler has cyclomatic complexity 15 (api/og.js)"
severity: major
traffic: 0.07425741642703756
confidence: tool-reported
evidence:
  - api/og.js:1
source:
  - repowise
repair_cost: M
kind: terrible
repair: "Refactor: split the function and flatten the nesting until it reads top
  to bottom."
fingerprint: code:api/og.js:rw-complex-method-handler
partial: true
```

## PH-150 Hard-to-maintain code: handleGet has cyclomatic complexity 15 (api/share.js)

```yaml
id: PH-150
category: code
title: "Hard-to-maintain code: handleGet has cyclomatic complexity 15 (api/share.js)"
severity: major
traffic: 0.2509477199194409
confidence: tool-reported
evidence:
  - api/share.js:1
source:
  - repowise
repair_cost: M
kind: terrible
repair: "Refactor: split the function and flatten the nesting until it reads top
  to bottom."
fingerprint: code:api/share.js:rw-complex-method-handleGet
partial: true
```

## PH-151 Hard-to-maintain code: FilterChips has cyclomatic complexity 23 (src/components/filters/FilterChips.jsx)

```yaml
id: PH-151
category: code
title: "Hard-to-maintain code: FilterChips has cyclomatic complexity 23
  (src/components/filters/FilterChips.jsx)"
severity: major
traffic: 0.03843795880448429
confidence: tool-reported
evidence:
  - src/components/filters/FilterChips.jsx:1
source:
  - repowise
repair_cost: M
kind: terrible
repair: "Refactor: split the function and flatten the nesting until it reads top
  to bottom."
fingerprint: code:src/components/filters/FilterChips.jsx:rw-complex-method-FilterChips
partial: true
```

## PH-152 Hard-to-maintain code: FilterChips is 154 lines long (src/components/filters/FilterChips.jsx)

```yaml
id: PH-152
category: code
title: "Hard-to-maintain code: FilterChips is 154 lines long
  (src/components/filters/FilterChips.jsx)"
severity: major
traffic: 0.03843795880448429
confidence: tool-reported
evidence:
  - src/components/filters/FilterChips.jsx:1
source:
  - repowise
repair_cost: M
kind: terrible
repair: "Refactor: split the function and flatten the nesting until it reads top
  to bottom."
fingerprint: code:src/components/filters/FilterChips.jsx:rw-large-method-FilterChips
partial: true
```

## PH-153 Hard-to-maintain code: MultiSelect has been modified across 10 commits (repo p80=3) and carries CCN=22 / nesting=1 (src/components/filters/MultiSelect.jsx)

```yaml
id: PH-153
category: code
title: "Hard-to-maintain code: MultiSelect has been modified across 10 commits
  (repo p80=3) and carries CCN=22 / nesting=1
  (src/components/filters/MultiSelect.jsx)"
severity: major
traffic: 0.16379004172754474
confidence: tool-reported
evidence:
  - src/components/filters/MultiSelect.jsx:1
source:
  - repowise
repair_cost: M
kind: terrible
repair: "Refactor: split the function and flatten the nesting until it reads top
  to bottom."
fingerprint: code:src/components/filters/MultiSelect.jsx:rw-function-hotspot-MultiSelect
partial: true
```

## PH-154 Hard-to-maintain code: MultiSelect is 124 lines long (src/components/filters/MultiSelect.jsx)

```yaml
id: PH-154
category: code
title: "Hard-to-maintain code: MultiSelect is 124 lines long
  (src/components/filters/MultiSelect.jsx)"
severity: major
traffic: 0.16379004172754474
confidence: tool-reported
evidence:
  - src/components/filters/MultiSelect.jsx:1
source:
  - repowise
repair_cost: M
kind: terrible
repair: "Refactor: split the function and flatten the nesting until it reads top
  to bottom."
fingerprint: code:src/components/filters/MultiSelect.jsx:rw-large-method-MultiSelect
partial: true
```

## PH-155 Hard-to-maintain code: SearchInput has been modified across 9 commits (repo p80=3) and carries CCN=18 / nesting=2 (src/components/filters/SearchInput.jsx)

```yaml
id: PH-155
category: code
title: "Hard-to-maintain code: SearchInput has been modified across 9 commits
  (repo p80=3) and carries CCN=18 / nesting=2
  (src/components/filters/SearchInput.jsx)"
severity: major
traffic: 0.17241089636722548
confidence: tool-reported
evidence:
  - src/components/filters/SearchInput.jsx:1
source:
  - repowise
repair_cost: M
kind: terrible
repair: "Refactor: split the function and flatten the nesting until it reads top
  to bottom."
fingerprint: code:src/components/filters/SearchInput.jsx:rw-function-hotspot-SearchInput
partial: true
```

## PH-156 Hard-to-maintain code: SearchInput is 144 lines long (src/components/filters/SearchInput.jsx)

```yaml
id: PH-156
category: code
title: "Hard-to-maintain code: SearchInput is 144 lines long
  (src/components/filters/SearchInput.jsx)"
severity: major
traffic: 0.17241089636722548
confidence: tool-reported
evidence:
  - src/components/filters/SearchInput.jsx:1
source:
  - repowise
repair_cost: M
kind: terrible
repair: "Refactor: split the function and flatten the nesting until it reads top
  to bottom."
fingerprint: code:src/components/filters/SearchInput.jsx:rw-large-method-SearchInput
partial: true
```

## PH-157 Hard-to-maintain code: TextInput has cyclomatic complexity 15 (src/components/input/TextInput.jsx)

```yaml
id: PH-157
category: code
title: "Hard-to-maintain code: TextInput has cyclomatic complexity 15
  (src/components/input/TextInput.jsx)"
severity: major
traffic: 0.09579874692302486
confidence: tool-reported
evidence:
  - src/components/input/TextInput.jsx:1
source:
  - repowise
repair_cost: M
kind: terrible
repair: "Refactor: split the function and flatten the nesting until it reads top
  to bottom."
fingerprint: code:src/components/input/TextInput.jsx:rw-complex-method-TextInput
partial: true
```

## PH-158 Hard-to-maintain code: TextInput has been modified across 9 commits (repo p80=3) and carries CCN=15 / nesting=1 (src/components/input/TextInput.jsx)

```yaml
id: PH-158
category: code
title: "Hard-to-maintain code: TextInput has been modified across 9 commits
  (repo p80=3) and carries CCN=15 / nesting=1
  (src/components/input/TextInput.jsx)"
severity: major
traffic: 0.09579874692302486
confidence: tool-reported
evidence:
  - src/components/input/TextInput.jsx:1
source:
  - repowise
repair_cost: M
kind: terrible
repair: "Refactor: split the function and flatten the nesting until it reads top
  to bottom."
fingerprint: code:src/components/input/TextInput.jsx:rw-function-hotspot-TextInput
partial: true
```

## PH-159 Hard-to-maintain code: ShareSection has been modified across 7 commits (repo p80=3) and carries CCN=18 / nesting=3 (src/components/layout/ExportModal.jsx)

```yaml
id: PH-159
category: code
title: "Hard-to-maintain code: ShareSection has been modified across 7 commits
  (repo p80=3) and carries CCN=18 / nesting=3
  (src/components/layout/ExportModal.jsx)"
severity: major
traffic: 0.2213008423929126
confidence: tool-reported
evidence:
  - src/components/layout/ExportModal.jsx:1
source:
  - repowise
repair_cost: M
kind: terrible
repair: "Refactor: split the function and flatten the nesting until it reads top
  to bottom."
fingerprint: code:src/components/layout/ExportModal.jsx:rw-function-hotspot-ShareSection
partial: true
```

## PH-160 Hard-to-maintain code: Sidebar is 149 lines long (src/components/layout/Sidebar.jsx)

```yaml
id: PH-160
category: code
title: "Hard-to-maintain code: Sidebar is 149 lines long
  (src/components/layout/Sidebar.jsx)"
severity: major
traffic: 0.5125840063161025
confidence: tool-reported
evidence:
  - src/components/layout/Sidebar.jsx:1
source:
  - repowise
repair_cost: M
kind: terrible
repair: "Refactor: split the function and flatten the nesting until it reads top
  to bottom."
fingerprint: code:src/components/layout/Sidebar.jsx:rw-large-method-Sidebar
partial: true
```

## PH-161 Hard-to-maintain code: Badge has cyclomatic complexity 16 (src/components/shared/Badge.jsx)

```yaml
id: PH-161
category: code
title: "Hard-to-maintain code: Badge has cyclomatic complexity 16
  (src/components/shared/Badge.jsx)"
severity: major
traffic: 0.12766327377943257
confidence: tool-reported
evidence:
  - src/components/shared/Badge.jsx:1
source:
  - repowise
repair_cost: M
kind: terrible
repair: "Refactor: split the function and flatten the nesting until it reads top
  to bottom."
fingerprint: code:src/components/shared/Badge.jsx:rw-complex-method-Badge
partial: true
```

## PH-162 Hard-to-maintain code: Badge has been modified across 7 commits (repo p80=3) and carries CCN=16 / nesting=2 (src/components/shared/Badge.jsx)

```yaml
id: PH-162
category: code
title: "Hard-to-maintain code: Badge has been modified across 7 commits (repo
  p80=3) and carries CCN=16 / nesting=2 (src/components/shared/Badge.jsx)"
severity: major
traffic: 0.12766327377943257
confidence: tool-reported
evidence:
  - src/components/shared/Badge.jsx:1
source:
  - repowise
repair_cost: M
kind: terrible
repair: "Refactor: split the function and flatten the nesting until it reads top
  to bottom."
fingerprint: code:src/components/shared/Badge.jsx:rw-function-hotspot-Badge
partial: true
```

## PH-163 Hard-to-maintain code: EventFormFields has been modified across 5 commits (repo p80=3) and carries CCN=16 / nesting=0 (src/components/shared/EventFormFields.jsx)

```yaml
id: PH-163
category: code
title: "Hard-to-maintain code: EventFormFields has been modified across 5
  commits (repo p80=3) and carries CCN=16 / nesting=0
  (src/components/shared/EventFormFields.jsx)"
severity: major
traffic: 0.204745034856091
confidence: tool-reported
evidence:
  - src/components/shared/EventFormFields.jsx:1
source:
  - repowise
repair_cost: M
kind: terrible
repair: "Refactor: split the function and flatten the nesting until it reads top
  to bottom."
fingerprint: code:src/components/shared/EventFormFields.jsx:rw-function-hotspot-EventFormFields
partial: true
```

## PH-164 Hard-to-maintain code: LocationInput has been modified across 8 commits (repo p80=3) and carries CCN=44 / nesting=2 (src/components/shared/LocationInput.jsx)

```yaml
id: PH-164
category: code
title: "Hard-to-maintain code: LocationInput has been modified across 8 commits
  (repo p80=3) and carries CCN=44 / nesting=2
  (src/components/shared/LocationInput.jsx)"
severity: major
traffic: 0.10626962583365701
confidence: tool-reported
evidence:
  - src/components/shared/LocationInput.jsx:1
source:
  - repowise
repair_cost: M
kind: terrible
repair: "Refactor: split the function and flatten the nesting until it reads top
  to bottom."
fingerprint: code:src/components/shared/LocationInput.jsx:rw-function-hotspot-LocationInput
partial: true
```

## PH-165 Hard-to-maintain code: PhotoLightbox has been modified across 10 commits (repo p80=3) and carries CCN=14 / nesting=1 (src/components/shared/PhotoLightbox.jsx)

```yaml
id: PH-165
category: code
title: "Hard-to-maintain code: PhotoLightbox has been modified across 10 commits
  (repo p80=3) and carries CCN=14 / nesting=1
  (src/components/shared/PhotoLightbox.jsx)"
severity: major
traffic: 0.08855530761062455
confidence: tool-reported
evidence:
  - src/components/shared/PhotoLightbox.jsx:1
source:
  - repowise
repair_cost: M
kind: terrible
repair: "Refactor: split the function and flatten the nesting until it reads top
  to bottom."
fingerprint: code:src/components/shared/PhotoLightbox.jsx:rw-function-hotspot-PhotoLightbox
partial: true
```

## PH-166 Hard-to-maintain code: TagPicker is 120 lines long (src/components/shared/TagPicker.jsx)

```yaml
id: PH-166
category: code
title: "Hard-to-maintain code: TagPicker is 120 lines long
  (src/components/shared/TagPicker.jsx)"
severity: major
traffic: 0.0384435544129707
confidence: tool-reported
evidence:
  - src/components/shared/TagPicker.jsx:1
source:
  - repowise
repair_cost: M
kind: terrible
repair: "Refactor: split the function and flatten the nesting until it reads top
  to bottom."
fingerprint: code:src/components/shared/TagPicker.jsx:rw-large-method-TagPicker
partial: true
```

## PH-167 Hard-to-maintain code: BatchActionBar has been modified across 13 commits (repo p80=3) and carries CCN=29 / nesting=1 (src/components/timeline/BatchActionBar.jsx)

```yaml
id: PH-167
category: code
title: "Hard-to-maintain code: BatchActionBar has been modified across 13
  commits (repo p80=3) and carries CCN=29 / nesting=1
  (src/components/timeline/BatchActionBar.jsx)"
severity: major
traffic: 0.2507897448871652
confidence: tool-reported
evidence:
  - src/components/timeline/BatchActionBar.jsx:1
source:
  - repowise
repair_cost: M
kind: terrible
repair: "Refactor: split the function and flatten the nesting until it reads top
  to bottom."
fingerprint: code:src/components/timeline/BatchActionBar.jsx:rw-function-hotspot-BatchActionBar
partial: true
```

## PH-168 Hard-to-maintain code: EventPhotoUploader has been modified across 7 commits (repo p80=3) and carries CCN=24 / nesting=3 (src/components/timeline/EventPhotoUploader.jsx)

```yaml
id: PH-168
category: code
title: "Hard-to-maintain code: EventPhotoUploader has been modified across 7
  commits (repo p80=3) and carries CCN=24 / nesting=3
  (src/components/timeline/EventPhotoUploader.jsx)"
severity: major
traffic: 0.07509467384231483
confidence: tool-reported
evidence:
  - src/components/timeline/EventPhotoUploader.jsx:1
source:
  - repowise
repair_cost: M
kind: terrible
repair: "Refactor: split the function and flatten the nesting until it reads top
  to bottom."
fingerprint: code:src/components/timeline/EventPhotoUploader.jsx:rw-function-hotspot-EventPhotoUploader
partial: true
```

## PH-169 Hard-to-maintain code: EventPhotoUploader is 190 lines long (src/components/timeline/EventPhotoUploader.jsx)

```yaml
id: PH-169
category: code
title: "Hard-to-maintain code: EventPhotoUploader is 190 lines long
  (src/components/timeline/EventPhotoUploader.jsx)"
severity: major
traffic: 0.07509467384231483
confidence: tool-reported
evidence:
  - src/components/timeline/EventPhotoUploader.jsx:1
source:
  - repowise
repair_cost: M
kind: terrible
repair: "Refactor: split the function and flatten the nesting until it reads top
  to bottom."
fingerprint: code:src/components/timeline/EventPhotoUploader.jsx:rw-large-method-EventPhotoUploader
partial: true
```

## PH-170 Hard-to-maintain code: FileImportContent is 128 lines long (src/components/timeline/FileImportContent.jsx)

```yaml
id: PH-170
category: code
title: "Hard-to-maintain code: FileImportContent is 128 lines long
  (src/components/timeline/FileImportContent.jsx)"
severity: major
traffic: 0.007399677487331264
confidence: tool-reported
evidence:
  - src/components/timeline/FileImportContent.jsx:1
source:
  - repowise
repair_cost: M
kind: terrible
repair: "Refactor: split the function and flatten the nesting until it reads top
  to bottom."
fingerprint: code:src/components/timeline/FileImportContent.jsx:rw-large-method-FileImportContent
partial: true
```

## PH-171 Hard-to-maintain code: FilterEmptyState has cyclomatic complexity 19 (src/components/timeline/FilterEmptyState.jsx)

```yaml
id: PH-171
category: code
title: "Hard-to-maintain code: FilterEmptyState has cyclomatic complexity 19
  (src/components/timeline/FilterEmptyState.jsx)"
severity: major
traffic: 0.06848178823921588
confidence: tool-reported
evidence:
  - src/components/timeline/FilterEmptyState.jsx:1
source:
  - repowise
repair_cost: M
kind: terrible
repair: "Refactor: split the function and flatten the nesting until it reads top
  to bottom."
fingerprint: code:src/components/timeline/FilterEmptyState.jsx:rw-complex-method-FilterEmptyState
partial: true
```

## PH-172 Hard-to-maintain code: GraphView has been modified across 13 commits (repo p80=3) and carries CCN=64 / nesting=4 (src/components/timeline/GraphView.jsx)

```yaml
id: PH-172
category: code
title: "Hard-to-maintain code: GraphView has been modified across 13 commits
  (repo p80=3) and carries CCN=64 / nesting=4
  (src/components/timeline/GraphView.jsx)"
severity: major
traffic: 0.17099978351784823
confidence: tool-reported
evidence:
  - src/components/timeline/GraphView.jsx:1
source:
  - repowise
repair_cost: M
kind: terrible
repair: "Refactor: split the function and flatten the nesting until it reads top
  to bottom."
fingerprint: code:src/components/timeline/GraphView.jsx:rw-function-hotspot-GraphView
partial: true
```

## PH-173 Hard-to-maintain code: GridView has been modified across 16 commits (repo p80=3) and carries CCN=17 / nesting=2 (src/components/timeline/GridView.jsx)

```yaml
id: PH-173
category: code
title: "Hard-to-maintain code: GridView has been modified across 16 commits
  (repo p80=3) and carries CCN=17 / nesting=2
  (src/components/timeline/GridView.jsx)"
severity: major
traffic: 0.37190033135187556
confidence: tool-reported
evidence:
  - src/components/timeline/GridView.jsx:1
source:
  - repowise
repair_cost: M
kind: terrible
repair: "Refactor: split the function and flatten the nesting until it reads top
  to bottom."
fingerprint: code:src/components/timeline/GridView.jsx:rw-function-hotspot-GridView
partial: true
```

## PH-174 Hard-to-maintain code: GridView is 171 lines long (src/components/timeline/GridView.jsx)

```yaml
id: PH-174
category: code
title: "Hard-to-maintain code: GridView is 171 lines long
  (src/components/timeline/GridView.jsx)"
severity: major
traffic: 0.37190033135187556
confidence: tool-reported
evidence:
  - src/components/timeline/GridView.jsx:1
source:
  - repowise
repair_cost: M
kind: terrible
repair: "Refactor: split the function and flatten the nesting until it reads top
  to bottom."
fingerprint: code:src/components/timeline/GridView.jsx:rw-large-method-GridView
partial: true
```

## PH-175 Hard-to-maintain code: FilmCard has been modified across 11 commits (repo p80=3) and carries CCN=15 / nesting=1 (src/components/timeline/HorizontalFilmStrip.jsx)

```yaml
id: PH-175
category: code
title: "Hard-to-maintain code: FilmCard has been modified across 11 commits
  (repo p80=3) and carries CCN=15 / nesting=1
  (src/components/timeline/HorizontalFilmStrip.jsx)"
severity: major
traffic: 0.19242993821823773
confidence: tool-reported
evidence:
  - src/components/timeline/HorizontalFilmStrip.jsx:1
source:
  - repowise
repair_cost: M
kind: terrible
repair: "Refactor: split the function and flatten the nesting until it reads top
  to bottom."
fingerprint: code:src/components/timeline/HorizontalFilmStrip.jsx:rw-function-hotspot-FilmCard
partial: true
```

## PH-176 Hard-to-maintain code: HorizontalFilmStrip has been modified across 8 commits (repo p80=3) and carries CCN=15 / nesting=1 (src/components/timeline/HorizontalFilmStrip.jsx)

```yaml
id: PH-176
category: code
title: "Hard-to-maintain code: HorizontalFilmStrip has been modified across 8
  commits (repo p80=3) and carries CCN=15 / nesting=1
  (src/components/timeline/HorizontalFilmStrip.jsx)"
severity: major
traffic: 0.19242993821823773
confidence: tool-reported
evidence:
  - src/components/timeline/HorizontalFilmStrip.jsx:1
source:
  - repowise
repair_cost: M
kind: terrible
repair: "Refactor: split the function and flatten the nesting until it reads top
  to bottom."
fingerprint: code:src/components/timeline/HorizontalFilmStrip.jsx:rw-function-hotspot-HorizontalFilmStrip
partial: true
```

## PH-177 Hard-to-maintain code: HorizontalPanoramic has been modified across 8 commits (repo p80=3) and carries CCN=23 / nesting=2 (src/components/timeline/HorizontalPanoramic.jsx)

```yaml
id: PH-177
category: code
title: "Hard-to-maintain code: HorizontalPanoramic has been modified across 8
  commits (repo p80=3) and carries CCN=23 / nesting=2
  (src/components/timeline/HorizontalPanoramic.jsx)"
severity: major
traffic: 0.17053956872507722
confidence: tool-reported
evidence:
  - src/components/timeline/HorizontalPanoramic.jsx:1
source:
  - repowise
repair_cost: M
kind: terrible
repair: "Refactor: split the function and flatten the nesting until it reads top
  to bottom."
fingerprint: code:src/components/timeline/HorizontalPanoramic.jsx:rw-function-hotspot-HorizontalPanoramic
partial: true
```

## PH-178 Hard-to-maintain code: PanoramicCard has been modified across 8 commits (repo p80=3) and carries CCN=27 / nesting=2 (src/components/timeline/HorizontalPanoramic.jsx)

```yaml
id: PH-178
category: code
title: "Hard-to-maintain code: PanoramicCard has been modified across 8 commits
  (repo p80=3) and carries CCN=27 / nesting=2
  (src/components/timeline/HorizontalPanoramic.jsx)"
severity: major
traffic: 0.17053956872507722
confidence: tool-reported
evidence:
  - src/components/timeline/HorizontalPanoramic.jsx:1
source:
  - repowise
repair_cost: M
kind: terrible
repair: "Refactor: split the function and flatten the nesting until it reads top
  to bottom."
fingerprint: code:src/components/timeline/HorizontalPanoramic.jsx:rw-function-hotspot-PanoramicCard
partial: true
```

## PH-179 Hard-to-maintain code: HorizontalWave has been modified across 9 commits (repo p80=3) and carries CCN=16 / nesting=1 (src/components/timeline/HorizontalWave.jsx)

```yaml
id: PH-179
category: code
title: "Hard-to-maintain code: HorizontalWave has been modified across 9 commits
  (repo p80=3) and carries CCN=16 / nesting=1
  (src/components/timeline/HorizontalWave.jsx)"
severity: major
traffic: 0.16805638865901032
confidence: tool-reported
evidence:
  - src/components/timeline/HorizontalWave.jsx:1
source:
  - repowise
repair_cost: M
kind: terrible
repair: "Refactor: split the function and flatten the nesting until it reads top
  to bottom."
fingerprint: code:src/components/timeline/HorizontalWave.jsx:rw-function-hotspot-HorizontalWave
partial: true
```

## PH-180 Hard-to-maintain code: WaveCard has been modified across 8 commits (repo p80=3) and carries CCN=18 / nesting=2 (src/components/timeline/HorizontalWave.jsx)

```yaml
id: PH-180
category: code
title: "Hard-to-maintain code: WaveCard has been modified across 8 commits (repo
  p80=3) and carries CCN=18 / nesting=2
  (src/components/timeline/HorizontalWave.jsx)"
severity: major
traffic: 0.16805638865901032
confidence: tool-reported
evidence:
  - src/components/timeline/HorizontalWave.jsx:1
source:
  - repowise
repair_cost: M
kind: terrible
repair: "Refactor: split the function and flatten the nesting until it reads top
  to bottom."
fingerprint: code:src/components/timeline/HorizontalWave.jsx:rw-function-hotspot-WaveCard
partial: true
```

## PH-181 Hard-to-maintain code: InlineImportPanel has been modified across 14 commits (repo p80=3) and carries CCN=64 / nesting=2 (src/components/timeline/InlineImportPanel.jsx)

```yaml
id: PH-181
category: code
title: "Hard-to-maintain code: InlineImportPanel has been modified across 14
  commits (repo p80=3) and carries CCN=64 / nesting=2
  (src/components/timeline/InlineImportPanel.jsx)"
severity: major
traffic: 0.27051323455460075
confidence: tool-reported
evidence:
  - src/components/timeline/InlineImportPanel.jsx:1
source:
  - repowise
repair_cost: M
kind: terrible
repair: "Refactor: split the function and flatten the nesting until it reads top
  to bottom."
fingerprint: code:src/components/timeline/InlineImportPanel.jsx:rw-function-hotspot-InlineImportPanel
partial: true
```

## PH-182 Hard-to-maintain code: ReviewOverlay has been modified across 7 commits (repo p80=3) and carries CCN=25 / nesting=1 (src/components/timeline/InlineImportPanel.jsx)

```yaml
id: PH-182
category: code
title: "Hard-to-maintain code: ReviewOverlay has been modified across 7 commits
  (repo p80=3) and carries CCN=25 / nesting=1
  (src/components/timeline/InlineImportPanel.jsx)"
severity: major
traffic: 0.27051323455460075
confidence: tool-reported
evidence:
  - src/components/timeline/InlineImportPanel.jsx:1
source:
  - repowise
repair_cost: M
kind: terrible
repair: "Refactor: split the function and flatten the nesting until it reads top
  to bottom."
fingerprint: code:src/components/timeline/InlineImportPanel.jsx:rw-function-hotspot-ReviewOverlay
partial: true
```

## PH-183 Hard-to-maintain code: InsightsPanel has been modified across 7 commits (repo p80=3) and carries CCN=53 / nesting=2 (src/components/timeline/InsightsPanel.jsx)

```yaml
id: PH-183
category: code
title: "Hard-to-maintain code: InsightsPanel has been modified across 7 commits
  (repo p80=3) and carries CCN=53 / nesting=2
  (src/components/timeline/InsightsPanel.jsx)"
severity: major
traffic: 0.1834675704862081
confidence: tool-reported
evidence:
  - src/components/timeline/InsightsPanel.jsx:1
source:
  - repowise
repair_cost: M
kind: terrible
repair: "Refactor: split the function and flatten the nesting until it reads top
  to bottom."
fingerprint: code:src/components/timeline/InsightsPanel.jsx:rw-function-hotspot-InsightsPanel
partial: true
```

## PH-184 Hard-to-maintain code: MapView has been modified across 11 commits (repo p80=3) and carries CCN=23 / nesting=2 (src/components/timeline/MapView.jsx)

```yaml
id: PH-184
category: code
title: "Hard-to-maintain code: MapView has been modified across 11 commits (repo
  p80=3) and carries CCN=23 / nesting=2 (src/components/timeline/MapView.jsx)"
severity: major
traffic: 0.1563712816041086
confidence: tool-reported
evidence:
  - src/components/timeline/MapView.jsx:1
source:
  - repowise
repair_cost: M
kind: terrible
repair: "Refactor: split the function and flatten the nesting until it reads top
  to bottom."
fingerprint: code:src/components/timeline/MapView.jsx:rw-function-hotspot-MapView
partial: true
```

## PH-185 Hard-to-maintain code: PhotoLibrary has been modified across 13 commits (repo p80=3) and carries CCN=44 / nesting=2 (src/components/timeline/PhotoLibrary.jsx)

```yaml
id: PH-185
category: code
title: "Hard-to-maintain code: PhotoLibrary has been modified across 13 commits
  (repo p80=3) and carries CCN=44 / nesting=2
  (src/components/timeline/PhotoLibrary.jsx)"
severity: major
traffic: 0.1928428742985504
confidence: tool-reported
evidence:
  - src/components/timeline/PhotoLibrary.jsx:1
source:
  - repowise
repair_cost: M
kind: terrible
repair: "Refactor: split the function and flatten the nesting until it reads top
  to bottom."
fingerprint: code:src/components/timeline/PhotoLibrary.jsx:rw-function-hotspot-PhotoLibrary
partial: true
```

## PH-186 Hard-to-maintain code: PhotoPreview has been modified across 6 commits (repo p80=3) and carries CCN=28 / nesting=1 (src/components/timeline/PhotoPreview.jsx)

```yaml
id: PH-186
category: code
title: "Hard-to-maintain code: PhotoPreview has been modified across 6 commits
  (repo p80=3) and carries CCN=28 / nesting=1
  (src/components/timeline/PhotoPreview.jsx)"
severity: major
traffic: 0.12087724694540253
confidence: tool-reported
evidence:
  - src/components/timeline/PhotoPreview.jsx:1
source:
  - repowise
repair_cost: M
kind: terrible
repair: "Refactor: split the function and flatten the nesting until it reads top
  to bottom."
fingerprint: code:src/components/timeline/PhotoPreview.jsx:rw-function-hotspot-PhotoPreview
partial: true
```

## PH-187 Hard-to-maintain code: StatsModal has been modified across 6 commits (repo p80=3) and carries CCN=26 / nesting=2 (src/components/timeline/StatsModal.jsx)

```yaml
id: PH-187
category: code
title: "Hard-to-maintain code: StatsModal has been modified across 6 commits
  (repo p80=3) and carries CCN=26 / nesting=2
  (src/components/timeline/StatsModal.jsx)"
severity: major
traffic: 0.11068932208642898
confidence: tool-reported
evidence:
  - src/components/timeline/StatsModal.jsx:1
source:
  - repowise
repair_cost: M
kind: terrible
repair: "Refactor: split the function and flatten the nesting until it reads top
  to bottom."
fingerprint: code:src/components/timeline/StatsModal.jsx:rw-function-hotspot-StatsModal
partial: true
```

## PH-188 Hard-to-maintain code: TimelineManager has been modified across 10 commits (repo p80=3) and carries CCN=28 / nesting=1 (src/components/timeline/TimelineManager.jsx)

```yaml
id: PH-188
category: code
title: "Hard-to-maintain code: TimelineManager has been modified across 10
  commits (repo p80=3) and carries CCN=28 / nesting=1
  (src/components/timeline/TimelineManager.jsx)"
severity: major
traffic: 0.27310525578343997
confidence: tool-reported
evidence:
  - src/components/timeline/TimelineManager.jsx:1
source:
  - repowise
repair_cost: M
kind: terrible
repair: "Refactor: split the function and flatten the nesting until it reads top
  to bottom."
fingerprint: code:src/components/timeline/TimelineManager.jsx:rw-function-hotspot-TimelineManager
partial: true
```

## PH-189 Hard-to-maintain code: ToolbarContent has been modified across 12 commits (repo p80=3) and carries CCN=23 / nesting=2 (src/components/timeline/TimelineToolbar.jsx)

```yaml
id: PH-189
category: code
title: "Hard-to-maintain code: ToolbarContent has been modified across 12
  commits (repo p80=3) and carries CCN=23 / nesting=2
  (src/components/timeline/TimelineToolbar.jsx)"
severity: major
traffic: 0.47761948749057187
confidence: tool-reported
evidence:
  - src/components/timeline/TimelineToolbar.jsx:1
source:
  - repowise
repair_cost: M
kind: terrible
repair: "Refactor: split the function and flatten the nesting until it reads top
  to bottom."
fingerprint: code:src/components/timeline/TimelineToolbar.jsx:rw-function-hotspot-ToolbarContent
partial: true
```

## PH-190 Hard-to-maintain code: ViewSelector has been modified across 7 commits (repo p80=3) and carries CCN=29 / nesting=3 (src/components/timeline/TimelineToolbar.jsx)

```yaml
id: PH-190
category: code
title: "Hard-to-maintain code: ViewSelector has been modified across 7 commits
  (repo p80=3) and carries CCN=29 / nesting=3
  (src/components/timeline/TimelineToolbar.jsx)"
severity: major
traffic: 0.47761948749057187
confidence: tool-reported
evidence:
  - src/components/timeline/TimelineToolbar.jsx:1
source:
  - repowise
repair_cost: M
kind: terrible
repair: "Refactor: split the function and flatten the nesting until it reads top
  to bottom."
fingerprint: code:src/components/timeline/TimelineToolbar.jsx:rw-function-hotspot-ViewSelector
partial: true
```

## PH-191 Hard-to-maintain code: CinematicCard is 131 lines long (src/components/timeline/VerticalCinematic.jsx)

```yaml
id: PH-191
category: code
title: "Hard-to-maintain code: CinematicCard is 131 lines long
  (src/components/timeline/VerticalCinematic.jsx)"
severity: major
traffic: 0.13051402658105676
confidence: tool-reported
evidence:
  - src/components/timeline/VerticalCinematic.jsx:1
source:
  - repowise
repair_cost: M
kind: terrible
repair: "Refactor: split the function and flatten the nesting until it reads top
  to bottom."
fingerprint: code:src/components/timeline/VerticalCinematic.jsx:rw-large-method-CinematicCard
partial: true
```

## PH-192 Hard-to-maintain code: FeaturedCard is 123 lines long (src/components/timeline/VerticalMagazine.jsx)

```yaml
id: PH-192
category: code
title: "Hard-to-maintain code: FeaturedCard is 123 lines long
  (src/components/timeline/VerticalMagazine.jsx)"
severity: major
traffic: 0.12200538192919079
confidence: tool-reported
evidence:
  - src/components/timeline/VerticalMagazine.jsx:1
source:
  - repowise
repair_cost: M
kind: terrible
repair: "Refactor: split the function and flatten the nesting until it reads top
  to bottom."
fingerprint: code:src/components/timeline/VerticalMagazine.jsx:rw-large-method-FeaturedCard
partial: true
```

## PH-193 Hard-to-maintain code: NarrativeCard has been modified across 8 commits (repo p80=3) and carries CCN=26 / nesting=1 (src/components/timeline/VerticalNarrative.jsx)

```yaml
id: PH-193
category: code
title: "Hard-to-maintain code: NarrativeCard has been modified across 8 commits
  (repo p80=3) and carries CCN=26 / nesting=1
  (src/components/timeline/VerticalNarrative.jsx)"
severity: major
traffic: 0.12962539060128375
confidence: tool-reported
evidence:
  - src/components/timeline/VerticalNarrative.jsx:1
source:
  - repowise
repair_cost: M
kind: terrible
repair: "Refactor: split the function and flatten the nesting until it reads top
  to bottom."
fingerprint: code:src/components/timeline/VerticalNarrative.jsx:rw-function-hotspot-NarrativeCard
partial: true
```

## PH-194 Hard-to-maintain code: useDragScroll has been modified across 7 commits (repo p80=3) and carries CCN=24 / nesting=1 (src/hooks/useDragScroll.js)

```yaml
id: PH-194
category: code
title: "Hard-to-maintain code: useDragScroll has been modified across 7 commits
  (repo p80=3) and carries CCN=24 / nesting=1 (src/hooks/useDragScroll.js)"
severity: major
traffic: 0.09332763563076862
confidence: tool-reported
evidence:
  - src/hooks/useDragScroll.js:1
source:
  - repowise
repair_cost: M
kind: terrible
repair: "Refactor: split the function and flatten the nesting until it reads top
  to bottom."
fingerprint: code:src/hooks/useDragScroll.js:rw-function-hotspot-useDragScroll
partial: true
```

## PH-195 Hard-to-maintain code: useDragScroll is 131 lines long (src/hooks/useDragScroll.js)

```yaml
id: PH-195
category: code
title: "Hard-to-maintain code: useDragScroll is 131 lines long
  (src/hooks/useDragScroll.js)"
severity: major
traffic: 0.09332763563076862
confidence: tool-reported
evidence:
  - src/hooks/useDragScroll.js:1
source:
  - repowise
repair_cost: M
kind: terrible
repair: "Refactor: split the function and flatten the nesting until it reads top
  to bottom."
fingerprint: code:src/hooks/useDragScroll.js:rw-large-method-useDragScroll
partial: true
```

## PH-196 Hard-to-maintain code: useTimelineShell has cyclomatic complexity 18 (src/hooks/useTimelineShell.jsx)

```yaml
id: PH-196
category: code
title: "Hard-to-maintain code: useTimelineShell has cyclomatic complexity 18
  (src/hooks/useTimelineShell.jsx)"
severity: major
traffic: 0.0256143895106983
confidence: tool-reported
evidence:
  - src/hooks/useTimelineShell.jsx:1
source:
  - repowise
repair_cost: M
kind: terrible
repair: "Refactor: split the function and flatten the nesting until it reads top
  to bottom."
fingerprint: code:src/hooks/useTimelineShell.jsx:rw-complex-method-useTimelineShell
partial: true
```

## PH-197 Hard-to-maintain code: syncPhotosToRemote has been modified across 8 commits (repo p80=3) and carries CCN=21 / nesting=4 (src/lib/dataService.js)

```yaml
id: PH-197
category: code
title: "Hard-to-maintain code: syncPhotosToRemote has been modified across 8
  commits (repo p80=3) and carries CCN=21 / nesting=4 (src/lib/dataService.js)"
severity: major
traffic: 0.16288759396704247
confidence: tool-reported
evidence:
  - src/lib/dataService.js:1
source:
  - repowise
repair_cost: M
kind: terrible
repair: "Refactor: split the function and flatten the nesting until it reads top
  to bottom."
fingerprint: code:src/lib/dataService.js:rw-function-hotspot-syncPhotosToRemote
partial: true
```

## PH-198 Hard-to-maintain code: getFilteredEvents has been modified across 5 commits (repo p80=3) and carries CCN=19 / nesting=2 (src/store/selectors.js)

```yaml
id: PH-198
category: code
title: "Hard-to-maintain code: getFilteredEvents has been modified across 5
  commits (repo p80=3) and carries CCN=19 / nesting=2 (src/store/selectors.js)"
severity: major
traffic: 0.2569365117006605
confidence: tool-reported
evidence:
  - src/store/selectors.js:1
source:
  - repowise
repair_cost: M
kind: terrible
repair: "Refactor: split the function and flatten the nesting until it reads top
  to bottom."
fingerprint: code:src/store/selectors.js:rw-function-hotspot-getFilteredEvents
partial: true
```

## PH-199 Hard-to-maintain code: createEventsSlice has been modified across 14 commits (repo p80=3) and carries CCN=54 / nesting=2 (src/store/slices/eventsSlice.js)

```yaml
id: PH-199
category: code
title: "Hard-to-maintain code: createEventsSlice has been modified across 14
  commits (repo p80=3) and carries CCN=54 / nesting=2
  (src/store/slices/eventsSlice.js)"
severity: major
traffic: 0.2543626862864197
confidence: tool-reported
evidence:
  - src/store/slices/eventsSlice.js:1
source:
  - repowise
repair_cost: M
kind: terrible
repair: "Refactor: split the function and flatten the nesting until it reads top
  to bottom."
fingerprint: code:src/store/slices/eventsSlice.js:rw-function-hotspot-createEventsSlice
partial: true
```

## PH-200 Hard-to-maintain code: createPhotosSlice has been modified across 10 commits (repo p80=3) and carries CCN=27 / nesting=3 (src/store/slices/photosSlice.js)

```yaml
id: PH-200
category: code
title: "Hard-to-maintain code: createPhotosSlice has been modified across 10
  commits (repo p80=3) and carries CCN=27 / nesting=3
  (src/store/slices/photosSlice.js)"
severity: major
traffic: 0.08871930695727588
confidence: tool-reported
evidence:
  - src/store/slices/photosSlice.js:1
source:
  - repowise
repair_cost: M
kind: terrible
repair: "Refactor: split the function and flatten the nesting until it reads top
  to bottom."
fingerprint: code:src/store/slices/photosSlice.js:rw-function-hotspot-createPhotosSlice
partial: true
```

## PH-201 Hard-to-maintain code: createTimelinesSlice has been modified across 9 commits (repo p80=3) and carries CCN=43 / nesting=3 (src/store/slices/timelinesSlice.js)

```yaml
id: PH-201
category: code
title: "Hard-to-maintain code: createTimelinesSlice has been modified across 9
  commits (repo p80=3) and carries CCN=43 / nesting=3
  (src/store/slices/timelinesSlice.js)"
severity: major
traffic: 0.10694046755254454
confidence: tool-reported
evidence:
  - src/store/slices/timelinesSlice.js:1
source:
  - repowise
repair_cost: M
kind: terrible
repair: "Refactor: split the function and flatten the nesting until it reads top
  to bottom."
fingerprint: code:src/store/slices/timelinesSlice.js:rw-function-hotspot-createTimelinesSlice
partial: true
```

## PH-202 Hard-to-maintain code: createUISlice has been modified across 12 commits (repo p80=3) and carries CCN=15 / nesting=1 (src/store/slices/uiSlice.js)

```yaml
id: PH-202
category: code
title: "Hard-to-maintain code: createUISlice has been modified across 12 commits
  (repo p80=3) and carries CCN=15 / nesting=1 (src/store/slices/uiSlice.js)"
severity: major
traffic: 0.20751079548124593
confidence: tool-reported
evidence:
  - src/store/slices/uiSlice.js:1
source:
  - repowise
repair_cost: M
kind: terrible
repair: "Refactor: split the function and flatten the nesting until it reads top
  to bottom."
fingerprint: code:src/store/slices/uiSlice.js:rw-function-hotspot-createUISlice
partial: true
```

## PH-203 Hard-to-maintain code: createUISlice is 143 lines long (src/store/slices/uiSlice.js)

```yaml
id: PH-203
category: code
title: "Hard-to-maintain code: createUISlice is 143 lines long
  (src/store/slices/uiSlice.js)"
severity: major
traffic: 0.20751079548124593
confidence: tool-reported
evidence:
  - src/store/slices/uiSlice.js:1
source:
  - repowise
repair_cost: M
kind: terrible
repair: "Refactor: split the function and flatten the nesting until it reads top
  to bottom."
fingerprint: code:src/store/slices/uiSlice.js:rw-large-method-createUISlice
partial: true
```

## PH-204 Hard-to-maintain code: downloadPDF has been modified across 13 commits (repo p80=3) and carries CCN=16 / nesting=5 (src/utils/exportHelpers.js)

```yaml
id: PH-204
category: code
title: "Hard-to-maintain code: downloadPDF has been modified across 13 commits
  (repo p80=3) and carries CCN=16 / nesting=5 (src/utils/exportHelpers.js)"
severity: major
traffic: 0.3149790492633774
confidence: tool-reported
evidence:
  - src/utils/exportHelpers.js:1
source:
  - repowise
repair_cost: M
kind: terrible
repair: "Refactor: split the function and flatten the nesting until it reads top
  to bottom."
fingerprint: code:src/utils/exportHelpers.js:rw-function-hotspot-downloadPDF
partial: true
```

## PH-205 Hard-to-maintain code: downloadPDF nests 5 levels deep (src/utils/exportHelpers.js)

```yaml
id: PH-205
category: code
title: "Hard-to-maintain code: downloadPDF nests 5 levels deep
  (src/utils/exportHelpers.js)"
severity: major
traffic: 0.3149790492633774
confidence: tool-reported
evidence:
  - src/utils/exportHelpers.js:1
source:
  - repowise
repair_cost: M
kind: terrible
repair: "Refactor: split the function and flatten the nesting until it reads top
  to bottom."
fingerprint: code:src/utils/exportHelpers.js:rw-nested-complexity-downloadPDF
partial: true
```

## PH-206 Hard-to-maintain code: normalizeCSVEvent has been modified across 6 commits (repo p80=3) and carries CCN=20 / nesting=1 (src/utils/importHelpers.js)

```yaml
id: PH-206
category: code
title: "Hard-to-maintain code: normalizeCSVEvent has been modified across 6
  commits (repo p80=3) and carries CCN=20 / nesting=1
  (src/utils/importHelpers.js)"
severity: major
traffic: 0.09091787210140102
confidence: tool-reported
evidence:
  - src/utils/importHelpers.js:1
source:
  - repowise
repair_cost: M
kind: terrible
repair: "Refactor: split the function and flatten the nesting until it reads top
  to bottom."
fingerprint: code:src/utils/importHelpers.js:rw-function-hotspot-normalizeCSVEvent
partial: true
```

## PH-207 Hard-to-maintain code: normalizeJSONEvents has been modified across 5 commits (repo p80=3) and carries CCN=23 / nesting=1 (src/utils/importHelpers.js)

```yaml
id: PH-207
category: code
title: "Hard-to-maintain code: normalizeJSONEvents has been modified across 5
  commits (repo p80=3) and carries CCN=23 / nesting=1
  (src/utils/importHelpers.js)"
severity: major
traffic: 0.09091787210140102
confidence: tool-reported
evidence:
  - src/utils/importHelpers.js:1
source:
  - repowise
repair_cost: M
kind: terrible
repair: "Refactor: split the function and flatten the nesting until it reads top
  to bottom."
fingerprint: code:src/utils/importHelpers.js:rw-function-hotspot-normalizeJSONEvents
partial: true
```

## PH-208 Hard-to-maintain code: normalizeICSEvents nests 5 levels deep (src/utils/importHelpers.js)

```yaml
id: PH-208
category: code
title: "Hard-to-maintain code: normalizeICSEvents nests 5 levels deep
  (src/utils/importHelpers.js)"
severity: major
traffic: 0.09091787210140102
confidence: tool-reported
evidence:
  - src/utils/importHelpers.js:1
source:
  - repowise
repair_cost: M
kind: terrible
repair: "Refactor: split the function and flatten the nesting until it reads top
  to bottom."
fingerprint: code:src/utils/importHelpers.js:rw-nested-complexity-normalizeICSEvents
partial: true
```
