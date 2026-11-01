import { CODE_KINDS, scanSegments } from '../_shared.mjs'

const CURL_PIPE_RE = /(?:curl|wget)\b[^\n;|]{0,300}\|\s*(?:sudo\s+)?(?:ba|z|k)?sh\b/g

export const rule = {
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
}
