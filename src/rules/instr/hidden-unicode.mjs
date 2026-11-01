const INVISIBLE_RE = /[\u00AD\u200B-\u200F\u202A-\u202E\u2060-\u2064\uFEFF]/
const TAG_CHAR_RE = /[\u{E0000}-\u{E007F}]/u

export const rule = {
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
}
