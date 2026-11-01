import { readFile, readdir, stat } from 'node:fs/promises'
import { join, basename, extname, relative, sep } from 'node:path'

const SKIP_DIRS = new Set(['node_modules', '.git', 'dist', 'build', 'coverage', '.next', '.nuxt'])

const INSTRUCTION_NAMES = new Map([
  ['skill.md', 'skill'],
  ['claude.md', 'claude'],
  ['agents.md', 'agents'],
  ['gemini.md', 'agents'],
  ['.cursorrules', 'cursor-rules'],
  ['.windsurfrules', 'windsurf-rules'],
  ['.clinerules', 'cline-rules'],
  ['mcp.json', 'mcp'],
  ['.mcp.json', 'mcp'],
  ['claude_desktop_config.json', 'mcp'],
])

const WALKABLE_HIDDEN_DIRS = new Set(['.cursor', '.github', '.windsurf', '.clinerules'])

const SCRIPT_EXT = new Set(['.sh', '.bash', '.zsh', '.js', '.mjs', '.cjs', '.ts', '.py'])

export function parseFrontmatter(raw) {
  if (!raw.startsWith('---')) return { data: {}, keyLines: new Map(), body: raw, bodyStartLine: 1 }
  const end = raw.indexOf('\n---', 3)
  if (end === -1) return { data: {}, keyLines: new Map(), body: raw, bodyStartLine: 1 }

  const data = {}
  const keyLines = new Map()
  const lines = raw.slice(4, end).split('\n')
  lines.forEach((line, i) => {
    if (/^\s/.test(line)) return
    const colon = line.indexOf(':')
    if (colon === -1) return
    const key = line.slice(0, colon).trim()
    const value = line.slice(colon + 1).trim()
    keyLines.set(key, i + 2)
    if (value.startsWith('[') && value.endsWith(']')) {
      data[key] = splitList(value.slice(1, -1))
    } else if (value === 'true' || value === 'false') {
      data[key] = value === 'true'
    } else if (value === '') {
      data[key] = ''
    } else {
      data[key] = unquote(value)
    }
  })

  const bodyStartLine = raw.slice(0, end + 4).split('\n').length
  return { data, keyLines, body: raw.slice(end + 4), bodyStartLine }
}

function unquote(value) {
  return value.trim().replace(/^["']|["']$/g, '')
}

function splitList(inner) {
  const items = []
  let current = ''
  let quote = null
  for (const ch of inner) {
    if (quote) {
      if (ch === quote) quote = null
      else current += ch
    } else if (ch === '"' || ch === "'") {
      quote = ch
    } else if (ch === ',') {
      items.push(current)
      current = ''
    } else {
      current += ch
    }
  }
  items.push(current)
  return items.map(unquote).filter(Boolean)
}

function buildLineIndex(raw) {
  const starts = [0]
  for (let i = 0; i < raw.length; i++) if (raw[i] === '\n') starts.push(i + 1)
  return starts
}

function lineAt(lineIndex, offset) {
  let low = 0
  let high = lineIndex.length - 1
  while (low < high) {
    const mid = (low + high + 1) >> 1
    if (lineIndex[mid] <= offset) low = mid
    else high = mid - 1
  }
  return { line: low + 1, column: offset - lineIndex[low] + 1 }
}

function parseFences(raw, bodyStartOffset, bodyStartLine, lineIndex) {
  const lines = raw.slice(bodyStartOffset).split('\n')
  const fences = []
  let open = null
  for (let i = 0; i < lines.length; i++) {
    const match = /^\s*(`{3,}|~{3,})\s*([\w+-]*)/.exec(lines[i])
    if (!match) continue
    const marker = match[1]
    if (!open) {
      open = { marker: marker[0], length: marker.length, lang: match[2] || '', index: i }
      continue
    }
    if (marker[0] === open.marker && marker.length >= open.length) {
      const contentLines = lines.slice(open.index + 1, i)
      fences.push({
        lang: open.lang,
        content: contentLines.join('\n'),
        startLine: bodyStartLine + open.index + 1,
        offset: bodyStartOffset + lines.slice(0, open.index + 1).join('\n').length + 1,
      })
      open = null
    }
  }
  return fences.map((fence) => ({ ...fence, ...lineAt(lineIndex, Math.min(fence.offset, raw.length - 1)) }))
}

function parseHtmlComments(raw, lineIndex) {
  const comments = []
  const pattern = /<!--([\s\S]*?)-->/g
  let match
  while ((match = pattern.exec(raw))) {
    const { line, column } = lineAt(lineIndex, match.index)
    comments.push({ content: match[1], line, column, index: match.index })
  }
  return comments
}

export function parseInstructionFile(raw, filePath) {
  const clean = raw.charCodeAt(0) === 0xfeff ? raw.slice(1) : raw
  const lineIndex = buildLineIndex(clean)
  const { data, keyLines, body, bodyStartLine: rawBodyStartLine } = parseFrontmatter(clean)
  const leading = body.length - body.replace(/^\n+/, '').length
  const trimmedBody = body.slice(leading)
  const bodyStartOffset = clean.length - body.length + leading
  const bodyStartLine = rawBodyStartLine + leading
  const kind = kindOf(filePath, clean)
  const fences = parseFences(clean, bodyStartOffset, bodyStartLine, lineIndex)

  const segments = []
  if (kind === 'mcp') {
    segments.push({ kind: 'code', lang: 'json', text: clean, offset: 0, startLine: 1 })
  } else {
    segments.push({ kind: 'prose', lang: '', text: trimmedBody, offset: bodyStartOffset, startLine: bodyStartLine })
  }
  for (const fence of fences) {
    segments.push({ kind: 'code', lang: fence.lang, text: fence.content, offset: fence.offset, startLine: fence.startLine })
  }

  return {
    path: filePath,
    kind,
    raw: clean,
    frontmatter: data,
    frontmatterLines: keyLines,
    fences,
    segments,
    comments: parseHtmlComments(clean, lineIndex),
    lineAt: (offset) => lineAt(lineIndex, offset),
  }
}

export function parseScript(raw, filePath) {
  const clean = raw.charCodeAt(0) === 0xfeff ? raw.slice(1) : raw
  const lineIndex = buildLineIndex(clean)
  return {
    path: filePath,
    kind: 'script',
    raw: clean,
    frontmatter: {},
    frontmatterLines: new Map(),
    fences: [],
    segments: [{ kind: 'script', lang: extname(filePath).slice(1), text: clean, offset: 0, startLine: 1 }],
    comments: [],
    lineAt: (offset) => lineAt(lineIndex, offset),
  }
}

function kindOf(filePath, raw) {
  const lower = basename(filePath).toLowerCase()
  if (INSTRUCTION_NAMES.has(lower)) return INSTRUCTION_NAMES.get(lower)
  const parts = filePath.split(sep)
  if (lower.endsWith('.mdc') && parts.includes('.cursor')) return 'cursor-rules'
  if (lower === 'copilot-instructions.md' && parts.includes('.github')) return 'copilot'
  if (lower.endsWith('.md') && parts.includes('.windsurf')) return 'windsurf-rules'
  if (lower.endsWith('.md') && parts.includes('.clinerules')) return 'cline-rules'
  if (lower.endsWith('.md') && parts.includes('.cursor')) return 'cursor-rules'
  if (lower.endsWith('.json') && raw.includes('"mcpServers"')) return 'mcp'
  return 'unknown'
}

export function isInstructionFile(filePath, raw = '') {
  return kindOf(filePath, raw) !== 'unknown'
}

export async function collectFiles(targets, options = {}) {
  const includeScripts = options.includeScripts !== false
  const files = []
  const seen = new Set()

  for (const target of targets) {
    const stats = await safeStat(target)
    if (!stats) continue
    if (stats.isDirectory()) {
      await walk(target, files, seen, includeScripts)
    } else {
      const raw = await readFile(target, 'utf8')
      if (isInstructionFile(target, raw)) {
        files.push(parseInstructionFile(raw, target))
        if (includeScripts) await addSiblingScripts(target, files, seen)
      }
    }
  }

  files.sort((a, b) => a.path.localeCompare(b.path))
  return files
}

async function walk(dir, files, seen, includeScripts) {
  let entries
  try {
    entries = await readdir(dir, { withFileTypes: true })
  } catch {
    return
  }
  for (const entry of entries) {
    const full = join(dir, entry.name)
    if (entry.isDirectory()) {
      if (SKIP_DIRS.has(entry.name)) continue
      if (entry.name.startsWith('.') && !WALKABLE_HIDDEN_DIRS.has(entry.name)) continue
      await walk(full, files, seen, includeScripts)
      continue
    }
    if (!entry.isFile()) continue
    let raw
    try {
      raw = await readFile(full, 'utf8')
    } catch {
      continue
    }
    if (!isInstructionFile(full, raw)) continue
    const parsed = parseInstructionFile(raw, full)
    if (!seen.has(`${parsed.path}:${parsed.kind}`)) {
      seen.add(`${parsed.path}:${parsed.kind}`)
      files.push(parsed)
    }
    if (includeScripts) await addSiblingScripts(full, files, seen)
  }
}

async function addSiblingScripts(instructionPath, files, seen) {
  const scriptsDir = join(instructionPath, '..', 'scripts')
  const stats = await safeStat(scriptsDir)
  if (!stats || !stats.isDirectory()) return
  await walkScripts(scriptsDir, files, seen)
}

async function walkScripts(dir, files, seen) {
  let entries
  try {
    entries = await readdir(dir, { withFileTypes: true })
  } catch {
    return
  }
  for (const entry of entries) {
    const full = join(dir, entry.name)
    if (entry.isDirectory()) {
      if (SKIP_DIRS.has(entry.name)) continue
      await walkScripts(full, files, seen)
      continue
    }
    if (!entry.isFile() || !SCRIPT_EXT.has(extname(entry.name))) continue
    if (seen.has(`${full}:script`)) continue
    try {
      files.push(parseScript(await readFile(full, 'utf8'), full))
      seen.add(`${full}:script`)
    } catch {
      continue
    }
  }
}

async function safeStat(path) {
  try {
    return await stat(path)
  } catch {
    return null
  }
}

export function displayPath(filePath, root = process.cwd()) {
  const rel = relative(root, filePath)
  return rel && !rel.startsWith('..') ? rel : filePath
}
