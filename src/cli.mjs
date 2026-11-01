import { readFile } from 'node:fs/promises'
import { existsSync } from 'node:fs'
import { auditTargets, format, exceedsThreshold, rules } from './index.mjs'
import { parseIgnoreFile } from './suppress.mjs'

const USAGE = `skill-audit — static security scanner for agent instruction files

Usage
  skill-audit [paths...] [options]

Options
  --format <text|json|sarif|markdown|github>   output format (default: text)
  --fail-on <error|warning|none>               exit non-zero threshold (default: error)
  --config <path>              JSON config, defaults to .skill-audit.json
  --ignore-file <path>         suppression file, defaults to ./.skill-audit-ignore
                               (only ever read from the working directory, never
                               from inside scanned paths)
  --inline-allows              honor inline "skill-audit:allow" markers
  --no-scripts                 skip sibling scripts/ directories
  --list-rules                 print rule ids and exit
  --version                    print version and exit
  --help                       print this help and exit

Exit codes
  0  no findings at or above the threshold
  1  findings at or above the threshold
  2  usage error

Config (.skill-audit.json)
  { "allowedHosts": ["example.com"], "ignore": ["egress/undeclared-host"], "inlineAllows": true }

Suppressions (.skill-audit-ignore)
  <rule-id>            suppress the rule everywhere
  <rule-id>@<path>     suppress the rule for one file (path suffix)
  <fingerprint>        suppress one exact finding (see json output)
  # lines starting with # are comments
`

export async function main(argv = process.argv.slice(2)) {
  const targets = []
  let formatName = 'text'
  let failOn = 'error'
  let configPath = null
  let ignoreFilePath = null
  let inlineAllows = false
  let includeScripts = true

  for (let i = 0; i < argv.length; i++) {
    const arg = argv[i]
    if (arg === '--help' || arg === '-h') {
      process.stdout.write(USAGE)
      return 0
    }
    if (arg === '--version' || arg === '-v') {
      const pkg = JSON.parse(await readFile(new URL('../package.json', import.meta.url), 'utf8'))
      process.stdout.write(`${pkg.version}\n`)
      return 0
    }
    if (arg === '--list-rules') {
      for (const rule of rules) process.stdout.write(`${rule.level.padEnd(7)} ${rule.id}  ${rule.shortDescription}\n`)
      return 0
    }
    if (arg === '--no-scripts') {
      includeScripts = false
      continue
    }
    if (arg === '--inline-allows') {
      inlineAllows = true
      continue
    }
    if (arg === '--format' || arg === '--fail-on' || arg === '--config' || arg === '--ignore-file') {
      const value = argv[++i]
      if (!value) return usageError(`missing value for ${arg}`)
      if (arg === '--format') {
        if (!['text', 'json', 'sarif', 'markdown', 'github'].includes(value)) return usageError(`unknown format "${value}"`)
        formatName = value
      } else if (arg === '--fail-on') {
        if (!['error', 'warning', 'none'].includes(value)) return usageError(`unknown --fail-on "${value}"`)
        failOn = value
      } else if (arg === '--config') {
        configPath = value
      } else {
        ignoreFilePath = value
      }
      continue
    }
    if (arg.startsWith('--format=')) {
      formatName = arg.slice('--format='.length)
      continue
    }
    if (arg.startsWith('--fail-on=')) {
      failOn = arg.slice('--fail-on='.length)
      continue
    }
    if (arg.startsWith('-')) return usageError(`unknown flag "${arg}"`)
    targets.push(arg)
  }

  if (targets.length === 0) targets.push('.')

  for (const target of targets) {
    if (!existsSync(target)) return usageError(`path not found: ${target}`)
  }

  const config = await loadConfig(configPath)
  const ignorePath = ignoreFilePath || (existsSync('.skill-audit-ignore') ? '.skill-audit-ignore' : null)
  const auditConfig = {
    ...config,
    includeScripts,
    suppress: ignorePath ? parseIgnoreFile(await safeRead(ignorePath)) : null,
    inlineAllows: inlineAllows || config.inlineAllows === true,
  }
  const { files, findings, summary } = await auditTargets(targets, auditConfig)
  process.stdout.write(format(findings, summary, { format: formatName, root: process.cwd() }))

  if (files.length === 0) process.stderr.write('skill-audit: no instruction files found\n')

  return exceedsThreshold(summary, failOn) ? 1 : 0
}

async function loadConfig(explicitPath) {
  const path = explicitPath || (existsSync('.skill-audit.json') ? '.skill-audit.json' : null)
  if (!path) return { allowedHosts: [], ignore: [], inlineAllows: false }
  try {
    const config = JSON.parse(await readFile(path, 'utf8'))
    return {
      allowedHosts: Array.isArray(config.allowedHosts) ? config.allowedHosts : [],
      ignore: Array.isArray(config.ignore) ? config.ignore : [],
      inlineAllows: config.inlineAllows === true,
    }
  } catch (error) {
    process.stderr.write(`skill-audit: could not read ${path}: ${error.message}\n`)
    return { allowedHosts: [], ignore: [], inlineAllows: false }
  }
}

async function safeRead(path) {
  try {
    return await readFile(path, 'utf8')
  } catch (error) {
    process.stderr.write(`skill-audit: could not read ${path}: ${error.message}\n`)
    return ''
  }
}

function usageError(message) {
  process.stderr.write(`skill-audit: ${message}\n\n${USAGE}`)
  return 2
}
