import { displayPath } from '../parse.mjs'

export function formatGithub({ findings, root }) {
  const lines = findings.map((finding) => {
    const file = displayPath(finding.path, root).replaceAll('\\', '/')
    const location = `file=${file},line=${finding.line},col=${finding.column || 1}`
    return `::${finding.level} ${location}::${finding.ruleId}: ${finding.message}`
  })
  if (lines.length === 0) return ''
  return `${lines.join('\n')}\n`
}
