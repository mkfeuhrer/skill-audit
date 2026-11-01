# mcp/unsafe-config

| | |
|---|---|
| Level | error |
| Since | 1.0.0 |
| Works offline | yes |
| Fixable | secrets out of the file, TLS on |

## What it catches

Two shapes in MCP server configs (`mcp.json`, `.mcp.json`,
`claude_desktop_config.json`):

1. A secret literal under a key named `*key*`, `*token*`, `*secret*`,
   `*password*` or `*credential*`:

   ```json
   "env": { "OPENAI_API_KEY": "sk-proj-0a1b2c3d4e5f6g7h8i9j" }
   ```

2. An MCP server endpoint on plain `http://` for anything other than localhost.

## Why it matters

These files are committed, copied and shared far more than .env files ever
are — Mitiga found 1,230+ instruction files that already leak API keys. A
plain-http endpoint sends the same keys (and every prompt) in the clear to
whatever network the user is on.

## Remediation

Reference secrets, don't inline them (`"OPENAI_API_KEY": "${OPENAI_API_KEY}"`
resolved by the launcher, or OS keychain), and use `https://` endpoints
everywhere except loopback.

## Further reading

- [Mitiga: Malware in AI instruction files (Skillgate)](https://www.mitiga.io/blog/malware-in-ai-instruction-files-skillgate)
- [Model Context Protocol documentation](https://modelcontextprotocol.io)
