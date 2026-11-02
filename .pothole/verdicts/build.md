# Verdicts: build

Inspector: inspect-build. Coverage: every finding judged; all evidence refs opened (api/parse.js, api/analyze.js, api/share.js, api/og.js, .env.example, package.json, package-lock.json lines 8137/10858, ci.yml, dependabot.yml, commit e00e916) plus README.md setup/deploy sections, vite.config.js and .gitignore for reachability. Build coverage remains AI-only.

## PH-1009 refuted

```yaml
id: PH-1009
verdict: refuted
reason: "unreachable: .env.example only feeds local `npm run dev` (copied to
  gitignored .env, .gitignore:16), and vite.config.js has no /api proxy and the
  Vercel CLI is not a dependency, so api/parse.js and api/analyze.js never read
  it; deploys are configured in Vercel per README.md:61-68 and :131, which name
  ANTHROPIC_API_KEY explicitly (and README.md:149 points at it on failure), so
  no deploy is configured from the sample and the claimed silent missing name
  does not occur."
fingerprint: build:.env.example:env-example-missing-anthropic-api-key
```

## PH-1010 refuted

```yaml
id: PH-1010
verdict: refuted
reason: "unreachable: same as PH-1009 — the sample env file is not an input to
  any environment where api/share.js or api/og.js run (no /api in vite dev, no
  Vercel CLI); the deploy-side instructions README.md:68 and :77 ('Set the env
  vars above') list SUPABASE_SERVICE_ROLE_KEY, and api/share.js:4-8 documents
  the requirement inline."
fingerprint: build:.env.example:env-example-missing-supabase-service-role-key
```

## PH-1011 refuted

```yaml
id: PH-1011
verdict: refuted
reason: "unreachable: .env.example never configures a deploy (api/ does not run
  locally; Vercel reads dashboard vars), so its omission cannot cause the
  Host-header fallback. The real gap is that README.md's env table (61-68) and
  deploy steps (125-131) omit PUBLIC_BASE_URL while only CLAUDE.md:178 says to
  set it — that is signage debt, and the Host-header trust in api/share.js:51-55
  is security's to judge; refile there next scan."
fingerprint: build:.env.example:env-example-missing-public-base-url
```

## PH-1012 confirmed

```yaml
id: PH-1012
verdict: confirmed
reason: "Checked: package.json:8 declares node >=18.0.0; package-lock.json:10858
  (vite) requires ^20.19.0 || >=22.12.0 and :8137 (jsdom, used by
  scripts/prerender.mjs in npm run build) requires ^20.19.0 || ^22.13.0 || >=24;
  no .nvmrc/.node-version exists and only ci.yml:21 hardcodes 22. No comment
  documents the gap; not a trap (the declared range is wrong, not merely
  unpinned). Minor stands."
fingerprint: build:package.json:engines-node-range-below-toolchain-minimum
```

## PH-1013 confirmed

```yaml
id: PH-1013
verdict: confirmed
reason: "Checked: ci.yml:24-31 runs npm ci, test and build only; package.json:19
  defines lint; ci.yml:33-52 auto-merges non-major Dependabot PRs after that
  job; no lint step anywhere in .github and no hook. Headline claim stands at
  minor. Caveat: e00e916 does not show violations accumulating unseen — it was a
  manual ESLint/react-hooks MAJOR upgrade (which dependabot.yml ignores) ending
  at 0 errors — so the cost rests on ci.yml alone."
fingerprint: build:.github/workflows/ci.yml:ci-missing-lint-gate-before-auto-merge
```
