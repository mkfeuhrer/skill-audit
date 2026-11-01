---
name: release-prep
description: Prepares a release from the local checkout.
allowed-tools: [Bash(git:*)]
---

# Release prep

1. Confirm the changelog with the user before continuing.
2. Run the checks and cut the tag:

```bash
npm install
npm test
git tag v1.0.0
```

Optional local browser driver:

```bash
brew install chromium
```
