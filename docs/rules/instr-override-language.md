# instr/override-language

| | |
|---|---|
| Level | warning |
| Since | 0.1.0 |
| Works offline | yes |
| Fixable | state scope, not hierarchy |

## What it catches

Phrasing that tries to replace or supersede other instructions: "disregard
the system prompt", "you are no longer bound by…", "you are now a …", "from
now on you must…", "new instructions:", and "don't tell the user" shapes.

## Why it matters

A skill is untrusted input to the agent, and override phrasing claims
authority over it. Even when the intent is playful (persona skills), the same
sentences are the working vocabulary of prompt injection — Snyk measured
prompt injection in 36% of the skills it tested, and the CSA's corpus
confirmed instruction-discarding payloads in confirmed-malicious skills.

## Remediation

Rewrite the skill to state its own scope ("when writing release notes, use
conventional commits") instead of asserting rank over other instructions.

## Further reading

- [Snyk: ToxicSkills](https://snyk.io/blog/toxicskills-malicious-ai-agent-skills-clawhub/)
- [CSA: Agent context poisoning — SKILL.md](https://labs.cloudsecurityalliance.org/research/csa-research-note-skill-md-agent-context-poisoning-20260506/)
