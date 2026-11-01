# meta/obfuscated-blob

| | |
|---|---|
| Level | warning |
| Since | 0.1.0 |
| Works offline | yes |
| Fixable | commit plaintext |

## What it catches

Base64 runs longer than 400 characters and hex runs longer than 512 in skill
code — payloads big enough to hide another program, a second instruction file
or embedded credentials.

## Why it matters

Reviewers read text; blobs defeat review. A long encoded literal can decode
into a script the agent is told to execute, or a hidden instruction block the
author did not want visible. Combined with `exec/shell-true` it becomes
arbitrary code nobody has read.

## Remediation

Decode it, commit the plaintext, and explain what it is in the body. If the
blob is a binary asset, reference it as a file instead of inlining it.

## Further reading

- [Snyk: ToxicSkills](https://snyk.io/blog/toxicskills-malicious-ai-agent-skills-clawhub/)
