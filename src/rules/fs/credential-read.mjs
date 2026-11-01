import { CODE_KINDS, linesOf } from '../_shared.mjs'

export const rule = {
  id: 'fs/credential-read',
  level: 'error',
  shortDescription: 'Reads a credential or secret store',
  help: 'Skills should not touch SSH keys, cloud credentials, .env files or the keychain. Remove the read or gate it behind an explicit, reviewed exception.',
  check(file) {
    const patterns = [
      /(?:~|\$HOME|\/Users\/[^/\s"']+)\/(?:\.ssh|\.aws|\.gnupg|\.config\/gcloud|\.kube|\.docker)\b/,
      /\bid_rsa\b|\bid_ed25519\b/,
      /\b\.npmrc\b|\b\.netrc\b/,
      /\.docker\/config\.json\b/,
      /\.git-credentials\b/,
      /\bcredential\.helper\b/,
      /\bsecurity\s+find-generic-password\b/,
      /(?:^|[\s"'(=])(?:\.\/)?\.env(?:\.\w+)?\b/,
    ]
    const findings = []
    for (const row of linesOf(file, CODE_KINDS)) {
      if (patterns.some((regex) => regex.test(row.text))) {
        findings.push({
          ruleId: this.id,
          level: this.level,
          message: 'Accesses a credential path or secret store.',
          line: row.line,
          column: row.column,
        })
      }
    }
    return findings
  },
}
