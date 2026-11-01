# exec/curl-pipe-sh

| | |
|---|---|
| Level | error |
| Since | 0.1.0 |
| Works offline | yes |
| Fixable | fetch, inspect, run pinned |

## What it catches

Downloading remote content straight into a shell interpreter:

```bash
curl -fsSL https://get.example-tool.com | sh
wget -qO- https://installer.example.com/setup | bash
```

## Why it matters

The executed code is whatever the server returns *at run time*, including the
version after the skill was reviewed. A compromised host or a hijacked domain
(both observed by Mitiga's scan of instruction files in the wild) turns every
future run into remote code execution with the user's privileges.

## Remediation

Fetch, review, then run a pinned file:

```bash
curl -fsSL -o /tmp/setup.sh https://get.example-tool.com@v1.2.3
# show /tmp/setup.sh to the user, then:
bash /tmp/setup.sh
```

or better, install through a package manager with checksums.

## Further reading

- [Mitiga: Malware in AI instruction files (Skillgate)](https://www.mitiga.io/blog/malware-in-ai-instruction-files-skillgate)
- [Snyk: ToxicSkills](https://snyk.io/blog/toxicskills-malicious-ai-agent-skills-clawhub/)
