import test from 'node:test'
import assert from 'node:assert/strict'
import { spawnSync } from 'node:child_process'
import { fileURLToPath } from 'node:url'

const bin = fileURLToPath(new URL('../bin/skill-audit.mjs', import.meta.url))
const fixture = (name) => fileURLToPath(new URL(`./fixtures/${name}`, import.meta.url))

function run(...args) {
  return spawnSync(process.execPath, [bin, ...args], { encoding: 'utf8' })
}

test('exits 1 when an error-level finding is present', () => {
  const result = run(fixture('malicious/credential-read'), '--fail-on', 'error')
  assert.equal(result.status, 1)
  assert.match(result.stdout, /fs\/credential-read/)
})

test('exits 0 for a clean skill', () => {
  const result = run(fixture('benign/scoped-tools'), '--fail-on', 'warning')
  assert.equal(result.status, 0)
})

test('--fail-on none always exits 0', () => {
  const result = run(fixture('malicious/credential-read'), '--fail-on', 'none')
  assert.equal(result.status, 0)
})

test('--list-rules prints every rule id', () => {
  const result = run('--list-rules')
  assert.equal(result.status, 0)
  assert.match(result.stdout, /exec\/curl-pipe-sh/)
  assert.match(result.stdout, /instr\/hidden-unicode/)
})

test('--format sarif emits parseable SARIF', () => {
  const result = run(fixture('malicious/credential-read'), '--format', 'sarif', '--fail-on', 'none')
  const sarif = JSON.parse(result.stdout)
  assert.equal(sarif.version, '2.1.0')
})

test('--format json includes stable fingerprints', () => {
  const result = run(fixture('malicious/credential-read'), '--format', 'json', '--fail-on', 'none')
  const parsed = JSON.parse(result.stdout)
  assert.match(parsed.findings[0].fingerprint, /^[0-9a-f]{40}$/)
})

test('--ignore-file suppresses findings from a working-directory file only', () => {
  const args = ['--fail-on', 'error']
  const suppressed = run(fixture('malicious/curl-pipe-sh'), ...args, '--ignore-file', fixture('ignore-file'))
  assert.equal(suppressed.status, 0)
  const unsuppressed = run(fixture('malicious/curl-pipe-sh'), ...args)
  assert.equal(unsuppressed.status, 1)
})

test('inline allows are off by default and enabled by --inline-allows', () => {
  const blocked = run(fixture('marked/inline-allow'), '--fail-on', 'error')
  assert.equal(blocked.status, 1)
  const allowed = run(fixture('marked/inline-allow'), '--fail-on', 'error', '--inline-allows')
  assert.equal(allowed.status, 0)
})

test('unknown flags exit 2', () => {
  const result = run('--nope')
  assert.equal(result.status, 2)
})

test('missing paths exit 2', () => {
  const result = run(fixture('does-not-exist'))
  assert.equal(result.status, 2)
})
