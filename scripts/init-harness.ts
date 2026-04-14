#!/usr/bin/env bun
/**
 * init-harness.ts - Initialize a new Harness project
 * 
 * Usage:
 *   bun scripts/init-harness.ts <project-name> [options]
 *   bun scripts/init-harness.ts my-harness --template basic --providers anthropic --tools bash,file,grep
 */

import { mkdir, writeFile, readFile, copyFile } from 'fs/promises'
import { existsSync } from 'fs'
import { join, dirname } from 'path'
import { fileURLToPath } from 'url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)
const TEMPLATE_DIR = join(__dirname, '..', 'templates')
const BASIC_TEMPLATE = join(TEMPLATE_DIR, 'basic')

interface InitOptions {
  template: 'basic' | 'opencode' | 'superpowers'
  providers: string[]
  tools: string[]
  features: string[]
  withREPL: boolean
  withDaemon: boolean
  withBridge: boolean
  withTesting: boolean
  projectDescription?: string
  targetSoftware?: string
}

const DEFAULT_OPTIONS: InitOptions = {
  template: 'basic',
  providers: ['anthropic'],
  tools: ['bash', 'file', 'grep', 'glob'],
  features: ['BUDDY', 'BRIDGE_MODE'],
  withREPL: true,
  withDaemon: false,
  withBridge: false,
  withTesting: true,
}

function parseArgs(): { name: string; options: Partial<InitOptions> } {
  const args = process.argv.slice(2)
  const name = args[0]
  
  if (!name) {
    console.error('Usage: bun scripts/init-harness.ts <project-name> [options]')
    console.error('Options:')
    console.error('  --template <basic|opencode|superpowers>')
    console.error('  --providers <anthropic,openai,gemini,...>')
    console.error('  --tools <bash,file,grep,glob,...>')
    console.error('  --features <BUDDY,BRIDGE_MODE,...>')
    console.error('  --with-repl')
    console.error('  --with-daemon')
    console.error('  --with-bridge')
    console.error('  --no-testing')
    process.exit(1)
  }

  const options: Partial<InitOptions> = {}
  
  for (let i = 1; i < args.length; i++) {
    const arg = args[i]
    if (arg === '--template' && args[i + 1]) {
      options.template = args[++i] as InitOptions['template']
    } else if (arg === '--providers' && args[i + 1]) {
      options.providers = args[++i].split(',')
    } else if (arg === '--tools' && args[i + 1]) {
      options.tools = args[++i].split(',')
    } else if (arg === '--features' && args[i + 1]) {
      options.features = args[++i].split(',')
    } else if (arg === '--with-repl') {
      options.withREPL = true
    } else if (arg === '--no-repl') {
      options.withREPL = false
    } else if (arg === '--with-daemon') {
      options.withDaemon = true
    } else if (arg === '--with-bridge') {
      options.withBridge = true
    } else if (arg === '--no-testing') {
      options.withTesting = false
    } else if (arg === '--description' && args[i + 1]) {
      options.projectDescription = args[++i]
    } else if (arg === '--target' && args[i + 1]) {
      options.targetSoftware = args[++i]
    }
  }

  return { name, options }
}

async function copyTemplateDir(src: string, dest: string, vars: Record<string, string>) {
  const { readdir, stat } = await import('fs/promises')
  
  async function copyDir(src: string, dest: string) {
    await mkdir(dest, { recursive: true })
    const entries = await readdir(src)
    
    for (const entry of entries) {
      const srcPath = join(src, entry)
      const destPath = join(dest, entry)
      const stat = await stat(srcPath)
      
      if (stat.isDirectory()) {
        await copyDir(srcPath, destPath)
      } else {
        let content = await readFile(srcPath, 'utf-8')
        // Replace template variables
        for (const [key, value] of Object.entries(vars)) {
          content = content.replace(new RegExp(`\\{\\{${key}\\}\\}`, 'g'), value)
        }
        await writeFile(destPath, content)
      }
    }
  }
  
  await copyDir(src, dest)
}

function toKebabCase(name: string): string {
  return name
    .replace(/([a-z])([A-Z])/g, '$1-$2')
    .replace(/[\s_]+/g, '-')
    .toLowerCase()
}

function toPascalCase(name: string): string {
  return name
    .split(/[-_\s]+/)
    .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join('')
}

async function initHarness(name: string, options: Partial<InitOptions> = {}): Promise<void> {
  const opts: InitOptions = { ...DEFAULT_OPTIONS, ...options }
  const projectDir = join(process.cwd(), name)
  
  if (existsSync(projectDir)) {
    console.error(`Error: Directory '${name}' already exists`)
    process.exit(1)
  }

  console.log(`\n🚀 Initializing Harness project: ${name}`)
  console.log(`   Template: ${opts.template}`)
  console.log(`   Providers: ${opts.providers.join(', ')}`)
  console.log(`   Tools: ${opts.tools.join(', ')}`)
  console.log(`   Features: ${opts.features.join(', ')}\n`)

  // Create project directory
  await mkdir(projectDir, { recursive: true })

  // Template variables
  const vars: Record<string, string> = {
    PROJECT_NAME: name,
    PROJECT_NAME_KEBAB: toKebabCase(name),
    PROJECT_NAME_PASCAL: toPascalCase(name),
    PROJECT_DESCRIPTION: opts.projectDescription || `A Harness project: ${name}`,
    TARGET_SOFTWARE: opts.targetSoftware || '',
    PROVIDERS: JSON.stringify(opts.providers),
    TOOLS: JSON.stringify(opts.tools),
    FEATURES: JSON.stringify(opts.features),
    VERSION: '0.1.0',
    CURRENT_YEAR: new Date().getFullYear().toString(),
    WITH_REPL: opts.withREPL.toString(),
    WITH_DAEMON: opts.withDaemon.toString(),
    WITH_BRIDGE: opts.withBridge.toString(),
    WITH_TESTING: opts.withTesting.toString(),
    DEFAULT_FEATURES: JSON.stringify(opts.features),
  }

  // Copy template
  const templateDir = join(TEMPLATE_DIR, opts.template === 'superpowers' ? 'superpowers' : opts.template)
  if (existsSync(templateDir)) {
    await copyTemplateDir(templateDir, projectDir, vars)
  } else {
    // Fallback to basic template
    await copyTemplateDir(BASIC_TEMPLATE, projectDir, vars)
  }

  // Generate AGENTS.md if not from template
  const agentsPath = join(projectDir, 'AGENTS.md')
  if (!existsSync(agentsPath)) {
    await generateAgentsMd(projectDir, name, opts)
  }

  // Initialize git if not exists
  const gitDir = join(projectDir, '.git')
  if (!existsSync(gitDir)) {
    console.log('📦 Initializing git repository...')
    const { execSync } = await import('child_process')
    try {
      execSync('git init', { cwd: projectDir, stdio: 'ignore' })
      execSync('git add .', { cwd: projectDir, stdio: 'ignore' })
      execSync('git commit -m "Initial harness project structure"', { cwd: projectDir, stdio: 'ignore' })
      console.log('✅ Git repository initialized')
    } catch {
      console.log('⚠️  Git initialization skipped (git not available)')
    }
  }

  console.log(`\n✅ Harness project created at: ${projectDir}`)
  console.log(`\nNext steps:`)
  console.log(`  cd ${name}`)
  console.log(`  bun install`)
  console.log(`  bun run dev`)
}

async function generateAgentsMd(projectDir: string, name: string, opts: InitOptions): Promise<void> {
  const content = `# AGENTS.md

## 项目概述

${opts.projectDescription || name} — 一个基于 Harness 架构的 AI 编程助手项目。

## 核心命令

\`\`\`bash
bun install          # 安装依赖
bun run dev           # 开发模式
bun run build         # 构建
bun test              # 运行测试
bun run lint          # 检查 lint
bun run lint:fix      # 自动修复 lint
bun run format        # 格式化
\`\`\`

## 运行时要求

- **必须使用 Bun**（不是 Node.js）
- ESM 模块系统 (\`"type": "module"\`)

## 架构要点

- **入口**：\`src/entrypoints/cli.tsx\`
- **核心循环**：\`src/core/query.ts\`
- **Tool 注册**：\`src/tools/tools.ts\`
- **状态管理**：\`src/state/store.ts\`

## Feature Flag 系统

\`\`\`typescript
import { feature } from 'bun:bundle'
feature('FLAG_NAME')  // 返回 boolean
\`\`\`

启用方式：\`FEATURE_<FLAG_NAME>=1\` 环境变量

## 测试

- 框架：\`bun:test\`
- 单元测试：\`src/**/__tests__/*.test.ts\`
- Mock：\`mock.module()\` 必须内联在测试文件中
`
  await writeFile(join(projectDir, 'AGENTS.md'), content)
}

// Main execution
const { name, options } = parseArgs()
await initHarness(name, options)
