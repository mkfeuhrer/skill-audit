import { CODE_KINDS, linesOf } from '../_shared.mjs'

export const rule = {
  id: 'exec/persistence',
  level: 'error',
  shortDescription: 'Installs a persistence mechanism',
  help: 'Skills have no business registering cron jobs, launch agents, systemd units or scheduled tasks. Persistence outlives the session and hides from the user.',
  check(file) {
    const patterns = [
      /\bcrontab\b/,
      /\blaunchctl\s+(?:load|unload|bootstrap|enable)\b/,
      /\bschtasks\b/,
      /\bsc\s+create\b/,
      /\bsystemctl\s+enable\b/,
      /\/etc\/cron/,
      /\brc\.local\b/,
    ]
    const findings = []
    for (const row of linesOf(file, CODE_KINDS)) {
      if (patterns.some((regex) => regex.test(row.text))) {
        findings.push({
          ruleId: this.id,
          level: this.level,
          message: 'Installs or configures a persistence mechanism.',
          line: row.line,
          column: row.column,
        })
      }
    }
    return findings
  },
}
