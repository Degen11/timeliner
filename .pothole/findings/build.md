# Findings: build

Detector: detect-build. Coverage: .github/workflows/ci.yml, .github/dependabot.yml, package.json scripts and engines, .npmrc, vercel.json, vite.config.js, scripts/prerender.mjs, .env.example and the README setup and deployment sections read end to end; every process.env and import.meta.env read in src/, api/ and scripts/ cross-checked against .env.example; commit subjects grepped for retry/re-run/flaky/again/lint over workflow and build paths (no workflow retries exist; the one parse retry hit is app code). No release doc exists; deploys are Vercel git integration. No tool in this phase reads build inputs, so build coverage is AI-only. Not reported: ALLOWED_ORIGIN and the non-prefixed SUPABASE_URL/SUPABASE_ANON_KEY aliases are absent from .env.example but optional with safe defaults. Out of category: (signage) README.md:47 says Node.js 18+ (pipeline half reported here) and README.md:52-59 implies npm run dev plus ANTHROPIC_API_KEY in .env enables AI parsing, but vite dev has no /api proxy and the Vercel CLI is not a dependency, so api/ functions never run locally; (dependency) .npmrc:1 sets legacy-peer-deps=true repo-wide since 543274f with no comment naming which peer conflict it masks. No credentials seen in build inputs. [coverage=full]

## PH-1009 .env.example omits ANTHROPIC_API_KEY, which gates AI parsing and insights

```yaml
id: PH-1009
category: build
title: .env.example omits ANTHROPIC_API_KEY, which gates AI parsing and insights
severity: minor
traffic: 0.2043498187424466
confidence: ai-suspected
evidence:
  - api/parse.js:217
  - api/analyze.js:241
  - .env.example:1
source:
  - detect-build
repair_cost: S
fingerprint: build:.env.example:env-example-missing-anthropic-api-key
```

Both AI endpoints read ANTHROPIC_API_KEY and return a generic 500 'Service temporarily unavailable' when it is absent. .env.example lists only the two VITE_SUPABASE_* names, so an environment built by copying the sample (as README.md tells the reader to) comes up without the product's headline feature and with an error that does not name the missing variable. Gates a feature, not startup, hence minor.

## PH-1010 .env.example omits SUPABASE_SERVICE_ROLE_KEY, which gates server-side sharing and OG images

```yaml
id: PH-1010
category: build
title: .env.example omits SUPABASE_SERVICE_ROLE_KEY, which gates server-side
  sharing and OG images
severity: minor
traffic: 0.2509477199194409
confidence: ai-suspected
evidence:
  - api/share.js:11
  - api/og.js:17
  - .env.example:2
source:
  - detect-build
repair_cost: S
fingerprint: build:.env.example:env-example-missing-supabase-service-role-key
```

share.js and og.js prefer SUPABASE_SERVICE_ROLE_KEY and silently fall back to the anon key; the comment at api/share.js:4-8 says shared_timelines has RLS with no policies, so the anon fallback cannot read or insert. A deploy configured from the sample therefore boots, has a Supabase client, and fails share creation and per-share OG images at runtime with nothing pointing at the missing name. Feature-gating, hence minor.

## PH-1011 .env.example omits PUBLIC_BASE_URL, so sample-configured deploys derive share URLs from the Host header

```yaml
id: PH-1011
category: build
title: .env.example omits PUBLIC_BASE_URL, so sample-configured deploys derive
  share URLs from the Host header
severity: minor
traffic: 0.2509477199194409
confidence: ai-suspected
evidence:
  - api/share.js:51
  - .env.example:1
source:
  - detect-build
repair_cost: S
fingerprint: build:.env.example:env-example-missing-public-base-url
```

getTrustedOrigin reads PUBLIC_BASE_URL and, absent it (and a non-wildcard ALLOWED_ORIGIN), falls back to the request Host header, which its own comment at api/share.js:41-47 calls attacker-controllable for canonical/OG/redirect URLs. CLAUDE.md says to set it in production, but neither .env.example nor the README env table names it, so a deploy from the repo's own sample silently takes the fallback path. Feature-level hardening, not startup, hence minor.

## PH-1012 package.json engines declares node >=18 but the locked toolchain requires Node 20.19+/22.12+

```yaml
id: PH-1012
category: build
title: package.json engines declares node >=18 but the locked toolchain requires
  Node 20.19+/22.12+
severity: minor
traffic: 1
confidence: ai-suspected
evidence:
  - package.json:8
  - package-lock.json:10858
  - package-lock.json:8137
  - .github/workflows/ci.yml:21
source:
  - detect-build
repair_cost: S
fingerprint: build:package.json:engines-node-range-below-toolchain-minimum
```

The only in-repo Node version declaration is engines.node >=18.0.0, yet the lockfile pins vite 8.3.5 (and rolldown, @vitejs/plugin-react) at ^20.19.0 || >=22.12.0 and jsdom 29 (used by scripts/prerender.mjs inside npm run build) at ^20.19.0 || ^22.13.0. CI only works because ci.yml hardcodes node-version 22; there is no .nvmrc or .node-version. A builder or deploy target that honours the declared range (Node 18 or early 20) cannot run npm run build from a fresh clone. Fix: raise engines to the toolchain floor and add a version file CI reads.

## PH-1013 CI never runs lint, yet Dependabot PRs auto-merge on that CI alone

```yaml
id: PH-1013
category: build
title: CI never runs lint, yet Dependabot PRs auto-merge on that CI alone
severity: minor
traffic: 1
confidence: ai-suspected
evidence:
  - .github/workflows/ci.yml:27-31
  - .github/workflows/ci.yml:33-52
  - package.json:19
  - e00e916
source:
  - detect-build
repair_cost: S
fingerprint: build:.github/workflows/ci.yml:ci-missing-lint-gate-before-auto-merge
```

The build job runs npm ci, npm test and npm run build only; the lint script exists but no pipeline runs it. The dependabot-auto-merge job (needs: build) merges every non-major bump that passes, including minor bumps of eslint plugins that add rules. CLAUDE.md relies on the react-compiler and react-hooks ESLint plugins to enforce its memoization conventions, and e00e916 (fix all new lint findings) shows violations accumulating unseen until someone runs lint by hand. One added step closes it.
