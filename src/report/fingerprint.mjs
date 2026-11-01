import { createHash } from 'node:crypto'

export function fingerprintOf(ruleId, file, message) {
  return createHash('sha256').update(`${ruleId}:${file}:${message}`).digest('hex').slice(0, 40)
}
