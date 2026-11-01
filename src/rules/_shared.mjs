export const CODE_KINDS = ['code', 'script']

export const URL_RE = /\bhttps?:\/\/[^\s"'`<>]+/g

export function hostAllowed(host, allowedHosts) {
  const target = host.toLowerCase()
  return allowedHosts.some((allowed) => {
    const entry = allowed.toLowerCase()
    return entry === target || target.endsWith(`.${entry}`)
  })
}

export function scanSegments(file, kinds, regex, build) {
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

export function linesOf(file, kinds) {
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
