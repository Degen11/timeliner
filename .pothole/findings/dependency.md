# Findings: dependency

Detector: detect-dependency. Coverage: package.json, package-lock.json, vite.config.js, eslint.config.js and .github/dependabot.yml read; every declared dependency traced to import sites in src/, api/, scripts/ and config files. osv-scanner ran and reported 0 advisories, so there was no reachability work to do. Unused-dependency coverage is my own reading only (knip is not run). Abandonment was checked against npm registry metadata for the candidates; nothing is archived. No credentials seen in manifests or lockfile. [coverage=full]

## PH-609 Documented @vercel/og 0.8.x constraint is not enforced and Dependabot already moved past it

```yaml
id: PH-609
category: dependency
title: Documented @vercel/og 0.8.x constraint is not enforced and Dependabot
  already moved past it
severity: minor
traffic: 1
confidence: ai-suspected
evidence:
  - api/og.js:12
  - package.json:40
  - .github/dependabot.yml:12
  - api/__tests__/og.test.js:28
  - 5dd591a
source:
  - detect-dependency
repair_cost: M
fingerprint: dependency:api/og.js:vercel-og-constraint-unenforced
```

api/og.js:12-13 (and CLAUDE.md) say @vercel/og must stay on 0.8.x because newer Node builds throw on import outside Next.js. The manifest only expresses this as a caret range, and dependabot.yml groups every minor bump with no ignore rule for this package. Dependabot commit 5dd591a moved it from 0.8.6 to 0.11.1 inside the safe-updates group, so the shipped version now contradicts both the code comment and CLAUDE.md. The test that could catch an import-time failure mocks @vercel/og completely (og.test.js:28), so CI cannot tell whether 0.11.1 loads in the Vercel Node runtime. Either the constraint is obsolete, in which case the docs are wrong, or the production OG endpoint is at risk. Nobody can tell which without a deploy. The fix: decide which is true, then encode it with an exact pin plus a Dependabot ignore entry, or update the comment and docs, and add an unmocked import smoke test.

## PH-610 eslint-plugin-react-compiler duplicates the React Compiler rules already in eslint-plugin-react-hooks 7

```yaml
id: PH-610
category: dependency
title: eslint-plugin-react-compiler duplicates the React Compiler rules already
  in eslint-plugin-react-hooks 7
severity: minor
traffic: 1
confidence: ai-suspected
evidence:
  - package.json:79
  - package.json:80
  - eslint.config.js:6
  - eslint.config.js:29
  - eslint.config.js:31
  - src/test/reactCompiler.test.js:16
source:
  - detect-dependency
repair_cost: S
fingerprint: dependency:eslint.config.js:duplicate-react-compiler-lint-plugins
```

eslint-plugin-react-hooks 7 ships the React Compiler diagnostics (immutability, refs, purity, preserve-manual-memoization and others) in its recommended config, which eslint.config.js:29 already spreads. The config also loads the standalone eslint-plugin-react-compiler. That plugin is a 19.1.0-rc.2 release candidate, last published to npm in August 2025, and its upstream has since folded it into react-hooks. Both plugins now run compiler analysis over the same files and report the same bailouts under two rule ids. The CLAUDE.md compiler-compatibility test (reactCompiler.test.js:16) only checks the old react-compiler/react-compiler id, so it is tied to the stale plugin. Repair: drop the RC plugin and point the test at the react-hooks rule ids.

## PH-611 @radix-ui/react-dialog is declared but never imported

```yaml
id: PH-611
category: dependency
title: "@radix-ui/react-dialog is declared but never imported"
severity: cosmetic
traffic: 1
confidence: ai-suspected
evidence:
  - package.json:28
  - src/components/shared/AnimatedModal.jsx:4
source:
  - detect-dependency
repair_cost: S
fingerprint: dependency:package.json:unused-radix-dialog
```

No file in src/, api/ or scripts/ imports @radix-ui/react-dialog, and src/components/ui/ has no Dialog wrapper. Modals go through AnimatedModal, which uses vaul (AnimatedModal.jsx:4), and vaul already pulls react-dialog in transitively. The direct entry suggests a Radix Dialog primitive exists alongside the other ui/ wrappers when it does not, and Dependabot keeps bumping a package the app never touches directly.

## PH-612 @testing-library/dom sits in production dependencies though only tests use it

```yaml
id: PH-612
category: dependency
title: "@testing-library/dom sits in production dependencies though only tests use it"
severity: cosmetic
traffic: 1
confidence: ai-suspected
evidence:
  - package.json:38
  - package.json:73
  - src/components/__tests__/Badge.test.jsx:2
source:
  - detect-dependency
repair_cost: S
fingerprint: dependency:package.json:test-library-in-prod-deps
```

@testing-library/dom is never imported directly. It is there only to satisfy the peer dependency of @testing-library/react, which is correctly a devDependency (package.json:73) and is used only from __tests__ files. Listing it under dependencies misstates what ships, and production-only installs (npm ci --omit=dev) will install it for nothing.
