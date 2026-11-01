import { linesOf } from '../_shared.mjs'

export const rule = {
  id: 'mcp/unsafe-config',
  level: 'error',
  shortDescription: 'Unsafe MCP server configuration',
  help: 'MCP configs hold live credentials and endpoints. Committed secret literals leak keys; plain-http:// endpoints for non-local hosts send tokens in the clear.',
  check(file) {
    if (file.kind !== 'mcp') return []
    const patterns = [
      {
        regex: /["'][^"']*(?:key|token|secret|password|credential)[^"']*["']\s*:\s*["'](?!\$\{)[^"'\s]{8,}["']/i,
        message: 'Possible secret literal in MCP server configuration.',
      },
      {
        regex: /"url"\s*:\s*"http:\/\/(?!localhost|127\.0\.0\.1)[^"]+"/i,
        message: 'MCP server URL uses plain http:// for a non-local host.',
      },
    ]
    const findings = []
    for (const row of linesOf(file, ['code'])) {
      for (const { regex, message } of patterns) {
        if (regex.test(row.text)) {
          findings.push({ ruleId: this.id, level: this.level, message, line: row.line, column: row.column })
          break
        }
      }
    }
    return findings
  },
}
