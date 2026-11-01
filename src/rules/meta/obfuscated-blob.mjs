import { CODE_KINDS, linesOf } from '../_shared.mjs'

const BASE64_RE = /[A-Za-z0-9+/]{400,}={0,2}/
const HEX_BLOB_RE = /\b[0-9a-fA-F]{512,}\b/

export const rule = {
  id: 'meta/obfuscated-blob',
  level: 'warning',
  shortDescription: 'Large encoded blob in skill code',
  help: 'Long base64 or hex runs hide what the code does. Decode it, commit the plaintext, or explain it in the body.',
  check(file) {
    const findings = []
    for (const row of linesOf(file, CODE_KINDS)) {
      if (BASE64_RE.test(row.text)) {
        findings.push({ ruleId: this.id, level: this.level, message: 'Base64 blob of 400+ characters.', line: row.line, column: row.column })
      }
      if (HEX_BLOB_RE.test(row.text)) {
        findings.push({ ruleId: this.id, level: this.level, message: 'Hex blob of 512+ characters.', line: row.line, column: row.column })
      }
    }
    return findings
  },
}
