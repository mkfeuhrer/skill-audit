import { rules, ruleById } from './rules/index.mjs'
import { collectFiles, parseInstructionFile, parseScript, isInstructionFile, displayPath } from './parse.mjs'
import { formatText } from './report/text.mjs'
import { formatJson } from './report/json.mjs'
import { formatSarif } from './report/sarif.mjs'

export { rules, ruleById, collectFiles, parseInstructionFile, parseScript, isInstructionFile, displayPath }

export function auditFiles(files, config = {}) {
  const ignored = new Set(config.ignore || [])
  const findings = []
  const seen = new Set()

  for (const file of files) {
    for (const rule of rules) {
      if (ignored.has(rule.id)) continue
      const results = rule.check(file, config) || []
      for (const finding of results) {
        const key = `${finding.ruleId}|${file.path}|${finding.line}|${finding.message}`
        if (seen.has(key)) continue
        seen.add(key)
        findings.push({ ...finding, path: file.path })
      }
    }
  }

  findings.sort(
    (a, b) => a.path.localeCompare(b.path) || a.line - b.line || a.ruleId.localeCompare(b.ruleId),
  )

  return { findings, summary: summarize(findings) }
}

export async function auditTargets(targets, config = {}) {
  const files = await collectFiles(targets, { includeScripts: config.includeScripts })
  return { files, ...auditFiles(files, config) }
}

export function summarize(findings) {
  const summary = { error: 0, warning: 0, note: 0, total: findings.length }
  for (const finding of findings) {
    if (finding.level in summary) summary[finding.level] += 1
  }
  return summary
}

export function exceedsThreshold(summary, failOn) {
  if (failOn === 'none') return false
  if (failOn === 'warning') return summary.error + summary.warning > 0
  return summary.error > 0
}

export function format(findings, summary, options = {}) {
  const reporter = options.format || 'text'
  const payload = { summary, findings, root: options.root || process.cwd() }
  if (reporter === 'json') return formatJson(payload)
  if (reporter === 'sarif') return formatSarif(payload)
  return formatText(payload)
}
