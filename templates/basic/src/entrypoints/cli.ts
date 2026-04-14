/**
 * CLI Entry Point - {{PROJECT_NAME}}
 * Fast paths with zero-module loading for version, help, etc.
 */

import { parseArgs } from 'util'

interface CliOptions {
  version: boolean
  help: boolean
  json: boolean
  daemon: boolean
  bridge: boolean
  debug: boolean
}

const CLI_VERSION = '{{VERSION}}'

function printVersion() {
  console.log(`{{PROJECT_NAME}} v${CLI_VERSION}`)
}

function printHelp() {
  console.log(`
{{PROJECT_NAME}} - AI Coding Harness

Usage: {{PROJECT_NAME_KEBAB}} [options]

Options:
  -v, --version    Print version
  -h, --help       Show this help
  --json           JSON output mode
  --daemon         Start in daemon mode
  --bridge         Start in bridge mode (remote control)
  --debug          Enable debug mode

Examples:
  {{PROJECT_NAME_KEBAB}} --version
  {{PROJECT_NAME_KEBAB}} --help
  {{PROJECT_NAME_KEBAB}} --daemon

For more information, see AGENTS.md
`)
}

export async function main() {
  const { values, positionals } = parseArgs({
    options: {
      version: { type: 'boolean', short: 'v' },
      help: { type: 'boolean', short: 'h' },
      json: { type: 'boolean' },
      daemon: { type: 'boolean' },
      bridge: { type: 'boolean' },
      debug: { type: 'boolean' },
    },
    allowPositionals: true,
  })

  const opts = values as Partial<CliOptions>

  // Fast path: version (zero module loading)
  if (opts.version) {
    printVersion()
    return
  }

  // Fast path: help
  if (opts.help) {
    printHelp()
    return
  }

  // Debug mode
  if (opts.debug) {
    process.env.BUN_INSPECT = 'localhost:9229'
  }

  // Mode selection
  if (opts.daemon) {
    await startDaemonMode()
    return
  }

  if (opts.bridge) {
    await startBridgeMode()
    return
  }

  // Default: REPL mode
  await startREPLMode(opts)
}

async function startREPLMode(opts: Partial<CliOptions>) {
  console.log(`{{PROJECT_NAME}} v${CLI_VERSION} - REPL mode`)
  console.log('Type --help for options\n')
  
  // Lazy load full CLI
  const { startREPL } = await import('../ui/repl.js')
  await startREPL(opts)
}

async function startDaemonMode() {
  const { startDaemon } = await import('../daemon/main.js')
  await startDaemon()
}

async function startBridgeMode() {
  const { startBridge } = await import('../bridge/bridgeMain.js')
  await startBridge()
}

// Run main if this is the entry point
main().catch((err) => {
  console.error('Error:', err)
  process.exit(1)
})
