import { rule as undeclaredHost } from './egress/undeclared-host.mjs'
import { rule as envInterpolatedUrl } from './egress/env-interpolated-url.mjs'
import { rule as curlPipeSh } from './exec/curl-pipe-sh.mjs'
import { rule as shellTrue } from './exec/shell-true.mjs'
import { rule as credentialRead } from './fs/credential-read.mjs'
import { rule as hiddenUnicode } from './instr/hidden-unicode.mjs'
import { rule as htmlCommentInstruction } from './instr/html-comment-instruction.mjs'
import { rule as overrideLanguage } from './instr/override-language.mjs'
import { rule as obfuscatedBlob } from './meta/obfuscated-blob.mjs'
import { rule as overbroad } from './perm/overbroad.mjs'

export const rules = [
  undeclaredHost,
  envInterpolatedUrl,
  curlPipeSh,
  shellTrue,
  credentialRead,
  hiddenUnicode,
  htmlCommentInstruction,
  overrideLanguage,
  overbroad,
  obfuscatedBlob,
]

export const ruleById = new Map(rules.map((rule) => [rule.id, rule]))
