export const rule = {
  id: 'perm/overbroad',
  level: 'warning',
  shortDescription: 'Unrestricted tool grant',
  help: 'Scope tool grants, e.g. Bash(git:*) instead of Bash, and list the specific MCP tools you need.',
  check(file) {
    const key = ['allowed-tools', 'allowed_tools', 'allowedTools'].find((candidate) => candidate in file.frontmatter)
    if (!key) return []
    const raw = file.frontmatter[key]
    const entries = Array.isArray(raw) ? raw : String(raw).split(',')
    const line = file.frontmatterLines.get(key) || 1
    const findings = []
    for (const value of entries.map((entry) => String(entry).trim()).filter(Boolean)) {
      let message = null
      if (value === '*' || value.toLowerCase() === 'all') message = 'Grants every tool.'
      else if (value === 'Bash') message = 'Grants Bash with no command restriction.'
      else if (value === 'WebFetch' || value === 'WebSearch') message = `Grants unrestricted ${value}.`
      else if (value === 'mcp__*' || value === 'mcp') message = 'Grants every MCP tool.'
      if (message) findings.push({ ruleId: this.id, level: this.level, message, line, column: 1 })
    }
    return findings
  },
}
