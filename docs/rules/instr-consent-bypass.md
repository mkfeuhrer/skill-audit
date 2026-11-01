# instr/consent-bypass

| | |
|---|---|
| Level | warning |
| Since | 1.0.0 |
| Works offline | yes |
| Fixable | keep the prompts |

## What it catches

Text telling the agent to skip the user: "deploy without asking the user",
"don't prompt the user", "automatically approve", "proceed without
confirmation" — and auto-yes pipes like `yes | npm run deploy`.

## Why it matters

Permission prompts are the last control the user has over what an agent
actually executes. A skill that pre-emptively suppresses them converts
"assist me" into "act for me" — and does it in the input the user is least
likely to read carefully. Real malicious skills pair exactly this language
with the destructive command that follows.

## Remediation

Let the prompts fire. If the workflow genuinely has a safe default, name the
exact command the user can pre-approve themselves — their choice, not the
skill's.

## Further reading

- [Snyk: ToxicSkills](https://snyk.io/blog/toxicskills-malicious-ai-agent-skills-clawhub/)
