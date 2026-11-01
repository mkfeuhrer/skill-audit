export const rule = {
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
}
