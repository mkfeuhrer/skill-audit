# Changelog

All notable changes to this project are documented here. The format follows
[Keep a Changelog](https://keepachangelog.com/en/1.1.0/).

## [1.0.0] — 2026-11-01

### Added

- Six governance rules: `exec/sudo-escalation`, `exec/persistence`,
  `fs/wide-write`, `instr/self-modify`, `instr/consent-bypass`,
  `mcp/unsafe-config`.
- Suppression system: `.skill-audit-ignore` (working-directory only) with
  rule ids, `rule@path` scoping and pinned fingerprints; opt-in inline
  `skill-audit:allow` markers (`--inline-allows`).
- Stable 40-character finding fingerprints in JSON output.
- Output formats: `markdown` (shareable report tables) and `github`
  (workflow annotations), alongside text, json and SARIF.
- Instruction formats: `.windsurfrules`, `.windsurf/rules/*.md`,
  `.clinerules`, `.github/copilot-instructions.md`.
- MCP configs (`mcp.json`, `.mcp.json`, `claude_desktop_config.json`) are
  now scanned as code, so exec/egress/fs rules apply to them.
- `--ignore-file` and `--inline-allows` flags; `inlineAllows` config key.
- Per-rule documentation under `docs/rules/`.
- Type-checking gate (`npm run typecheck`) via `tsc --checkJs`; runtime
  dependencies remain zero.

### Changed

- `instr/override-language` also catches persona-hijack phrasing
  ("you are now a …", "from now on you must …").
- `fs/credential-read` also covers `~/.kube`, `~/.docker/config.json`,
  `.git-credentials` and `credential.helper`.
- `egress/undeclared-host` no longer double-reports hosts already flagged
  as environment-interpolated URLs.

## [0.1.0] — 2026-10-31

- Initial scanner: 10 rules, text/json/SARIF output, malicious + benign
  fixture corpus, exit-code gating.
