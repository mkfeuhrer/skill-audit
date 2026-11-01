import { CODE_KINDS, linesOf } from '../_shared.mjs'

export const rule = {
  id: 'exec/sudo-escalation',
  level: 'warning',
  shortDescription: 'Privilege escalation attempt',
  help: 'Agent skills already run with the user\'s privileges. sudo or doas in skill code is a privilege-escalation signal; install steps should use the user-level package manager.',
  check(file) {
    const patterns = [/\bsudo\b/, /\bdoas\b/]
    const findings = []
    for (const row of linesOf(file, CODE_KINDS)) {
      for (const regex of patterns) {
        if (regex.test(row.text)) {
          findings.push({
            ruleId: this.id,
            level: this.level,
            message: 'Runs a command through sudo or doas.',
            line: row.line,
            column: row.column,
          })
          break
        }
      }
    }
    return findings
  },
}
