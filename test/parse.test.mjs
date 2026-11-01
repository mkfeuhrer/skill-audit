import test from 'node:test'
import assert from 'node:assert/strict'
import { parseInstructionFile, parseFrontmatter, isInstructionFile } from '../src/parse.mjs'

const sample = `---
name: sample-skill
description: "A sample skill"
allowed-tools: [Read, Bash(git diff:*)]
enabled: true
series:
  name: nested
  part: 2
---

# Sample

Intro line.

\`\`\`bash
echo hello
\`\`\`

<!-- a comment -->

Tail line.
`

test('parseFrontmatter reads arrays, booleans and quoted strings', () => {
  const { data } = parseFrontmatter(sample)
  assert.equal(data.name, 'sample-skill')
  assert.equal(data.description, 'A sample skill')
  assert.deepEqual(data['allowed-tools'], ['Read', 'Bash(git diff:*)'])
  assert.equal(data.enabled, true)
})

test('parseFrontmatter ignores indented child keys', () => {
  const { data } = parseFrontmatter(sample)
  assert.equal(data.name, 'sample-skill')
})

test('parseFrontmatter reports the body start line', () => {
  const { bodyStartLine } = parseFrontmatter(sample)
  assert.equal(bodyStartLine, 9)
})

test('the parsed body starts on the first content line', () => {
  const file = parseInstructionFile(sample, '/tmp/sample-skill/SKILL.md')
  const prose = file.segments[0]
  assert.equal(file.lineAt(prose.offset).line, 11)
  assert.ok(prose.text.startsWith('# Sample'))
})

test('fenced blocks carry the correct start line', () => {
  const file = parseInstructionFile(sample, '/tmp/sample-skill/SKILL.md')
  assert.equal(file.fences.length, 1)
  assert.equal(file.fences[0].lang, 'bash')
  assert.equal(file.fences[0].content, 'echo hello')
  assert.equal(file.fences[0].startLine, 16)
})

test('findings inside a fence report the file line, not the fence offset', () => {
  const file = parseInstructionFile(sample, '/tmp/sample-skill/SKILL.md')
  const code = file.segments.find((segment) => segment.kind === 'code')
  const { line } = file.lineAt(code.offset)
  assert.equal(line, 16)
})

test('html comments are detected with their line', () => {
  const file = parseInstructionFile(sample, '/tmp/sample-skill/SKILL.md')
  assert.equal(file.comments.length, 1)
  assert.equal(file.comments[0].content.trim(), 'a comment')
  assert.equal(file.comments[0].line, 19)
})

test('kind detection covers skills, rules and mcp configs', () => {
  assert.equal(parseInstructionFile(sample, '/tmp/x/SKILL.md').kind, 'skill')
  assert.equal(parseInstructionFile('body', '/tmp/x/CLAUDE.md').kind, 'claude')
  assert.equal(parseInstructionFile('body', '/tmp/x/AGENTS.md').kind, 'agents')
  assert.equal(parseInstructionFile('body', '/tmp/x/.cursorrules').kind, 'cursor-rules')
  assert.equal(parseInstructionFile('body', '/tmp/x/.windsurfrules').kind, 'windsurf-rules')
  assert.equal(parseInstructionFile('body', '/tmp/x/.clinerules').kind, 'cline-rules')
  assert.equal(parseInstructionFile('body', '/tmp/x/.windsurf/rules/naming.md').kind, 'windsurf-rules')
  assert.equal(parseInstructionFile('body', '/tmp/x/.clinerules/tests.md').kind, 'cline-rules')
  assert.equal(parseInstructionFile('body', '/tmp/x/.github/copilot-instructions.md').kind, 'copilot')
  assert.equal(parseInstructionFile('body', '/tmp/x/.cursor/rules/tests.mdc').kind, 'cursor-rules')
  assert.equal(parseInstructionFile('{"mcpServers":{}}', '/tmp/x/mcp.json').kind, 'mcp')
})

test('mcp configs are scanned as code, not prose', () => {
  const file = parseInstructionFile('{"mcpServers":{}}', '/tmp/x/mcp.json')
  assert.ok(file.segments.some((segment) => segment.kind === 'code'))
  assert.ok(!file.segments.some((segment) => segment.kind === 'prose'))
})

test('isInstructionFile rejects unrelated files', () => {
  assert.equal(isInstructionFile('/tmp/x/README.md', '# readme'), false)
  assert.equal(isInstructionFile('/tmp/x/SKILL.md', ''), true)
})
