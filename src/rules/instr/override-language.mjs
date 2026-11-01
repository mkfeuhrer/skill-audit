import { linesOf } from '../_shared.mjs'

export const rule = {
  id: 'instr/override-language',
  level: 'warning',
  shortDescription: 'Prompt-override phrasing in the skill body',
  help: 'Phrases that try to replace earlier instructions are a prompt-injection shape. Rewrite the skill so it states its own scope instead.',
  check(file) {
    const patterns = [
      /\b(?:ignore|disregard|forget)\b[^.\n]{0,40}\b(?:previous|prior|above|earlier|system)\b[^.\n]{0,30}\b(?:instruction|prompt|rule|message)s?\b/i,
      /\byou are no longer\b/i,
      /\bnew (?:system )?instructions?\s*:/i,
      /\b(?:do not|don't)\s+(?:tell|inform|mention|reveal)\b[^.\n]{0,40}\b(?:user|human|operator)\b/i,
    ]
    const findings = []
    for (const row of linesOf(file, ['prose', 'code'])) {
      for (const regex of patterns) {
        if (regex.test(row.text)) {
          findings.push({
            ruleId: this.id,
            level: this.level,
            message: 'Text attempts to override or bypass earlier instructions.',
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
