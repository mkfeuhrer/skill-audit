import { CODE_KINDS, linesOf } from '../_shared.mjs'

export const rule = {
  id: 'exec/shell-true',
  level: 'warning',
  shortDescription: 'Shell execution surface',
  help: 'These primitives run arbitrary commands. Justify each one in the skill body or remove it.',
  check(file) {
    /** @type {[RegExp, string][]} */
    const patterns = [
      [/shell\s*:\s*true/, 'child process spawned with shell: true'],
      [/\bchild_process\b/, 'child_process imported'],
      [/\bexecSync\s*\(/, 'execSync called'],
      [/\beval\s*\(/, 'eval() called'],
      [/\bnew Function\s*\(/, 'new Function() constructed'],
      [/--dangerously-skip-permissions/, 'agent permission checks disabled'],
    ]
    const findings = []
    for (const row of linesOf(file, CODE_KINDS)) {
      for (const [regex, message] of patterns) {
        if (regex.test(row.text)) {
          findings.push({ ruleId: this.id, level: this.level, message: `${message}.`, line: row.line, column: row.column })
        }
      }
    }
    return findings
  },
}
