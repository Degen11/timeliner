# Verdicts: dependency

Inspector: inspect-dependency. Coverage: every finding judged. All evidence refs opened (og.js, package.json, dependabot.yml, og.test.js, commit 5dd591a, eslint.config.js, reactCompiler.test.js, AnimatedModal.jsx, Badge.test.jsx) plus package-lock.json entries. No node_modules present; react-hooks 7 compiler-rule claim judged from lockfile deps and upstream knowledge. Unused-dependency and duplication slices are AI-only (knip not run).

## PH-609 refuted

```yaml
id: PH-609
verdict: refuted
reason: "evidence: api/og.js:12-13 names 1.0.x (not 'newer builds') as the
  version that throws on import; package.json:40 ^0.11.1 caret on 0.x caps at
  <0.12.0 and dependabot.yml:18-20 ignores semver-major, so the stated hazard IS
  enforced and 5dd591a (0.8.6->0.11.1) never crossed it. Residual is a stale
  '0.8.x' wording in og.js and CLAUDE.md — documentation drift, not dependency
  debt; refile there next scan."
fingerprint: dependency:api/og.js:vercel-og-constraint-unenforced
```

## PH-610 confirmed

```yaml
id: PH-610
verdict: confirmed
reason: "Checked: eslint.config.js:6/24/31 loads standalone
  eslint-plugin-react-compiler (lockfile 19.1.0-rc.2) while :29 spreads
  reactHooks.configs.recommended from eslint-plugin-react-hooks 7.1.1, whose
  lockfile deps (@babel/core, hermes-parser, zod) are the embedded compiler and
  whose recommended set includes the compiler rules; reactCompiler.test.js:16
  filters only react-compiler/react-compiler. CLAUDE.md documents the plugin but
  not why both are needed — documented route does not refute the duplication
  cost."
fingerprint: dependency:eslint.config.js:duplicate-react-compiler-lint-plugins
```

## PH-611 confirmed

```yaml
id: PH-611
verdict: confirmed
reason: "Checked: grep of src/, api/, scripts/ finds no @radix-ui/react-dialog
  import; src/components/ui has no Dialog wrapper; AnimatedModal.jsx:4 uses
  vaul, and lockfile shows vaul depends on @radix-ui/react-dialog ^1.1.1, so the
  direct entry at package.json:28 is redundant. No survey migration or exclusion
  covers it."
fingerprint: dependency:package.json:unused-radix-dialog
```

## PH-612 confirmed

```yaml
id: PH-612
verdict: confirmed
reason: "Checked: no direct import of @testing-library/dom in src/, api/,
  scripts/ or vite config; lockfile shows it is a peerDependency of
  @testing-library/react (devDependency, package.json:73) used only from
  __tests__ (e.g. Badge.test.jsx:2); listing it at package.json:38 under
  dependencies misstates what ships. Cosmetic as filed."
fingerprint: dependency:package.json:test-library-in-prod-deps
```
