import test from 'node:test'
import assert from 'node:assert/strict'
import { parseIgnoreFile, isSuppressed } from '../src/suppress.mjs'

const FP = 'abc123abc123abc123abc123abc123abc123abc1'

test('parseIgnoreFile splits rules, scoped rules, fingerprints and comments', () => {
  const parsed = parseIgnoreFile(`
# a comment
exec/shell-true
fs/credential-read@skills/bad/SKILL.md
${FP}
`)
  assert.ok(parsed.rules.has('exec/shell-true'))
  assert.equal(parsed.scoped.length, 1)
  assert.equal(parsed.scoped[0].ruleId, 'fs/credential-read')
  assert.equal(parsed.scoped[0].path, 'skills/bad/SKILL.md')
  assert.ok(parsed.fingerprints.has(FP))
})

test('isSuppressed matches bare rules, scoped paths and fingerprints', () => {
  const suppress = parseIgnoreFile(`exec/shell-true\nfs/credential-read@skills/bad/SKILL.md\n${FP}\n`)
  assert.equal(isSuppressed({ ruleId: 'exec/shell-true', path: '/x/y/SKILL.md' }, suppress), true)
  assert.equal(isSuppressed({ ruleId: 'fs/credential-read', path: '/repo/skills/bad/SKILL.md' }, suppress), true)
  assert.equal(isSuppressed({ ruleId: 'fs/credential-read', path: '/repo/skills/ok/SKILL.md' }, suppress), false)
  assert.equal(isSuppressed({ ruleId: 'egress/undeclared-host', path: '/x/SKILL.md', fingerprint: FP }, suppress), true)
  assert.equal(isSuppressed({ ruleId: 'egress/undeclared-host', path: '/x/SKILL.md', fingerprint: '0'.repeat(40) }, suppress), false)
})
