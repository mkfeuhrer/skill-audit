import { readFile } from 'node:fs/promises'
import { existsSync } from 'node:fs'
import { auditTargets, format, exceedsThreshold, rules } from './index.mjs'

const USAGE = `skill-audit — static scanner for agent instruction files

Usage
  skill-audit [paths...] [options]

Options
  --format <text|json|sarif>   output format (default: text)
  --fail-on <error|warning|none>  exit non-zero threshold (default: error)
  --config <path>              JSON config, defaults to .skill-audit.json
  --no-scripts                 skip sibling scripts/ directories
  --list-rules                 print rule ids and exit
  --version                    print version and exit
  --help                       print this help and exit

Exit codes
  0  no findings at or above the threshold
  1  findings at or above the threshold
  2  usage error

Config (.skill-audit.json)
  { "allowedHosts": ["example.com"], "ignore": ["egress/undeclared-host"] }
`

export async function main(argv = process.argv.slice(2)) {
  const targets = []
  let formatName = 'text'
  let failOn = 'error'
  let configPath = null
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
    if (arg === '--format' || arg === '--fail-on' || arg === '--config') {
      const value = argv[++i]
      if (!value) return usageError(`missing value for ${arg}`)
      if (arg === '--format') {
        if (!['text', 'json', 'sarif'].includes(value)) return usageError(`unknown format "${value}"`)
        formatName = value
      } else if (arg === '--fail-on') {
        if (!['error', 'warning', 'none'].includes(value)) return usageError(`unknown --fail-on "${value}"`)
        failOn = value
      } else {
        configPath = value
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
  const { files, findings, summary } = await auditTargets(targets, { ...config, includeScripts })
  process.stdout.write(format(findings, summary, { format: formatName, root: process.cwd() }))

  if (files.length === 0) process.stderr.write('skill-audit: no instruction files found\n')

  return exceedsThreshold(summary, failOn) ? 1 : 0
}

async function loadConfig(explicitPath) {
  const path = explicitPath || (existsSync('.skill-audit.json') ? '.skill-audit.json' : null)
  if (!path) return { allowedHosts: [], ignore: [] }
  try {
    const config = JSON.parse(await readFile(path, 'utf8'))
    return {
      allowedHosts: Array.isArray(config.allowedHosts) ? config.allowedHosts : [],
      ignore: Array.isArray(config.ignore) ? config.ignore : [],
    }
  } catch (error) {
    process.stderr.write(`skill-audit: could not read ${path}: ${error.message}\n`)
    return { allowedHosts: [], ignore: [] }
  }
}

function usageError(message) {
  process.stderr.write(`skill-audit: ${message}\n\n${USAGE}`)
  return 2
}
