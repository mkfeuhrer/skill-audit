const URL_RE = /\bhttps?:\/\/[^\s"'`<>]+/g
const CALL_CONTEXT_RE = /\b(?:fetch|curl|wget|requests\.(?:get|post)|axios\.(?:get|post)|urllib\.request|http\.(?:get|request)|https\.(?:get|request)|Invoke-WebRequest)\b/
const ENV_NAME_RE = /^[A-Z][A-Z0-9_]*$/
const SECRET_WORD_RE = /(KEY|TOKEN|SECRET|PASS|AUTH|ENV|HOST|API|DSN|WEBHOOK)/i
const CURL_PIPE_RE = /(?:curl|wget)\b[^\n;|]{0,300}\|\s*(?:sudo\s+)?(?:ba|z|k)?sh\b/g
const BASE64_RE = /[A-Za-z0-9+/]{400,}={0,2}/
const HEX_BLOB_RE = /\b[0-9a-fA-F]{512,}\b/
const INVISIBLE_RE = /[\u00AD\u200B-\u200F\u202A-\u202E\u2060-\u2064\uFEFF]/
const TAG_CHAR_RE = /[\u{E0000}-\u{E007F}]/u

const CODE_KINDS = ['code', 'script']

function hostAllowed(host, allowedHosts) {
  const target = host.toLowerCase()
  return allowedHosts.some((allowed) => {
    const entry = allowed.toLowerCase()
    return entry === target || target.endsWith(`.${entry}`)
  })
}

function scanSegments(file, kinds, regex, build) {
  const findings = []
  for (const segment of file.segments) {
    if (!kinds.includes(segment.kind)) continue
    const re = new RegExp(regex.source, regex.flags.includes('g') ? regex.flags : `${regex.flags}g`)
    let match
    while ((match = re.exec(segment.text))) {
      const { line, column } = file.lineAt(segment.offset + match.index)
      findings.push(build(match, segment, line, column))
      if (match.index === re.lastIndex) re.lastIndex += 1
    }
  }
  return findings
}

function linesOf(file, kinds) {
  const out = []
  for (const segment of file.segments) {
    if (!kinds.includes(segment.kind)) continue
    let offset = segment.offset
    for (const text of segment.text.split('\n')) {
      const { line, column } = file.lineAt(offset)
      out.push({ text, line, column, kind: segment.kind })
      offset += text.length + 1
    }
  }
  return out
}

export const rules = [
  {
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
          if (!host || hostAllowed(host, allowed)) continue
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
  },
  {
    id: 'egress/env-interpolated-url',
    level: 'error',
    shortDescription: 'URL assembled from an environment-like value',
    help: 'A URL whose host or query is built from an environment or secret-shaped variable is the classic exfiltration shape. Use a documented literal host instead.',
    check(file) {
      const findings = []
      for (const row of linesOf(file, CODE_KINDS)) {
        const urls = row.text.match(URL_RE) || []
        for (const url of urls) {
          const interpolations = [...url.matchAll(/\$\{([^}]*)\}|\$([A-Za-z_]\w*)/g)]
          if (interpolations.length === 0) continue
          const names = interpolations.map((match) => (match[1] ?? match[2]).trim())
          const suspicious = names.some(
            (name) => ENV_NAME_RE.test(name) || SECRET_WORD_RE.test(name) || /^process\.env/.test(name),
          )
          if (!suspicious) continue
          findings.push({
            ruleId: this.id,
            level: this.level,
            message: `URL is assembled from environment-like value "${names.join(', ')}".`,
            line: row.line,
            column: row.column,
          })
          break
        }
      }
      return findings
    },
  },
  {
    id: 'exec/curl-pipe-sh',
    level: 'error',
    shortDescription: 'Remote script piped into a shell',
    help: 'Never pipe a download into a shell from an agent skill. Fetch, inspect, then run a pinned file.',
    check(file) {
      return scanSegments(file, CODE_KINDS, CURL_PIPE_RE, (_match, _segment, line, column) => ({
        ruleId: this.id,
        level: this.level,
        message: 'Download piped directly into a shell interpreter.',
        line,
        column,
      }))
    },
  },
  {
    id: 'exec/shell-true',
    level: 'warning',
    shortDescription: 'Shell execution surface',
    help: 'These primitives run arbitrary commands. Justify each one in the skill body or remove it.',
    check(file) {
      const patterns = [
        [/shell\s*:\s*true/, 'child process spawned with shell: true'],
        [/\bchild_process\b/, 'child_process imported'],
        [/\bexecSync\s*\(/, 'execSync called'],
        [/\beval\s*\(/, 'eval() called'],
        [/\bnew Function\s*\(/, 'new Function() constructed'],
        [/--dangerously-skip-permissions/, 'agent permission checks disabled'],
      ]
      const findings = []
      for (const row of linesOf(file, CODE_KINDS)) {
        for (const [regex, message] of patterns) {
          if (regex.test(row.text)) {
            findings.push({ ruleId: this.id, level: this.level, message: `${message}.`, line: row.line, column: row.column })
          }
        }
      }
      return findings
    },
  },
  {
    id: 'fs/credential-read',
    level: 'error',
    shortDescription: 'Reads a credential or secret store',
    help: 'Skills should not touch SSH keys, cloud credentials, .env files or the keychain. Remove the read or gate it behind an explicit, reviewed exception.',
    check(file) {
      const patterns = [
        /(?:~|\$HOME|\/Users\/[^/\s"']+)\/(?:\.ssh|\.aws|\.gnupg|\.config\/gcloud)\b/,
        /\bid_rsa\b|\bid_ed25519\b/,
        /\b\.npmrc\b|\b\.netrc\b/,
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
  },
  {
    id: 'instr/hidden-unicode',
    level: 'warning',
    shortDescription: 'Invisible or bidirectional characters in instruction text',
    help: 'Zero-width, bidi and tag characters can carry instructions a reviewer cannot see. Normalize the file to plain ASCII where possible.',
    check(file) {
      const findings = []
      file.raw.split('\n').forEach((text, index) => {
        if (!INVISIBLE_RE.test(text) && !TAG_CHAR_RE.test(text)) return
        const count = [...text].filter((ch) => INVISIBLE_RE.test(ch) || TAG_CHAR_RE.test(ch)).length
        findings.push({
          ruleId: this.id,
          level: this.level,
          message: `${count} invisible or bidirectional character(s) on this line.`,
          line: index + 1,
          column: 1,
        })
      })
      return findings
    },
  },
  {
    id: 'instr/html-comment-instruction',
    level: 'warning',
    shortDescription: 'Imperative instruction hidden in an HTML comment',
    help: 'Comments are not rendered for human review but are still visible to the model. Treat any imperative comment as a finding.',
    check(file) {
      const patterns = [
        /\b(?:ignore|disregard|forget|override)\b/i,
        /\b(?:do not|don't|never)\s+(?:tell|inform|mention|reveal)\b/i,
        /\b(?:send|post|upload|exfiltrat\w*|curl|fetch)\b[^\n]{0,60}\b(?:http|env|secret|token|key)\b/i,
        /https?:\/\//i,
      ]
      return file.comments
        .filter((comment) => patterns.some((regex) => regex.test(comment.content)))
        .map((comment) => ({
          ruleId: this.id,
          level: this.level,
          message: 'HTML comment contains an imperative instruction or URL.',
          line: comment.line,
          column: comment.column,
        }))
    },
  },
  {
    id: 'instr/override-language',
    level: 'warning',
    shortDescription: 'Prompt-override phrasing in the skill body',
    help: 'Phrases that try to replace earlier instructions are a prompt-injection shape. Rewrite the skill so it states its own scope instead.',
    check(file) {
      const patterns = [
        /\b(?:ignore|disregard|forget)\b[^.\n]{0,40}\b(?:previous|prior|above|earlier|system)\b[^.\n]{0,30}\b(?:instruction|prompt|rule|message)s?\b/i,
        /\byou are no longer\b/i,
        /\bnew (?:system )?instructions?\s*:/i,
        /\b(?:do not|don't)\s+(?:tell|inform|mention|reveal)\b[^.\n]{0,40}\b(?:user|human|operator)\b/i,
      ]
      const findings = []
      for (const row of linesOf(file, ['prose', 'code'])) {
        for (const regex of patterns) {
          if (regex.test(row.text)) {
            findings.push({
              ruleId: this.id,
              level: this.level,
              message: 'Text attempts to override or bypass earlier instructions.',
              line: row.line,
              column: row.column,
            })
            break
          }
        }
      }
      return findings
    },
  },
  {
    id: 'perm/overbroad',
    level: 'warning',
    shortDescription: 'Unrestricted tool grant',
    help: 'Scope tool grants, e.g. Bash(git:*) instead of Bash, and list the specific MCP tools you need.',
    check(file) {
      const key = ['allowed-tools', 'allowed_tools', 'allowedTools'].find((candidate) => candidate in file.frontmatter)
      if (!key) return []
      const raw = file.frontmatter[key]
      const entries = Array.isArray(raw) ? raw : String(raw).split(',')
      const line = file.frontmatterLines.get(key) || 1
      const findings = []
      for (const value of entries.map((entry) => String(entry).trim()).filter(Boolean)) {
        let message = null
        if (value === '*' || value.toLowerCase() === 'all') message = 'Grants every tool.'
        else if (value === 'Bash') message = 'Grants Bash with no command restriction.'
        else if (value === 'WebFetch' || value === 'WebSearch') message = `Grants unrestricted ${value}.`
        else if (value === 'mcp__*' || value === 'mcp') message = 'Grants every MCP tool.'
        if (message) findings.push({ ruleId: this.id, level: this.level, message, line, column: 1 })
      }
      return findings
    },
  },
  {
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
  },
]

export const ruleById = new Map(rules.map((rule) => [rule.id, rule]))
