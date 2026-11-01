# instr/self-modify

| | |
|---|---|
| Level | error |
| Since | 1.0.0 |
| Works offline | yes |
| Fixable | keep installs user-driven |

## What it catches

A skill that installs, updates or removes skills — including itself:
`git clone`/`curl`/`cp` targeting `~/.claude/skills` (or the agents/cursor/
codex/gemini equivalents), `rm -rf` on skill directories, and `skills add`
invocations.

```bash
git clone https://github.com/example/skill-pack.git ~/.claude/skills/skill-pack
```

## Why it matters

The skills directory is the user's trust boundary: they review what they
install. A skill that writes there rewrites that boundary at run time — one
malicious "pack installer" can fetch a second, worse skill that no one ever
reviewed. This is the on-path technique the skills.sh typosquat forks use to
spread copies of themselves.

## Remediation

Keep installation a user action. A skill may *recommend* other skills by name
and URL; it should not run the installer.

## Further reading

- [skills.sh leaderboard (typosquat copies visible)](https://skills.sh)
- [CSA: Agent context poisoning — SKILL.md](https://labs.cloudsecurityalliance.org/research/csa-research-note-skill-md-agent-context-poisoning-20260506/)
