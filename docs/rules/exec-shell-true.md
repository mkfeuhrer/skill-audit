# exec/shell-true

| | |
|---|---|
| Level | warning |
| Since | 0.1.0 |
| Works offline | yes |
| Fixable | replace the primitive |

## What it catches

Shell-execution primitives in skill code: `child_process`, `execSync`, `eval`,
`new Function`, `shell: true` child processes, and
`--dangerously-skip-permissions`-style agent flags.

## Why it matters

Each of these is an arbitrary-command sink. In benign browser-automation skills
they are common and unexciting; combined with data read from a model or a
remote file they become the execution half of an injection chain. The
`--dangerously-skip-permissions` pattern additionally removes the user's own
consent gate.

## Remediation

Prefer APIs that take structured arguments (`execFile`, argument arrays) over
string-shelling, and drop permission-bypass flags from every example command a
skill prints. If a `shell: true` call is genuinely needed, keep its input
static and say so in the skill body.

## Further reading

- [CSA: Agent context poisoning — SKILL.md](https://labs.cloudsecurityalliance.org/research/csa-research-note-skill-md-agent-context-poisoning-20260506/)
