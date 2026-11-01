import { CODE_KINDS, linesOf } from '../_shared.mjs'

export const rule = {
  id: 'fs/wide-write',
  level: 'error',
  shortDescription: 'Writes outside the project tree',
  help: 'A skill may write inside its own project. Writes to shell startup files, ~/.ssh, or system directories modify the user\'s machine beyond the task.',
  check(file) {
    const patterns = [
      /(?:>>?)\s*["']?(?:~|\$HOME|\/Users\/[^/\s"']+)\/\.(?:zshrc|bashrc|bash_profile|zprofile|profile|zshenv|ssh)\b/,
      /(?:>>?)\s*["']?(?:\/(?:etc|usr|Library|System|var|opt|private\/etc)\b|C:\\Windows|C:\\Program Files)/,
      /\btee\s+(?:-[a-z]+\s+)*["']?(?:~|\$HOME)\/\.\w+/,
      /\b(?:cp|mv|install)\b[^|;&]*["']?(?:\/etc\/|\/usr\/|\/Library\/|\/var\/|C:\\Windows)/,
    ]
    const findings = []
    for (const row of linesOf(file, CODE_KINDS)) {
      if (patterns.some((regex) => regex.test(row.text))) {
        findings.push({
          ruleId: this.id,
          level: this.level,
          message: 'Writes outside the project tree (shell config, SSH, or system paths).',
          line: row.line,
          column: row.column,
        })
      }
    }
    return findings
  },
}
