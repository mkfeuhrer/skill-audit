import { CODE_KINDS, URL_RE, linesOf } from '../_shared.mjs'

const ENV_NAME_RE = /^[A-Z][A-Z0-9_]*$/
const SECRET_WORD_RE = /(KEY|TOKEN|SECRET|PASS|AUTH|ENV|HOST|API|DSN|WEBHOOK)/i

export const rule = {
  id: 'egress/env-interpolated-url',
  level: 'error',
  shortDescription: 'URL assembled from an environment-like value',
  help: 'A URL whose host or query is built from an environment or secret-shaped variable is the classic exfiltration shape. Use a documented literal host instead.',
  check(file) {
    const findings = []
    for (const row of linesOf(file, CODE_KINDS)) {
      const urls = row.text.match(URL_RE) || []
      for (const url of urls) {
        const interpolations = [...url.matchAll(/\$\{([^}]*)\}|\$([A-Za-z_]\w*)/g)]
        if (interpolations.length === 0) continue
        const names = interpolations.map((match) => (match[1] ?? match[2]).trim())
        const suspicious = names.some(
          (name) => ENV_NAME_RE.test(name) || SECRET_WORD_RE.test(name) || /^process\.env/.test(name),
        )
        if (!suspicious) continue
        findings.push({
          ruleId: this.id,
          level: this.level,
          message: `URL is assembled from environment-like value "${names.join(', ')}".`,
          line: row.line,
          column: row.column,
        })
        break
      }
    }
    return findings
  },
}
