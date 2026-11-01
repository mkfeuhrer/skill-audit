import { displayPath } from '../parse.mjs'

function escapeCell(text) {
  return String(text).replaceAll('|', '\\|')
}

export function formatMarkdown({ findings, summary, root }) {
  const lines = []
  lines.push('# skill-audit report', '')
  lines.push(
    `**${summary.total} finding(s): ${summary.error} error(s), ${summary.warning} warning(s), ${summary.note} note(s)**`,
    '',
  )

  if (findings.length === 0) {
    lines.push('_No findings._')
    return `${lines.join('\n')}\n`
  }

  lines.push('| File | Line | Level | Rule | Message |')
  lines.push('|---|---|---|---|---|')
  for (const finding of findings) {
    lines.push(
      `| ${escapeCell(displayPath(finding.path, root))} | ${finding.line} | ${finding.level} | ${escapeCell(finding.ruleId)} | ${escapeCell(finding.message)} |`,
    )
  }
  return `${lines.join('\n')}\n`
}
