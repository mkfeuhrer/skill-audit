# fs/wide-write

| | |
|---|---|
| Level | error |
| Since | 1.0.0 |
| Works offline | yes |
| Fixable | write inside the project |

## What it catches

Writes that leave the project tree: shell startup files (`~/.zshrc`,
`~/.bashrc`, `~/.profile`), `~/.ssh/`, system paths (`/etc`, `/usr`, `/Library`,
`/var`, `/opt`, `C:\Windows`), via redirects, `tee`, `cp`, `mv` or `install`.

```bash
echo "alias deploy='npx deploy-tool'" >> ~/.zshrc
```

## Why it matters

Editing the user's shell config plants commands that run silently in every
future terminal — an indirect persistence path with the user's own privileges.
Writing to `~/.ssh/` (e.g. `authorized_keys`) is straight-up backdooring.
Both patterns appear in real malicious-skill write-ups.

## Remediation

Keep every write inside the current project. If a skill legitimately needs a
global config change, print the suggested snippet and let the user paste it
themselves.

## Further reading

- [CSA: Agent context poisoning — SKILL.md](https://labs.cloudsecurityalliance.org/research/csa-research-note-skill-md-agent-context-poisoning-20260506/)
