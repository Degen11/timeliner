# Tool findings: security

Tools run: eslint-sonar (80 findings), jscpd (68 findings), gitleaks (0 findings), osv-scanner (0 findings), madge (0 findings), repowise-dead-code (0 findings), repowise-health (60 findings). Skipped (not measured): sonar — set SONAR_HOST_URL, SONAR_TOKEN, SONAR_PROJECT_KEY (or sonar-project.properties); semgrep — failed (exit 2; message withheld — tool output can echo repo contents); lcov — no coverage/lcov.info in the repo (Pothole never runs the target's tests, so it cannot produce one): coverage is not measured. Coverage notes: repowise-health — TRUNCATED at 60 of 201 health findings: coverage is partial.

## PH-001 Using slow regular expressions is security-sensitive

```yaml
id: PH-001
category: security
title: Using slow regular expressions is security-sensitive
severity: minor
traffic: 0.10018453358306686
confidence: tool-reported
evidence:
  - api/analyze.js:197
source:
  - eslint-sonar
repair_cost: M
fingerprint: security:api/analyze.js:sonarjs/slow-regex
```

## PH-002 Using slow regular expressions is security-sensitive

```yaml
id: PH-002
category: security
title: Using slow regular expressions is security-sensitive
severity: minor
traffic: 0.2043498187424466
confidence: tool-reported
evidence:
  - api/parse.js:129
source:
  - eslint-sonar
repair_cost: M
fingerprint: security:api/parse.js:sonarjs/slow-regex
```

## PH-005 Using slow regular expressions is security-sensitive

```yaml
id: PH-005
category: security
title: Using slow regular expressions is security-sensitive
severity: minor
traffic: 0.2509477199194409
confidence: tool-reported
evidence:
  - api/share.js:52
source:
  - eslint-sonar
repair_cost: M
fingerprint: security:api/share.js:sonarjs/slow-regex
```

## PH-007 Using pseudorandom number generators (PRNGs) is security-sensitive

```yaml
id: PH-007
category: security
title: Using pseudorandom number generators (PRNGs) is security-sensitive
severity: minor
traffic: 0.026506220253271366
confidence: tool-reported
evidence:
  - src/components/__tests__/views.smoke.test.jsx:62
source:
  - eslint-sonar
repair_cost: M
fingerprint: security:src/components/__tests__/views.smoke.test.jsx:sonarjs/pseudo-random
```

## PH-052 Using slow regular expressions is security-sensitive

```yaml
id: PH-052
category: security
title: Using slow regular expressions is security-sensitive
severity: minor
traffic: 0.08302173269170779
confidence: tool-reported
evidence:
  - src/lib/photoStore.js:64
source:
  - eslint-sonar
repair_cost: M
fingerprint: security:src/lib/photoStore.js:sonarjs/slow-regex
```

## PH-053 Dynamically executing code is security-sensitive (2× in file)

```yaml
id: PH-053
category: security
title: Dynamically executing code is security-sensitive (2× in file)
severity: minor
traffic: 0.0622730216892767
confidence: tool-reported
evidence:
  - src/schemas/__tests__/event.test.js:161
  - src/schemas/__tests__/event.test.js:176
source:
  - eslint-sonar
repair_cost: M
fingerprint: security:src/schemas/__tests__/event.test.js:sonarjs/code-eval
```

## PH-055 Using pseudorandom number generators (PRNGs) is security-sensitive

```yaml
id: PH-055
category: security
title: Using pseudorandom number generators (PRNGs) is security-sensitive
severity: minor
traffic: 0.10404379040542859
confidence: tool-reported
evidence:
  - src/store/__tests__/eventsSlice.test.js:60
source:
  - eslint-sonar
repair_cost: M
fingerprint: security:src/store/__tests__/eventsSlice.test.js:sonarjs/pseudo-random
```

## PH-056 Using pseudorandom number generators (PRNGs) is security-sensitive

```yaml
id: PH-056
category: security
title: Using pseudorandom number generators (PRNGs) is security-sensitive
severity: minor
traffic: 0.20466433409444218
confidence: tool-reported
evidence:
  - src/store/__tests__/selectors.test.js:19
source:
  - eslint-sonar
repair_cost: M
fingerprint: security:src/store/__tests__/selectors.test.js:sonarjs/pseudo-random
```

## PH-066 Dynamically executing code is security-sensitive

```yaml
id: PH-066
category: security
title: Dynamically executing code is security-sensitive
severity: minor
traffic: 0.053312244970405424
confidence: tool-reported
evidence:
  - src/utils/__tests__/constants.test.js:149
source:
  - eslint-sonar
repair_cost: M
fingerprint: security:src/utils/__tests__/constants.test.js:sonarjs/code-eval
```

## PH-069 Using slow regular expressions is security-sensitive (3× in file)

```yaml
id: PH-069
category: security
title: Using slow regular expressions is security-sensitive (3× in file)
severity: minor
traffic: 0.31737583906559763
confidence: tool-reported
evidence:
  - src/utils/dateUtils.js:462
  - src/utils/dateUtils.js:507
  - src/utils/dateUtils.js:548
source:
  - eslint-sonar
repair_cost: M
fingerprint: security:src/utils/dateUtils.js:sonarjs/slow-regex
```

## PH-076 Using slow regular expressions is security-sensitive (3× in file)

```yaml
id: PH-076
category: security
title: Using slow regular expressions is security-sensitive (3× in file)
severity: minor
traffic: 0.09091787210140102
confidence: tool-reported
evidence:
  - src/utils/importHelpers.js:230
  - src/utils/importHelpers.js:239
  - src/utils/importHelpers.js:251
source:
  - eslint-sonar
repair_cost: M
fingerprint: security:src/utils/importHelpers.js:sonarjs/slow-regex
```

## PH-077 Using pseudorandom number generators (PRNGs) is security-sensitive

```yaml
id: PH-077
category: security
title: Using pseudorandom number generators (PRNGs) is security-sensitive
severity: minor
traffic: 0.009177927505226289
confidence: tool-reported
evidence:
  - src/workers/importWorker.js:20
source:
  - eslint-sonar
repair_cost: M
fingerprint: security:src/workers/importWorker.js:sonarjs/pseudo-random
```

## PH-080 Using slow regular expressions is security-sensitive (3× in file)

```yaml
id: PH-080
category: security
title: Using slow regular expressions is security-sensitive (3× in file)
severity: minor
traffic: 0.009177927505226289
confidence: tool-reported
evidence:
  - src/workers/importWorker.js:217
  - src/workers/importWorker.js:222
  - src/workers/importWorker.js:226
source:
  - eslint-sonar
repair_cost: M
fingerprint: security:src/workers/importWorker.js:sonarjs/slow-regex
```
