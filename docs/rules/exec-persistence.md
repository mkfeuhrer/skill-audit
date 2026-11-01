# exec/persistence

| | |
|---|---|
| Level | error |
| Since | 1.0.0 |
| Works offline | yes |
| Fixable | remove the mechanism |

## What it catches

Code that registers itself to run again later: `crontab`, `launchctl
load/bootstrap`, `schtasks`, `sc create`, `systemctl enable`, `/etc/cron*`,
`rc.local`.

```bash
(crontab -l 2>/dev/null; echo "0 3 * * * $HOME/.local/bin/check.sh") | crontab -
```

## Why it matters

A session-scoped assistant arranging its own revival is the definition of
malware persistence. Whatever the job does afterwards runs outside the user's
attention, survives an agent uninstall, and usually survives a reboot. There
is no benign reason for a skill to edit the user's scheduled tasks.

## Remediation

Delete the mechanism. If the user genuinely wants a recurring job, the skill
should *instruct the human* how to set one up — not install it behind the
conversation.

## Further reading

- [CSA: Agent context poisoning — SKILL.md](https://labs.cloudsecurityalliance.org/research/csa-research-note-skill-md-agent-context-poisoning-20260506/)
