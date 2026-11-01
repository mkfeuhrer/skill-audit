# perm/overbroad

| | |
|---|---|
| Level | warning |
| Since | 0.1.0 |
| Works offline | yes |
| Fixable | scope the grant |

## What it catches

Frontmatter tool grants with no scope: `allowed-tools: [Bash]`, `WebFetch`,
`WebSearch`, `mcp__*`, or `*` / `all`.

## Why it matters

An unrestricted grant pre-approves every future command the skill can dream
up — the skill equivalent of running CI with `permissions: write-all`, which
is what configuration auditors flag first in any other ecosystem. Scoped
grants cost one line and shrink the skill's reach to what it actually does.

## Remediation

Scope each grant to its real commands:

```yaml
allowed-tools: [Read, Grep, Bash(git diff:*), Bash(git log:*)]
```

and list the specific MCP tools you need rather than the whole server.

## Further reading

- [zizmor — the analogous auditor for GitHub Actions](https://github.com/zizmorcore/zizmor)
