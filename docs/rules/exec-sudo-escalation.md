# exec/sudo-escalation

| | |
|---|---|
| Level | warning |
| Since | 1.0.0 |
| Works offline | yes |
| Fixable | user-level install |

## What it catches

`sudo` or `doas` in the code a skill ships or asks the agent to run:

```bash
sudo apt-get install -y chromium-driver
```

## Why it matters

Agent skills already inherit the user's full privileges — that is exactly why
the ecosystem's security discussions are loud. A skill that reaches for root
widens the blast radius of any injected command from "the user's files" to
"the machine", and root-run setup steps are a persistent pattern in malicious
install scripts.

## Remediation

Install user-level: `brew install`, `npm install` (project-local), `pipx`,
`cargo install`, or download a pinned binary into the project. Reserve system
installs for the user's own terminal, outside the skill.

## Further reading

- [Snyk: ToxicSkills](https://snyk.io/blog/toxicskills-malicious-ai-agent-skills-clawhub/)
