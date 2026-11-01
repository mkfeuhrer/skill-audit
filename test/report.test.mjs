import test from 'node:test'
import assert from 'node:assert/strict'
import { summarize, exceedsThreshold, format } from '../src/index.mjs'

const findings = [
  {
    ruleId: 'fs/credential-read',
    level: 'error',
    message: 'Accesses a credential path or secret store.',
    path: '/repo/skills/a/SKILL.md',
    line: 12,
    column: 3,
    fingerprint: '1111111111111111111111111111111111111111',
  },
  {
    ruleId: 'perm/overbroad',
    level: 'warning',
    message: 'Grants Bash with no command restriction.',
    path: '/repo/skills/a/SKILL.md',
    line: 4,
    column: 1,
    fingerprint: '2222222222222222222222222222222222222222',
  },
]

test('summarize counts each level', () => {
  assert.deepEqual(summarize(findings), { error: 1, warning: 1, note: 0, total: 2 })
})

test('thresholds behave as documented', () => {
  const summary = summarize(findings)
  assert.equal(exceedsThreshold(summary, 'error'), true)
  assert.equal(exceedsThreshold(summary, 'warning'), true)
  assert.equal(exceedsThreshold(summary, 'none'), false)
  assert.equal(exceedsThreshold(summarize([]), 'error'), false)
  assert.equal(exceedsThreshold(summarize([]), 'warning'), false)
})

test('text output includes location and rule id', () => {
  const output = format(findings, summarize(findings), { format: 'text', root: '/repo' })
  assert.match(output, /skills\/a\/SKILL\.md:12:3/)
  assert.match(output, /fs\/credential-read/)
  assert.match(output, /1 error\(s\), 1 warning\(s\)/)
})

test('json output is machine readable', () => {
  const parsed = JSON.parse(format(findings, summarize(findings), { format: 'json', root: '/repo' }))
  assert.equal(parsed.version, 1)
  assert.equal(parsed.summary.error, 1)
  assert.equal(parsed.findings[0].file, 'skills/a/SKILL.md')
  assert.equal(parsed.findings[0].fingerprint, '1111111111111111111111111111111111111111')
})

test('markdown output renders a shareable report table', () => {
  const output = format(findings, summarize(findings), { format: 'markdown', root: '/repo' })
  assert.match(output, /# skill-audit report/)
  assert.match(output, /\*\*2 finding\(s\): 1 error\(s\), 1 warning\(s\), 0 note\(s\)\*\*/)
  assert.match(output, /\| skills\/a\/SKILL\.md \| 12 \| error \| fs\/credential-read \|/)
})

test('markdown output states clearly when there is nothing to report', () => {
  const output = format([], summarize([]), { format: 'markdown', root: '/repo' })
  assert.match(output, /_No findings\._/)
})

test('github output emits workflow annotations', () => {
  const output = format(findings, summarize(findings), { format: 'github', root: '/repo' })
  assert.match(output, /^::error file=skills\/a\/SKILL\.md,line=12,col=3::fs\/credential-read: /m)
  assert.match(output, /^::warning file=skills\/a\/SKILL\.md,line=4,col=1::perm\/overbroad: /m)
})

test('sarif output follows 2.1.0', () => {
  const sarif = JSON.parse(format(findings, summarize(findings), { format: 'sarif', root: '/repo' }))
  assert.equal(sarif.version, '2.1.0')
  assert.equal(sarif.runs.length, 1)
  const run = sarif.runs[0]
  assert.equal(run.tool.driver.name, 'skill-audit')
  assert.equal(run.results.length, 2)
  assert.equal(run.tool.driver.rules.length, 2)
  assert.equal(run.tool.driver.rules[0].id, 'fs/credential-read')

  const result = run.results[0]
  assert.equal(result.level, 'error')
  assert.equal(result.locations[0].physicalLocation.artifactLocation.uri, 'skills/a/SKILL.md')
  assert.equal(result.locations[0].physicalLocation.region.startLine, 12)
  assert.ok(result.partialFingerprints['skill-audit/v1'])
})
