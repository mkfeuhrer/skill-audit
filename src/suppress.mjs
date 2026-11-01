const FINGERPRINT_RE = /^[0-9a-f]{40}$/

export function parseIgnoreFile(raw) {
  const rules = new Set()
  const scoped = []
  const fingerprints = new Set()

  for (const rawLine of raw.split('\n')) {
    const line = rawLine.trim()
    if (!line || line.startsWith('#')) continue
    if (FINGERPRINT_RE.test(line)) {
      fingerprints.add(line)
      continue
    }
    const at = line.indexOf('@')
    if (at !== -1) {
      const ruleId = line.slice(0, at).trim()
      const path = normalizePath(line.slice(at + 1).trim())
      if (ruleId && path) scoped.push({ ruleId, path })
      continue
    }
    rules.add(line)
  }

  return { rules, scoped, fingerprints }
}

export function isSuppressed(finding, suppress) {
  if (!suppress) return false
  if (suppress.rules.has(finding.ruleId)) return true
  if (suppress.fingerprints.has(finding.fingerprint)) return true
  const path = finding.path.replaceAll('\\', '/')
  return suppress.scoped.some(
    (entry) => entry.ruleId === finding.ruleId && (path === entry.path || path.endsWith(`/${entry.path}`)),
  )
}

function normalizePath(path) {
  return path.replaceAll('\\', '/').replace(/^\.\//, '')
}
