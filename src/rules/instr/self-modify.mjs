import { CODE_KINDS, linesOf } from '../_shared.mjs'

const SKILL_DIR =
  /(?:~|\$HOME|\/Users\/[^/\s"']+)\/\.(?:claude|agents|cursor|codex|gemini)\/(?:skills|plugins)/

export const rule = {
  id: 'instr/self-modify',
  level: 'error',
  shortDescription: 'Skill modifies the skill installation itself',
  help: 'A skill that installs, updates or removes other skills (or its own directory) rewrites the trust boundary the user reviewed. Keep skill installation as a user action.',
  check(file) {
    const patterns = [
      new RegExp(`\\b(?:git\\s+clone|curl|wget|cp|mv|tar)\\b[^|;&]{0,200}${SKILL_DIR.source}`),
      new RegExp(`\\brm\\s+(?:-[a-zA-Z]+\\s+)*${SKILL_DIR.source}`),
      /\b(?:npx\s+)?skills\s+add\b/,
    ]
    const findings = []
    for (const row of linesOf(file, CODE_KINDS)) {
      for (const regex of patterns) {
        if (regex.test(row.text)) {
          findings.push({
            ruleId: this.id,
            level: this.level,
            message: 'Modifies the skill installation itself (installs, updates, or removes skills).',
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
