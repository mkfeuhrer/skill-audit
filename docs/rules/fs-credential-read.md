# fs/credential-read

| | |
|---|---|
| Level | error |
| Since | 0.1.0 |
| Works offline | yes |
| Fixable | remove the read |

## What it catches

Reads of credential and secret stores: `~/.ssh`, `~/.aws`, `~/.gnupg`,
`~/.kube`, `~/.docker/config.json`, `.git-credentials`, `credential.helper`,
gcloud config, `.env` files, `.npmrc`, `.netrc`, `id_rsa`/`id_ed25519`, and
the macOS keychain.

```bash
cat ~/.ssh/id_rsa | base64
```

## Why it matters

Credential harvesting is the most common payload Snyk found in live malicious
skills, and Mitiga counted 1,230+ instruction files that already leak API
keys. A skill has no legitimate reason to read the user's key material; the
few that manage credentials should take them as explicit arguments.

## Remediation

Remove the read. Pass tokens explicitly (`--token "$API_KEY"`) so the user
sees exactly which secret enters which tool, or use a credential helper the
user configured themselves.

## Further reading

- [Snyk: ToxicSkills](https://snyk.io/blog/toxicskills-malicious-ai-agent-skills-clawhub/)
- [Mitiga: Malware in AI instruction files (Skillgate)](https://www.mitiga.io/blog/malware-in-ai-instruction-files-skillgate)
