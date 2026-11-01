# AGENTS.md

Guidance for coding agents working on this repository.

## Project shape

- Zero runtime dependencies, Node ≥ 20, plain ESM `.mjs`. No build step —
  the source is the artifact.
- `src/rules/<category>/<rule>.mjs` holds one rule each; `src/rules/index.mjs`
  is the registry. Shared rule helpers live in `src/rules/_shared.mjs`.
- Report formats live in `src/report/`; suppression logic in `src/suppress.mjs`.
- Tests are `node --test` in `test/`, fixtures in `test/fixtures/`.

## Non-negotiables

1. `npm test` and `npm run typecheck` must pass before any commit.
2. Every rule change ships both fixture directions: a malicious fixture
   that trips it and a benign one that does not.
3. Never add runtime dependencies. `devDependencies` only.
4. Never let scanned content influence its own scan: suppressions come from
   the working directory only; inline allows stay opt-in.
5. Don't add real credentials, live hosts, or working exploit payloads to
   fixtures — placeholder shapes only.

## Conventions

- Conventional commit subjects: `feat(scope):`, `fix:`, `docs:`, `ci:`,
  `chore:`.
- Findings are plain objects (`ruleId`, `level`, `message`, `line`,
  `column`); rules return them from `check(file, context)`.
- Rule docs in `docs/rules/` must be updated in the same commit as the rule.
