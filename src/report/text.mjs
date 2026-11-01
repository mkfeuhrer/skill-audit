import { displayPath } from '../parse.mjs'

export function formatText({ findings, summary, root }) {
  const lines = []
  for (const finding of findings) {
    const location = `${displayPath(finding.path, root)}:${finding.line}:${finding.column || 1}`
    lines.push(`${finding.level.padEnd(7)} ${location}  ${finding.ruleId}`)
    lines.push(`        ${finding.message}`)
  }
  if (findings.length) lines.push('')
  lines.push(
    `${summary.error} error(s), ${summary.warning} warning(s), ${summary.note} note(s) across ${new Set(findings.map((f) => f.path)).size} file(s)`,
  )
  return `${lines.join('\n')}\n`
}
