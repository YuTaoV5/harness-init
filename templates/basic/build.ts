/**
 * Build configuration for {{PROJECT_NAME}}
 * Usage: bun run build.ts
 */

import { mkdir, writeFile, readFile } from 'fs/promises'
import { join } from 'path'
import { existsSync } from 'fs'

const OUT_DIR = 'dist'

interface MacroDefine {
  [key: string]: string
}

export function getMacroDefines(): MacroDefine {
  return {
    'MACRO.VERSION': JSON.stringify('{{VERSION}}'),
    'MACRO.BUILD_TIME': JSON.stringify(new Date().toISOString()),
    'MACRO.PROJECT_NAME': JSON.stringify('{{PROJECT_NAME}}'),
  }
}

// Default features for build
const DEFAULT_BUILD_FEATURES = [
  'AGENT_TRIGGERS_REMOTE',
  'CHICAGO_MCP',
  'VOICE_MODE',
]

async function build() {
  console.log('Building {{PROJECT_NAME}}...')
  
  // Clean output directory
  const { rmSync } = await import('fs')
  rmSync(OUT_DIR, { recursive: true, force: true })
  await mkdir(OUT_DIR, { recursive: true })

  // Collect features from environment
  const envFeatures = Object.keys(process.env)
    .filter(k => k.startsWith('FEATURE_'))
    .map(k => k.replace('FEATURE_', ''))
  const features = [...new Set([...DEFAULT_BUILD_FEATURES, ...envFeatures])]

  // Bundle
  const result = await Bun.build({
    entrypoints: ['src/entrypoints/cli.tsx'],
    outdir: OUT_DIR,
    target: 'bun',
    splitting: true,
    define: getMacroDefines(),
    features,
  })

  if (!result.success) {
    console.error('Build failed:')
    for (const log of result.logs) {
      console.error(log)
    }
    process.exit(1)
  }

  // Post-process: Node.js compatibility
  const files = await Bun.Glob('*.js').scan(OUT_DIR)
  let patched = 0
  
  for (const file of files) {
    const filePath = join(OUT_DIR, file)
    const content = await readFile(filePath, 'utf-8')
    if (content.includes('var __require = import.meta.require;')) {
      await writeFile(
        filePath,
        content.replace(
          'var __require = import.meta.require;',
          `var __require = typeof import.meta.require === "function" ? import.meta.require : (await import("module")).createRequire(import.meta.url);`
        )
      )
      patched++
    }
  }

  console.log(`Bundled ${result.outputs.length} files to ${OUT_DIR}/ (${patched} patched for Node.js compat)`)
}

build().catch((err) => {
  console.error('Build failed:', err)
  process.exit(1)
})
