import { linesOf } from '../_shared.mjs'

export const rule = {
  id: 'instr/consent-bypass',
  level: 'warning',
  shortDescription: 'Instructs the agent to skip user confirmation',
  help: 'Agents have permission prompts for a reason. Text that tells the model to act without asking, or commands that auto-answer prompts, removes the user from the loop.',
  check(file) {
    const patterns = [
      /\b(?:without|with no|no)\s+(?:asking|confirmation|approval|consent|prompting)\b/i,
      /\b(?:do not|don't|never)\s+ask\s+(?:the\s+)?user\b/i,
      /\b(?:do not|don't|never)\s+ask\s+for\s+(?:confirmation|approval|permission)/i,
      /\b(?:do not|don't|never)\s+(?:prompt|bother)\s+the\s+user/i,
      /\bautomatically\s+(?:approve|accept|confirm|proceed)\b/i,
      /\bproceed\s+(?:automatically|without)\b/i,
      /\byes\s*\|\s*(?:npm|pip3?|apt|brew|yarn|pnpm|install)/i,
    ]
    const findings = []
    for (const row of linesOf(file, ['prose', 'code'])) {
      for (const regex of patterns) {
        if (regex.test(row.text)) {
          findings.push({
            ruleId: this.id,
            level: this.level,
            message: 'Instructs the agent to act without user confirmation.',
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
