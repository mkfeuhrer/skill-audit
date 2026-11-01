import { createHash } from 'node:crypto'
import { readFileSync } from 'node:fs'
import { rules } from '../rules/index.mjs'
import { displayPath } from '../parse.mjs'

const pkg = JSON.parse(readFileSync(new URL('../../package.json', import.meta.url), 'utf8'))

const SARIF_LEVEL = { error: 'error', warning: 'warning', note: 'note' }

function fingerprint(ruleId, file, message) {
  return createHash('sha256').update(`${ruleId}:${file}:${message}`).digest('hex').slice(0, 40)
}

export function formatSarif({ findings, root }) {
  const used = new Set(findings.map((finding) => finding.ruleId))
  const driverRules = rules
    .filter((rule) => used.has(rule.id))
    .map((rule) => ({
      id: rule.id,
      name: rule.id.split('/').pop(),
      shortDescription: { text: rule.shortDescription },
      help: { text: rule.help },
      defaultConfiguration: { level: SARIF_LEVEL[rule.level] || 'warning' },
    }))

  const results = findings.map((finding) => {
    const file = displayPath(finding.path, root)
    return {
      ruleId: finding.ruleId,
      level: SARIF_LEVEL[finding.level] || 'warning',
      message: { text: finding.message },
      locations: [
        {
          physicalLocation: {
            artifactLocation: { uri: file.replaceAll('\\', '/') },
            region: { startLine: finding.line, startColumn: finding.column || 1 },
          },
        },
      ],
      partialFingerprints: { 'skill-audit/v1': fingerprint(finding.ruleId, file, finding.message) },
    }
  })

  const sarif = {
    $schema: 'https://json.schemastore.org/sarif-2.1.0.json',
    version: '2.1.0',
    runs: [
      {
        tool: {
          driver: {
            name: 'skill-audit',
            informationUri: 'https://github.com/mkfeuhrer/skill-audit',
            version: pkg.version,
            rules: driverRules,
          },
        },
        results,
      },
    ],
  }

  return `${JSON.stringify(sarif, null, 2)}\n`
}
