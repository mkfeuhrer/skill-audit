# Benchmark results

Captured 2026-11-01 with skill-audit 1.0.0 against six corpora. Every run is
static and offline: the repos were shallow-cloned to a scratch directory and
read, never executed. Paths inside each report are relative to that corpus's
root.

Reproduce with:

```shell
git clone --depth 1 https://github.com/<owner>/<repo>.git <repo>
node bin/skill-audit.mjs <repo> --fail-on none --format json
node bin/skill-audit.mjs <repo> --fail-on none --format markdown
```

| Corpus | Files scanned (skills / sibling scripts) | Errors | Warnings | Headline rules |
|---|---|---|---|---|
| [anthropics/skills](https://github.com/anthropics/skills) | 20 / 64 | 0 | 4 | `instr/consent-bypass` ×3, `egress/undeclared-host` ×1 |
| [obra/superpowers](https://github.com/obra/superpowers) | 17 / 9 | 4 | 3 | `egress/env-interpolated-url` ×4, `instr/consent-bypass` ×2 |
| [addyosmani/agent-skills](https://github.com/addyosmani/agent-skills) | 28 / 19 | 5 | 14 | `exec/shell-true` ×9, `fs/credential-read` ×5, `instr/consent-bypass` ×3 |
| [magentosh/superpowers](https://github.com/magentosh/superpowers)¹ | 86 / 0 | **366** | 7 | `instr/self-modify` ×357, `exec/curl-pipe-sh` ×3, `exec/persistence` ×2 |
| [bankai-skills/superpowers](https://github.com/bankai-skills/superpowers)¹ | 86 / 0 | **366** | 7 | `instr/self-modify` ×357, `exec/curl-pipe-sh` ×3, `exec/persistence` ×2 |
| local `~/.claude/skills` (28 installed skills) | 28 / 18 | 2 | 43 | `exec/shell-true` ×30, `egress/undeclared-host` ×11, `instr/self-modify` ×2 |

¹ Typosquat copies of `obra/superpowers` listed openly on the
[skills.sh](https://skills.sh) leaderboard. Both scans returned identical
results — auto-generated copies of the same generated content.

## Reading the numbers

- **The typosquat test.** The real `obra/superpowers` audits at 7 findings.
  Its two typosquat clones audit at **373 findings each, 366 of them
  error-level**, led by **357 `instr/self-modify` hits**: their generated
  `SKILL.md` files embed `npx skills add …` install commands, so every skill
  is a self-spreader. This is the exact install decision skill-audit exists
  to inform.
- **Signals, not verdicts.** `obra/superpowers` itself is not malicious —
  its hits are env-interpolated URLs inside its own *maintenance* scripts
  (`scripts/sync-to-codex-plugin.sh`), worth a look, not a removal. The
  official `anthropics/skills` corpus is essentially clean at the
  warning level. A finding is a question, and every rule page in
  [`docs/rules/`](../../docs/rules/) explains what the question is.
- **Local installs.** The 28-skill local corpus produced 2 errors
  (`instr/self-modify` in a skill-manager skill that runs `npx skills add`)
  and 30 `exec/shell-true` warnings from browser-automation scripts — the
  common, mostly-benign shape that rule exists to surface.

## Files

- `<corpus>.json` — machine-readable findings with stable fingerprints
- `<corpus>.md` — shareable markdown report
