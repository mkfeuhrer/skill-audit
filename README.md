# skill-audit

Static scanner for agent instruction files: `SKILL.md`, `CLAUDE.md`,
`AGENTS.md`, `.cursorrules`, `.cursor/rules/*.mdc` and MCP configs.

The skills ecosystem is full of repos that *write* skills. This one reads them
and tells you what they will actually do: which hosts they talk to, which
credentials they touch, and what is hidden in the text a reviewer never sees.

Zero runtime dependencies. `npx`-able. Node 20+.

## Usage

```shell
npx skill-audit ~/.claude/skills
skill-audit ./skills --format sarif --fail-on warning
skill-audit --list-rules
```

| Option | Default | Meaning |
|---|---|---|
| `--format <text\|json\|sarif>` | `text` | `sarif` is SARIF 2.1.0 for GitHub code scanning |
| `--fail-on <error\|warning\|none>` | `error` | Exit-code threshold |
| `--config <path>` | `.skill-audit.json` | Optional config |
| `--no-scripts` | off | Skip sibling `scripts/` directories |
| `--list-rules` | — | Print rule ids and levels |

Exit codes: `0` clean, `1` findings at or above the threshold, `2` usage error.

## Rules

| Rule | Level | Catches |
|---|---|---|
| `egress/undeclared-host` | warning | Request calls or query-string URLs to hosts the skill does not declare |
| `egress/env-interpolated-url` | error | URL host or query built from an environment or secret-shaped variable |
| `exec/curl-pipe-sh` | error | `curl … \| sh` and friends |
| `exec/shell-true` | warning | `child_process`, `execSync`, `eval`, `new Function`, `--dangerously-skip-permissions` |
| `fs/credential-read` | error | Reads of `~/.ssh`, `~/.aws`, `.env`, `.npmrc`, `.netrc`, keychain |
| `instr/hidden-unicode` | warning | Zero-width, bidi, soft-hyphen and tag characters |
| `instr/html-comment-instruction` | warning | Imperative text or URLs inside HTML comments |
| `instr/override-language` | warning | "ignore previous instructions" phrasing |
| `perm/overbroad` | warning | `Bash`, `WebFetch`, `*` or `mcp__*` with no scope |
| `meta/obfuscated-blob` | warning | Base64 runs over 400 chars, hex runs over 512 |

`egress/undeclared-host` only reports a host when the URL appears in a request
call (`fetch`, `curl`, `requests.get`, …) or carries a query string, so
documentation links and licence URLs stay quiet.

## Config

```json
{
  "allowedHosts": ["api.example.com"],
  "ignore": ["egress/undeclared-host"]
}
```

Skills can declare their own hosts in frontmatter, which beats a global
allowlist:

```yaml
allowed-hosts: [api.example.com]
```

## The corpus

`test/fixtures/` ships 8 malicious and 6 benign skills, one per rule plus
controls, including a templated-URL skill that must *not* be flagged. Every
rule needs a positive fixture and a negative one, so tightening a rule cannot
silently regress it.

The corpus is the part worth forking. If you find a false positive in the wild,
add a benign fixture, then fix the rule.

## What it found on a real corpus

Run against 27 local agent skills:

```
summary { error: 0, warning: 41, note: 0, total: 41 }
{
  'egress/undeclared-host (warning)': 11,
  'exec/shell-true (warning)': 30
}
```

No errors. The 11 host findings covered 8 distinct destinations, including the
museum and archive APIs a design skill calls without declaring them. The 30
shell warnings were `eval` and `child_process` uses in browser-automation
scripts. Two host findings were harmless: a fonts CDN and a placeholder domain.

## GitHub Action

```yaml
- uses: actions/setup-node@v4
  with:
    node-version: 22
- run: npx skill-audit ./skills --format sarif --fail-on warning > skill-audit.sarif
- uses: github/codeql-action/upload-sarif@v3
  if: always()
  with:
    sarif_file: skill-audit.sarif
```

## Limits

- Static only. It reads text; it does not run, sandbox or trace a skill.
- Best-effort patterns. A determined author can evade every rule here, and a
  clean report is not a safety guarantee.
- Markdown code fences are scanned as code. Prose links are not flagged.
- POSIX paths only in v1.

## Development

```shell
npm test          # node --test, no install required
npm test -- --watch
```

8 malicious fixtures, 6 benign fixtures, 40 tests.

## License

MIT
