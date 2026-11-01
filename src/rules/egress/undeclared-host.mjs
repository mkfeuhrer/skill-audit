import { CODE_KINDS, URL_RE, hostAllowed, linesOf } from '../_shared.mjs'

const CALL_CONTEXT_RE =
  /\b(?:fetch|curl|wget|requests\.(?:get|post)|axios\.(?:get|post)|urllib\.request|http\.(?:get|request)|https\.(?:get|request)|Invoke-WebRequest)\b/

export const rule = {
  id: 'egress/undeclared-host',
  level: 'warning',
  shortDescription: 'Network destination not declared by the skill',
  help: 'List expected hosts under "allowed-hosts" in frontmatter or in .skill-audit.json. A host is reported when the URL is used in a request call or carries a query string, so documentation links stay quiet.',
  check(file, context) {
    const allowed = [
      ...(Array.isArray(file.frontmatter['allowed-hosts']) ? file.frontmatter['allowed-hosts'] : []),
      ...(context.allowedHosts || []),
    ]
    const findings = []
    const seen = new Set()
    for (const row of linesOf(file, CODE_KINDS)) {
      const inRequest = CALL_CONTEXT_RE.test(row.text)
      const urls = row.text.match(URL_RE) || []
      for (const url of urls) {
        if (!inRequest && !url.includes('?')) continue
        const host = (url.match(/^https?:\/\/([^/:?#]+)/) || [])[1]
        if (!host || host.includes('${') || hostAllowed(host, allowed)) continue
        const key = `${row.line}:${host}`
        if (seen.has(key)) continue
        seen.add(key)
        findings.push({
          ruleId: this.id,
          level: this.level,
          message: `Sends data to undeclared host "${host}".`,
          line: row.line,
          column: row.column,
        })
      }
    }
    return findings
  },
}
