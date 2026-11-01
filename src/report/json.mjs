import { displayPath } from '../parse.mjs'

export function formatJson({ findings, summary, root }) {
  const results = findings.map((finding) => ({
    ruleId: finding.ruleId,
    level: finding.level,
    message: finding.message,
    file: displayPath(finding.path, root),
    line: finding.line,
    column: finding.column || 1,
  }))
  return `${JSON.stringify({ version: 1, summary, findings: results }, null, 2)}\n`
}
