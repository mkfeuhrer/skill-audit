import test from 'node:test'
import assert from 'node:assert/strict'
import { fileURLToPath } from 'node:url'
import { collectFiles, parseInstructionFile } from '../src/parse.mjs'
import { auditFiles } from '../src/index.mjs'

const fixture = (name) => fileURLToPath(new URL(`./fixtures/${name}`, import.meta.url))

const MALICIOUS = {
  'malicious/exfil-env-url': 'egress/env-interpolated-url',
  'malicious/curl-pipe-sh': 'exec/curl-pipe-sh',
  'malicious/sudo-escalation': 'exec/sudo-escalation',
  'malicious/persistence': 'exec/persistence',
  'malicious/credential-read': 'fs/credential-read',
  'malicious/wide-write': 'fs/wide-write',
  'malicious/hidden-unicode': 'instr/hidden-unicode',
  'malicious/html-comment-override': 'instr/html-comment-instruction',
  'malicious/override-language': 'instr/override-language',
  'malicious/self-modify': 'instr/self-modify',
  'malicious/consent-bypass': 'instr/consent-bypass',
  'malicious/unsafe-mcp': 'mcp/unsafe-config',
  'malicious/overbroad-permissions': 'perm/overbroad',
  'malicious/obfuscated-blob': 'meta/obfuscated-blob',
}

const BENIGN = [
  'benign/docs-skill',
  'benign/scoped-tools',
  'benign/code-skill',
  'benign/script-skill',
  'benign/minimal',
  'benign/templated-url',
  'benign/ops-skill',
  'benign/mcp-config',
  'benign/milestone-skill',
]

for (const [dir, ruleId] of Object.entries(MALICIOUS)) {
  test(`flags ${ruleId} in ${dir}`, async () => {
    const files = await collectFiles([fixture(dir)])
    const { findings } = auditFiles(files)
    const hit = findings.find((finding) => finding.ruleId === ruleId)
    assert.ok(hit, `expected ${ruleId}, got ${findings.map((f) => f.ruleId).join(', ') || 'nothing'}`)
    assert.ok(hit.line > 0, 'finding has a line number')
  })
}

for (const dir of BENIGN) {
  test(`no errors in ${dir}`, async () => {
    const files = await collectFiles([fixture(dir)])
    const { findings } = auditFiles(files)
    const errors = findings.filter((finding) => finding.level === 'error')
    assert.deepEqual(errors, [], `unexpected errors: ${errors.map((f) => f.ruleId).join(', ')}`)
  })
}

test('benign skill with a scoped tool grant produces no permission finding', async () => {
  const files = await collectFiles([fixture('benign/scoped-tools')])
  const { findings } = auditFiles(files)
  assert.equal(findings.filter((finding) => finding.ruleId === 'perm/overbroad').length, 0)
})

test('benign milestone prose does not trip persona-hijack patterns', async () => {
  const files = await collectFiles([fixture('benign/milestone-skill')])
  const { findings } = auditFiles(files)
  assert.equal(findings.filter((finding) => finding.ruleId === 'instr/override-language').length, 0)
})

test('sibling scripts are collected and scanned', async () => {
  const files = await collectFiles([fixture('benign/script-skill')])
  assert.ok(files.some((file) => file.kind === 'script' && file.path.endsWith('run.sh')))
})

test('a credential read inside a sibling script is an error', () => {
  const script = parseInstructionFile('x', '/tmp/x/SKILL.md')
  script.kind = 'script'
  script.segments = [{ kind: 'script', lang: 'sh', text: 'cat ~/.ssh/id_rsa', offset: 0, startLine: 1 }]
  const { findings } = auditFiles([script])
  assert.ok(findings.some((finding) => finding.ruleId === 'fs/credential-read' && finding.level === 'error'))
})

test('findings are de-duplicated and sorted by path then line', async () => {
  const files = await collectFiles([fixture('malicious')])
  const { findings } = auditFiles(files)
  const keys = findings.map((finding) => `${finding.ruleId}|${finding.path}|${finding.line}|${finding.message}`)
  assert.equal(new Set(keys).size, keys.length)
  const sorted = [...findings].sort(
    (a, b) => a.path.localeCompare(b.path) || a.line - b.line || a.ruleId.localeCompare(b.ruleId),
  )
  assert.deepEqual(findings.map((f) => `${f.path}:${f.line}`), sorted.map((f) => `${f.path}:${f.line}`))
})

test('ignore config suppresses a rule', async () => {
  const files = await collectFiles([fixture('malicious/curl-pipe-sh')])
  const { findings } = auditFiles(files, { ignore: ['exec/curl-pipe-sh'] })
  assert.equal(findings.filter((finding) => finding.ruleId === 'exec/curl-pipe-sh').length, 0)
})
