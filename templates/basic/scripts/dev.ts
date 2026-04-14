#!/usr/bin/env bun
/**
 * Dev mode entry point
 * Injects MACRO defines via Bun -d flags and enables features
 */

import { join, dirname } from 'path'
import { fileURLToPath } from 'node:url'
import { getMacroDefines } from './defines'

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)
const projectRoot = join(__dirname, '..')
const cliPath = join(projectRoot, 'src/entrypoints/cli.tsx')

const defines = getMacroDefines()
const defineArgs = Object.entries(defines).flatMap(([k, v]) => ['-d', `${k}:${v}`])

// Default features enabled in dev mode
const DEFAULT_FEATURES = [
  'BUDDY',
  'TRANSCRIPT_CLASSIFIER',
  'BRIDGE_MODE',
  'AGENT_TRIGGERS_REMOTE',
  'CHICAGO_MCP',
  'VOICE_MODE',
  'SHOT_STATS',
  'PROMPT_CACHE_BREAK_DETECTION',
  'TOKEN_BUDGET',
  'AGENT_TRIGGERS',
  'ULTRATHINK',
  'BUILTIN_EXPLORE_PLAN_AGENTS',
  'LODESTONE',
  'EXTRACT_MEMORIES',
  'VERIFICATION_AGENT',
  'KAIROS_BRIEF',
  'AWAY_SUMMARY',
  'ULTRAPLAN',
]

// Collect additional features from FEATURE_* env vars
const envFeatures = Object.entries(process.env)
  .filter(([k]) => k.startsWith('FEATURE_'))
  .map(([k]) => k.replace('FEATURE_', ''))

const allFeatures = [...new Set([...DEFAULT_FEATURES, ...envFeatures])]
const featureArgs = allFeatures.flatMap((name) => ['--feature', name])

// Debug mode support
const inspectArgs = process.env.BUN_INSPECT
  ? ['--inspect-wait=' + process.env.BUN_INSPECT]
  : []

const result = Bun.spawnSync(
  ['bun', ...inspectArgs, 'run', ...defineArgs, ...featureArgs, cliPath, ...process.argv.slice(2)],
  { stdio: ['inherit', 'inherit', 'inherit'], cwd: projectRoot }
)

process.exit(result.exitCode ?? 0)
