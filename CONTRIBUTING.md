# Contributing

Thanks for helping make skills safer to install.

## Ground rules

- **Zero runtime dependencies.** Node built-ins only. `devDependencies`
  (typescript, @types/node) are fine; anything in `dependencies` is not.
- **Every rule ships four things:** a module, a malicious fixture that trips
  it, a benign fixture that does not, and a docs page. A rule without its
  negative fixture is how false-positive regressions slip in.
- **High signal.** Default output must stay worth reading. Noisy patterns
  belong behind tighter matching, not behind a config flag.

## Adding or changing a rule

1. Create `src/rules/<category>/<rule-name>.mjs` following an existing rule —
   `id`, `level` (`error` | `warning`), `shortDescription`, `help`, and
   `check(file, context)` returning findings with `line` and `column`.
   Import shared helpers from `src/rules/_shared.mjs`.
2. Register it in `src/rules/index.mjs`.
3. Add `test/fixtures/malicious/<rule-name>/` and a benign counterpart, then
   wire both into `test/rules.test.mjs` (`MALICIOUS` map, `BENIGN` list).
4. Write `docs/rules/<category>-<rule-name>.md` — what it catches, why it
   matters, remediation, further reading.
5. `npm test && npm run typecheck`, then open the PR with the fixture that
   motivated the change (a real-world false positive is the best possible
   test case).

## Fixes and docs

Small fixes and docs improvements need no issue first. For new rules or
behavior changes, open an issue first with the corpus that motivates it.

## Commits

Conventional-style subjects in the imperative (`feat(rules): …`,
`fix: …`, `docs: …`). Every commit keeps `npm test` green.

## Security

See [SECURITY.md](SECURITY.md). Do not commit real credentials as fixture
material — use placeholder shapes like `sk-proj-…` strings.
