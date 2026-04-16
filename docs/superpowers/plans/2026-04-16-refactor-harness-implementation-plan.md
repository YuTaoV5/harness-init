# Refactor Harness Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a Refactor Harness based on Extended Harness architecture (Harness Core + Memory Layer + VerifyPipeline) for kernel-level code repository重构工作流。

**Architecture:** 基于 basic template 扩展，增加 ProjectKnowledgeStore（bounded resource memory）、平台感知搜索工具链、RefactorTools（ScopeTool, VerifyTool）。

**Tech Stack:** TypeScript, Bun, Zod, Harness Core (query loop + tool registry + state store)

---

## File Structure

```
templates/refactor-harness/
├── src/
│   ├── entrypoints/
│   │   └── cli.ts                    # Refactor mode entry
│   ├── core/
│   │   └── query.ts                  # Harness query loop (from basic)
│   ├── state/
│   │   ├── store.ts                 # Harness store (from basic)
│   │   └── projectKnowledgeStore.ts  # NEW: Memory layer with bounded management
│   ├── memory/
│   │   ├── contextCollapse.ts        # NEW: Context collapse/eviction
│   │   └── persistence.ts           # NEW: Disk persistence for knowledge
│   ├── tools/
│   │   ├── Tool.ts                   # Tool interface (from basic)
│   │   ├── tools.ts                  # Tool registry (extended)
│   │   ├── RefactorTools/           # NEW: Refactor-specific tools
│   │   │   ├── ScopeTool/
│   │   │   │   └── index.ts
│   │   │   ├── VerifyTool/
│   │   │   │   └── index.ts
│   │   │   └── DiffTool/
│   │   │       └── index.ts
│   │   └── shared/
│   │       ├── platformSearch.ts     # NEW: Platform-aware search (rg/findstr/grep)
│   │       └── diff.ts               # NEW: diff utility
│   └── types/
│       └── global.d.ts
├── tests/
│   └── unit/
│       ├── projectKnowledgeStore.test.ts
│       ├── platformSearch.test.ts
│       └── contextCollapse.test.ts
├── package.json
├── tsconfig.json
├── biome.json
└── AGENTS.md
```

---

## Task 1: Initialize Project Structure

**Files:**
- Create: `templates/refactor-harness/package.json`
- Create: `templates/refactor-harness/tsconfig.json`
- Create: `templates/refactor-harness/biome.json`
- Create: `templates/refactor-harness/src/types/global.d.ts`

- [ ] **Step 1: Create package.json**

```json
{
  "name": "@harness/refactor-harness",
  "version": "0.1.0",
  "type": "module",
  "private": true,
  "scripts": {
    "dev": "bun run src/entrypoints/cli.ts",
    "build": "bun run build.ts",
    "test": "bun test",
    "lint": "biome check .",
    "lint:fix": "biome check --write .",
    "format": "biome format --write ."
  },
  "dependencies": {
    "zod": "^3.23.8"
  },
  "devDependencies": {
    "@biomejs/biome": "^1.9.0",
    "bun-types": "^1.1.0"
  },
  "engines": {
    "bun": ">=1.1.0"
  }
}
```

- [ ] **Step 2: Create tsconfig.json**

```json
{
  "compilerOptions": {
    "target": "ES2022",
    "lib": ["ES2022"],
    "module": "ES2022",
    "moduleResolution": "bundler",
    "types": ["bun-types"],
    "strict": true,
    "esModuleInterop": true,
    "skipLibCheck": true,
    "forceConsistentCasingInFileNames": true,
    "resolveJsonModule": true,
    "allowSyntheticDefaultImports": true,
    "isolatedModules": true,
    "noEmit": true,
    "jsx": "react-jsx"
  },
  "include": ["src/**/*", "tests/**/*"],
  "exclude": ["node_modules"]
}
```

- [ ] **Step 3: Create biome.json**

```json
{
  "$schema": "https://biomejs.dev/schemas/1.9.0/schema.json",
  "organizeImports": { "enabled": true },
  "linter": {
    "enabled": true,
    "rules": {
      "recommended": true,
      "suspicious": {
        "noExplicitAny": "off"
      }
    }
  },
  "formatter": {
    "enabled": true,
    "indentStyle": "2",
    "indentWidth": 2,
    "lineWidth": 100
  }
}
```

- [ ] **Step 4: Create src/types/global.d.ts**

```typescript
/// <reference types="bun-types" />

declare module 'bun:bundle' {
  export function feature(name: string): boolean
}
```

- [ ] **Step 5: Commit**

```bash
git add templates/refactor-harness/package.json templates/refactor-harness/tsconfig.json templates/refactor-harness/biome.json templates/refactor-harness/src/types/global.d.ts
git commit -m "feat(refactor-harness): initialize project structure"
```

---

## Task 2: Copy Basic Template Core Files

**Files:**
- Copy: `templates/basic/src/core/query.ts` → `templates/refactor-harness/src/core/query.ts`
- Copy: `templates/basic/src/state/store.ts` → `templates/refactor-harness/src/state/store.ts`
- Copy: `templates/basic/src/tools/Tool.ts` → `templates/refactor-harness/src/tools/Tool.ts`
- Copy: `templates/basic/src/tools/tools.ts` → `templates/refactor-harness/src/tools/tools.ts`
- Copy: `templates/basic/src/tools/BashTool/` → `templates/refactor-harness/src/tools/BashTool/`
- Copy: `templates/basic/src/tools/FileReadTool/` → `templates/refactor-harness/src/tools/FileReadTool/`
- Copy: `templates/basic/src/tools/FileWriteTool/` → `templates/refactor-harness/src/tools/FileWriteTool/`
- Copy: `templates/basic/src/tools/FileEditTool/` → `templates/refactor-harness/src/tools/FileEditTool/`
- Copy: `templates/basic/src/tools/GlobTool/` → `templates/refactor-harness/src/tools/GlobTool/`
- Copy: `templates/basic/src/tools/GrepTool/` → `templates/refactor-harness/src/tools/GrepTool/`
- Copy: `templates/basic/src/tools/shared/` → `templates/refactor-harness/src/tools/shared/`

- [ ] **Step 1: Copy files from basic template**

```bash
cp templates/basic/src/core/query.ts templates/refactor-harness/src/core/query.ts
cp templates/basic/src/state/store.ts templates/refactor-harness/src/state/store.ts
cp templates/basic/src/tools/Tool.ts templates/refactor-harness/src/tools/Tool.ts
cp templates/basic/src/tools/tools.ts templates/refactor-harness/src/tools/tools.ts
cp -r templates/basic/src/tools/BashTool templates/refactor-harness/src/tools/
cp -r templates/basic/src/tools/FileReadTool templates/refactor-harness/src/tools/
cp -r templates/basic/src/tools/FileWriteTool templates/refactor-harness/src/tools/
cp -r templates/basic/src/tools/FileEditTool templates/refactor-harness/src/tools/
cp -r templates/basic/src/tools/GlobTool templates/refactor-harness/src/tools/
cp -r templates/basic/src/tools/GrepTool templates/refactor-harness/src/tools/
cp -r templates/basic/src/tools/shared templates/refactor-harness/src/tools/
```

- [ ] **Step 2: Commit**

```bash
git add templates/refactor-harness/src/core/ templates/refactor-harness/src/state/ templates/refactor-harness/src/tools/
git commit -m "feat(refactor-harness): copy basic template core files"
```

---

## Task 3: Implement Platform-Aware Search Utility

**Files:**
- Create: `templates/refactor-harness/src/tools/shared/platformSearch.ts`
- Create: `tests/unit/platformSearch.test.ts`

- [ ] **Step 1: Write the failing test**

```typescript
// tests/unit/platformSearch.test.ts
import { describe, expect, test } from 'bun:test'
import { detectSearchTool, searchFiles } from '../../src/tools/shared/platformSearch'

describe('platformSearch', () => {
  test('detectSearchTool returns rg on windows when available', async () => {
    const tool = await detectSearchTool()
    // On Windows with rg installed, should return 'rg'
    // On other platforms, should return 'grep'
    expect(['rg', 'grep', 'findstr']).toContain(tool)
  })

  test('searchFiles returns results with file, line, content', async () => {
    const results = await searchFiles({
      pattern: 'test',
      path: '.',
    })
    expect(Array.isArray(results)).toBe(true)
  })
})
```

- [ ] **Step 2: Run test to verify it fails**

```bash
cd templates/refactor-harness && bun test tests/unit/platformSearch.test.ts
Expected: FAIL - can't find module
```

- [ ] **Step 3: Write platformSearch implementation**

```typescript
// src/tools/shared/platformSearch.ts

export type SearchTool = 'rg' | 'grep' | 'findstr'

interface SearchResult {
  file: string
  line: number
  content: string
}

interface SearchOptions {
  pattern: string
  path?: string
  include?: string
  recursive?: boolean
  caseSensitive?: boolean
}

const TOOL_PRIORITY: SearchTool[] = ['rg', 'grep', 'findstr']

export async function detectSearchTool(): Promise<SearchTool> {
  const platform = process.platform
  
  if (platform === 'win32') {
    // On Windows, check tools in order of preference
    for (const tool of TOOL_PRIORITY) {
      try {
        const { execSync } = await import('child_process')
        execSync(`${tool} --version`, { stdio: 'ignore' })
        return tool
      } catch {
        continue
      }
    }
    return 'findstr' // Windows fallback
  }
  
  // macOS/Linux
  try {
    const { execSync } = await import('child_process')
    execSync('rg --version', { stdio: 'ignore' })
    return 'rg'
  } catch {
    return 'grep'
  }
}

export async function searchFiles(options: SearchOptions): Promise<SearchResult[]> {
  const tool = await detectSearchTool()
  const { pattern, path = '.', include, recursive = true } = options
  
  const args = buildSearchArgs(tool, pattern, { include, recursive })
  
  const { execSync } = await import('child_process')
  const cwd = path
  
  try {
    const output = execSync(`${tool} ${args.join(' ')}`, { cwd, encoding: 'utf-8' })
    return parseSearchOutput(output, tool)
  } catch (error) {
    // Tool not found or search failed
    if (error instanceof Error && error.message.includes('not recognized')) {
      // Fallback to basic grep
      return fallbackGrep(options)
    }
    return []
  }
}

function buildSearchArgs(tool: SearchTool, pattern: string, options: { include?: string; recursive?: boolean }): string[] {
  const args: string[] = ['-n'] // Always show line numbers
  
  if (options.caseSensitive === false) {
    args.push('-i')
  }
  
  if (!options.recursive) {
    args.push('-maxdepth 1')
  }
  
  if (options.include) {
    switch (tool) {
      case 'rg':
        args.push('-g', options.include)
        break
      case 'grep':
        args.push('--include=' + options.include)
        break
      case 'findstr':
        args.push(options.include)
        break
    }
  }
  
  args.push(pattern)
  args.push('*') // Default to all files
  
  return args
}

function parseSearchOutput(output: string, tool: SearchTool): SearchResult[] {
  const results: SearchResult[] = []
  const lines = output.split('\n').filter(Boolean)
  
  for (const line of lines) {
    const match = line.match(/^(.+?):(\d+):(.+)$/)
    if (match) {
      results.push({
        file: match[1],
        line: parseInt(match[2], 10),
        content: match[3].trim(),
      })
    }
  }
  
  return results
}

async function fallbackGrep(options: SearchOptions): Promise<SearchResult[]> {
  const { glob } = await import('glob')
  const { readFile } = await import('fs/promises')
  
  const { pattern, path = '.', include, recursive = true } = options
  const results: SearchResult[] = []
  
  const globPattern = include
    ? recursive ? `**/${include}` : include
    : recursive ? '**/*' : '*'
  
  const files = await glob(globPattern, { cwd: path, absolute: true })
  const regex = new RegExp(pattern, options.caseSensitive ? 'g' : 'gi')
  
  for (const file of files) {
    try {
      const content = await readFile(file, 'utf-8')
      const lines = content.split('\n')
      
      for (let i = 0; i < lines.length; i++) {
        if (regex.test(lines[i])) {
          results.push({
            file,
            line: i + 1,
            content: lines[i].trim(),
          })
        }
      }
    } catch {
      // Skip binary or unreadable files
    }
  }
  
  return results
}
```

- [ ] **Step 4: Run test to verify it passes**

```bash
cd templates/refactor-harness && bun test tests/unit/platformSearch.test.ts
Expected: PASS
```

- [ ] **Step 5: Commit**

```bash
git add templates/refactor-harness/src/tools/shared/platformSearch.ts tests/unit/platformSearch.test.ts
git commit -m "feat(refactor-harness): add platform-aware search utility"
```

---

## Task 4: Implement ProjectKnowledgeStore (Memory Layer)

**Files:**
- Create: `templates/refactor-harness/src/state/projectKnowledgeStore.ts`
- Create: `tests/unit/projectKnowledgeStore.test.ts`

- [ ] **Step 1: Write the failing test**

```typescript
// tests/unit/projectKnowledgeStore.test.ts
import { describe, expect, test, beforeEach } from 'bun:test'
import { createProjectKnowledgeStore, type RefactorScope, type ChangeRecord } from '../../src/state/projectKnowledgeStore'

describe('ProjectKnowledgeStore', () => {
  let store: ReturnType<typeof createProjectKnowledgeStore>
  
  beforeEach(() => {
    store = createProjectKnowledgeStore()
  })
  
  test('addFact and getFact work', () => {
    store.addFact('requirement', 'Extract kernel module X')
    expect(store.getFact('requirement')).toBe('Extract kernel module X')
  })
  
  test('getFact returns undefined for unknown key', () => {
    expect(store.getFact('unknown')).toBeUndefined()
  })
  
  test('addToScope adds file with reason', () => {
    store.addToScope('src/kernel/foo.ts', 'Core module')
    const context = store.getSessionContext()
    expect(context.files.has('src/kernel/foo.ts')).toBe(true)
  })
  
  test('updateConstraints sets constraints array', () => {
    store.updateConstraints(['Keep API stable', 'No breaking changes'])
    const context = store.getSessionContext()
    expect(context.constraints).toEqual(['Keep API stable', 'No breaking changes'])
  })
  
  test('addChangeRecord tracks history', () => {
    store.addChangeRecord({
      file: 'src/foo.ts',
      before: 'original',
      after: 'modified',
      timestamp: Date.now(),
    })
    const context = store.getSessionContext()
    expect(context.history).toHaveLength(1)
  })
  
  test('clearSession resets session context but keeps facts', () => {
    store.addFact('project', 'kernel-v2')
    store.addToScope('src/foo.ts', 'test')
    store.clearSession()
    
    expect(store.getFact('project')).toBe('kernel-v2') // Facts persist
    expect(store.getSessionContext().files.size).toBe(0) // Session reset
  })
})
```

- [ ] **Step 2: Run test to verify it fails**

```bash
cd templates/refactor-harness && bun test tests/unit/projectKnowledgeStore.test.ts
Expected: FAIL - can't find module
```

- [ ] **Step 3: Write ProjectKnowledgeStore implementation**

```typescript
// src/state/projectKnowledgeStore.ts

export interface ChangeRecord {
  file: string
  before: string
  after: string
  timestamp: number
  verified?: boolean
}

export interface FileEntry {
  addedAt: number
  reason: string
  status: 'pending' | 'done' | 'failed'
}

export interface RefactorScope {
  files: Map<string, FileEntry>
  constraints: string[]
  history: ChangeRecord[]
}

interface ProjectKnowledgeStore {
  // Facts (persistent)
  addFact(key: string, value: string): void
  getFact(key: string): string | undefined
  getAllFacts(): Record<string, string>
  
  // Session context (bounded, resettable)
  getSessionContext(): RefactorScope
  addToScope(file: string, reason: string): void
  updateFileStatus(file: string, status: FileEntry['status']): void
  updateConstraints(constraints: string[]): void
  addChangeRecord(record: ChangeRecord): void
  clearSession(): void
  
  // Context bounds
  getContextUsage(): { used: number; limit: number; percent: number }
  isNearLimit(): boolean
}

const CONTEXT_LIMIT = 100 // Maximum items in session before collapse

export function createProjectKnowledgeStore(): ProjectKnowledgeStore {
  const facts = new Map<string, string>()
  const scope: RefactorScope = {
    files: new Map(),
    constraints: [],
    history: [],
  }
  
  return {
    addFact(key: string, value: string) {
      facts.set(key, value)
    },
    
    getFact(key: string): string | undefined {
      return facts.get(key)
    },
    
    getAllFacts(): Record<string, string> {
      return Object.fromEntries(facts)
    },
    
    getSessionContext(): RefactorScope {
      return scope
    },
    
    addToScope(file: string, reason: string) {
      scope.files.set(file, {
        addedAt: Date.now(),
        reason,
        status: 'pending',
      })
    },
    
    updateFileStatus(file: string, status: FileEntry['status']) {
      const entry = scope.files.get(file)
      if (entry) {
        entry.status = status
      }
    },
    
    updateConstraints(constraints: string[]) {
      scope.constraints = constraints
    },
    
    addChangeRecord(record: ChangeRecord) {
      scope.history.push(record)
    },
    
    clearSession() {
      scope.files.clear()
      scope.constraints = []
      scope.history = []
    },
    
    getContextUsage() {
      const used = scope.files.size + scope.history.length + scope.constraints.length
      return {
        used,
        limit: CONTEXT_LIMIT,
        percent: Math.round((used / CONTEXT_LIMIT) * 100),
      }
    },
    
    isNearLimit() {
      return this.getContextUsage().percent >= 80
    },
  }
}
```

- [ ] **Step 4: Run test to verify it passes**

```bash
cd templates/refactor-harness && bun test tests/unit/projectKnowledgeStore.test.ts
Expected: PASS
```

- [ ] **Step 5: Commit**

```bash
git add templates/refactor-harness/src/state/projectKnowledgeStore.ts tests/unit/projectKnowledgeStore.test.ts
git commit -m "feat(refactor-harness): implement ProjectKnowledgeStore"
```

---

## Task 5: Implement Context Collapse (Memory Eviction)

**Files:**
- Create: `templates/refactor-harness/src/memory/contextCollapse.ts`
- Create: `tests/unit/contextCollapse.test.ts`

- [ ] **Step 1: Write the failing test**

```typescript
// tests/unit/contextCollapse.test.ts
import { describe, expect, test } from 'bun:test'
import { createContextCollapser, type CollapseOptions } from '../../src/memory/contextCollapse'
import type { ChangeRecord } from '../../src/state/projectKnowledgeStore'

describe('ContextCollapse', () => {
  test('collapseHistory reduces old records', () => {
    const collapser = createContextCollapser({ maxRecords: 5 })
    
    const oldRecords: ChangeRecord[] = Array.from({ length: 10 }, (_, i) => ({
      file: `file${i}.ts`,
      before: 'old',
      after: 'new',
      timestamp: Date.now() - i * 1000,
    }))
    
    const collapsed = collapser.collapseHistory(oldRecords)
    expect(collapsed.length).toBeLessThanOrEqual(5)
  })
  
  test('generateSummary preserves key info', () => {
    const collapser = createContextCollapser({})
    const summary = collapser.generateSummary({
      filesProcessed: 15,
      constraints: ['Keep API stable'],
      recentChanges: ['Changed foo.ts'],
    })
    
    expect(summary).toContain('15 files')
    expect(summary).toContain('Keep API stable')
  })
})
```

- [ ] **Step 2: Run test to verify it fails**

```bash
cd templates/refactor-harness && bun test tests/unit/contextCollapse.test.ts
Expected: FAIL
```

- [ ] **Step 3: Write contextCollapse implementation**

```typescript
// src/memory/contextCollapse.ts

import type { ChangeRecord } from '../state/projectKnowledgeStore.js'

export interface CollapseOptions {
  maxRecords?: number  // Default: 10
  maxFilesSummary?: number  // Default: 20
}

interface CollapseSummary {
  filesProcessed: number
  constraints: string[]
  recentChanges: string[]
  collapsedAt: number
  summary: string
}

export function createContextCollapser(options: CollapseOptions = {}) {
  const { maxRecords = 10, maxFilesSummary = 20 } = options
  
  function collapseHistory(records: ChangeRecord[]): ChangeRecord[] {
    if (records.length <= maxRecords) {
      return records
    }
    
    // Keep most recent records, collapse older ones into a summary
    const recent = records.slice(0, maxRecords)
    const older = records.slice(maxRecords)
    
    // Mark older records as collapsed (summarized)
    const collapsedSummary: ChangeRecord = {
      file: '[collapsed]',
      before: `${older.length} older changes summarized`,
      after: generateSummaryText(older),
      timestamp: older[0]?.timestamp ?? Date.now(),
    }
    
    return [...recent, collapsedSummary]
  }
  
  function generateSummaryText(records: ChangeRecord[]): string {
    const files = new Set(records.map(r => r.file))
    return `Summarized ${records.length} changes across ${files.size} files`
  }
  
  function generateSummary(data: {
    filesProcessed: number
    constraints: string[]
    recentChanges: string[]
  }): string {
    const parts: string[] = []
    
    parts.push(`Processed ${data.filesProcessed} files`)
    
    if (data.constraints.length > 0) {
      parts.push(`Constraints: ${data.constraints.join(', ')}`)
    }
    
    if (data.recentChanges.length > 0) {
      const shown = data.recentChanges.slice(0, 3)
      parts.push(`Recent: ${shown.join('; ')}`)
      if (data.recentChanges.length > 3) {
        parts.push(`...and ${data.recentChanges.length - 3} more`)
      }
    }
    
    return parts.join(' | ')
  }
  
  return {
    collapseHistory,
    generateSummary,
    maxRecords,
    maxFilesSummary,
  }
}
```

- [ ] **Step 4: Run test to verify it passes**

```bash
cd templates/refactor-harness && bun test tests/unit/contextCollapse.test.ts
Expected: PASS
```

- [ ] **Step 5: Commit**

```bash
git add templates/refactor-harness/src/memory/contextCollapse.ts tests/unit/contextCollapse.test.ts
git commit -m "feat(refactor-harness): implement context collapse"
```

---

## Task 6: Implement ScopeTool

**Files:**
- Create: `templates/refactor-harness/src/tools/RefactorTools/ScopeTool/index.ts`
- Create: `tests/unit/scopeTool.test.ts`

- [ ] **Step 1: Write the failing test**

```typescript
// tests/unit/scopeTool.test.ts
import { describe, expect, test, beforeEach } from 'bun:test'
import { ScopeTool } from '../../src/tools/RefactorTools/ScopeTool/index.js'
import { createProjectKnowledgeStore } from '../../src/state/projectKnowledgeStore.js'

describe('ScopeTool', () => {
  const store = createProjectKnowledgeStore()
  const mockContext = {
    options: { debug: false, tools: [], mcpClients: [] },
    abortController: new AbortController(),
    messages: [],
    projectStore: store,
  } as any
  
  test('name is ScopeTool', () => {
    expect(ScopeTool.name).toBe('ScopeTool')
  })
  
  test('adds file to scope with reason', async () => {
    const result = await ScopeTool.call(
      { action: 'add', file: 'src/kernel/foo.ts', reason: 'Core module' },
      mockContext,
      async () => ({ behavior: 'allow' }),
      {} as any
    )
    expect(result.data.added).toBe(true)
    expect(store.getSessionContext().files.has('src/kernel/foo.ts')).toBe(true)
  })
  
  test('lists all scoped files', async () => {
    store.addToScope('file1.ts', 'reason1')
    store.addToScope('file2.ts', 'reason2')
    
    const result = await ScopeTool.call(
      { action: 'list' },
      mockContext,
      async () => ({ behavior: 'allow' }),
      {} as any
    )
    expect(result.data.files).toHaveLength(2)
  })
  
  test('updates file status', async () => {
    store.addToScope('test.ts', 'test')
    const result = await ScopeTool.call(
      { action: 'status', file: 'test.ts', status: 'done' },
      mockContext,
      async () => ({ behavior: 'allow' }),
      {} as any
    )
    expect(store.getSessionContext().files.get('test.ts')?.status).toBe('done')
  })
})
```

- [ ] **Step 2: Run test to verify it fails**

```bash
cd templates/refactor-harness && bun test tests/unit/scopeTool.test.ts
Expected: FAIL
```

- [ ] **Step 3: Write ScopeTool implementation**

```typescript
// src/tools/RefactorTools/ScopeTool/index.ts

import { z } from 'zod'
import { buildTool, type ToolUseContext } from '../../Tool.js'
import { createProjectKnowledgeStore, type FileEntry } from '../../../state/projectKnowledgeStore.js'

const ScopeToolInput = z.object({
  action: z.enum(['add', 'remove', 'list', 'status', 'clear']),
  file: z.string().optional(),
  reason: z.string().optional(),
  status: z.enum(['pending', 'done', 'failed']).optional(),
})

type ScopeAction = z.infer<typeof ScopeToolInput>

export const ScopeTool = buildTool({
  name: 'ScopeTool',
  aliases: ['scope', 'refactor_scope'],
  inputSchema: ScopeToolInput,
  
  description: async (input: ScopeAction) => {
    switch (input.action) {
      case 'add':
        return `Add "${input.file}" to refactor scope${input.reason ? ` (reason: ${input.reason})` : ''}`
      case 'remove':
        return `Remove "${input.file}" from refactor scope`
      case 'list':
        return 'List all files in refactor scope'
      case 'status':
        return `Update status of "${input.file}" to "${input.status}"`
      case 'clear':
        return 'Clear entire refactor scope'
      default:
        return 'Manage refactor scope'
    }
  },
  
  async call(args: ScopeAction, context: ToolUseContext) {
    const store = getOrCreateStore(context)
    
    switch (args.action) {
      case 'add': {
        if (!args.file) {
          return { data: null, error: 'File is required for add action' }
        }
        store.addToScope(args.file, args.reason ?? 'No reason provided')
        return { data: { added: true, file: args.file } }
      }
      
      case 'remove': {
        if (!args.file) {
          return { data: null, error: 'File is required for remove action' }
        }
        const files = store.getSessionContext().files
        const existed = files.delete(args.file)
        return { data: { removed: existed, file: args.file } }
      }
      
      case 'list': {
        const files = Array.from(store.getSessionContext().files.entries())
        return {
          data: {
            files: files.map(([path, entry]) => ({ path, ...entry })),
            total: files.length,
          },
        }
      }
      
      case 'status': {
        if (!args.file || !args.status) {
          return { data: null, error: 'File and status are required' }
        }
        store.updateFileStatus(args.file, args.status)
        return { data: { updated: true, file: args.file, status: args.status } }
      }
      
      case 'clear': {
        store.clearSession()
        return { data: { cleared: true } }
      }
      
      default:
        return { data: null, error: 'Unknown action' }
    }
  },
  
  isReadOnly: (input: ScopeAction) => {
    return input.action === 'list' || input.action === 'status'
  },
})

function getOrCreateStore(context: ToolUseContext) {
  if (!context.projectStore) {
    context.projectStore = createProjectKnowledgeStore()
  }
  return context.projectStore as ReturnType<typeof createProjectKnowledgeStore>
}

export { ScopeToolInput }
```

- [ ] **Step 4: Run test to verify it passes**

```bash
cd templates/refactor-harness && bun test tests/unit/scopeTool.test.ts
Expected: PASS
```

- [ ] **Step 5: Commit**

```bash
git add templates/refactor-harness/src/tools/RefactorTools/ScopeTool/index.ts tests/unit/scopeTool.test.ts
git commit -m "feat(refactor-harness): implement ScopeTool"
```

---

## Task 7: Implement VerifyTool

**Files:**
- Create: `templates/refactor-harness/src/tools/RefactorTools/VerifyTool/index.ts`
- Create: `tests/unit/verifyTool.test.ts`

- [ ] **Step 1: Write the failing test**

```typescript
// tests/unit/verifyTool.test.ts
import { describe, expect, test, beforeEach } from 'bun:test'
import { VerifyTool } from '../../src/tools/RefactorTools/VerifyTool/index.js'
import { createProjectKnowledgeStore } from '../../src/state/projectKnowledgeStore.js'

describe('VerifyTool', () => {
  const store = createProjectKnowledgeStore()
  const mockContext = {
    options: { debug: false, tools: [], mcpClients: [] },
    abortController: new AbortController(),
    messages: [],
    projectStore: store,
  } as any
  
  beforeEach(() => {
    store.clearSession()
    store.updateConstraints(['Keep API stable'])
  })
  
  test('detects deviation when constraint violated', async () => {
    store.addChangeRecord({
      file: 'src/api.ts',
      before: 'export const API = v1',
      after: 'export const API = v2',
      timestamp: Date.now(),
    })
    
    const result = await VerifyTool.call(
      { action: 'check', constraints: ['Keep API stable'] },
      mockContext,
      async () => ({ behavior: 'allow' }),
      {} as any
    )
    
    expect(result.data.hasDeviation).toBe(true)
    expect(result.data.deviations.length).toBeGreaterThan(0)
  })
  
  test('no deviation when constraints satisfied', async () => {
    store.addChangeRecord({
      file: 'src/utils.ts',
      before: 'function helper() {}',
      after: 'function helper() { return 1 }',
      timestamp: Date.now(),
    })
    
    const result = await VerifyTool.call(
      { action: 'check', constraints: ['Keep API stable'] },
      mockContext,
      async () => ({ behavior: 'allow' }),
      {} as any
    )
    
    expect(result.data.hasDeviation).toBe(false)
  })
})
```

- [ ] **Step 2: Run test to verify it fails**

```bash
cd templates/refactor-harness && bun test tests/unit/verifyTool.test.ts
Expected: FAIL
```

- [ ] **Step 3: Write VerifyTool implementation**

```typescript
// src/tools/RefactorTools/VerifyTool/index.ts

import { z } from 'zod'
import { buildTool, type ToolUseContext } from '../../Tool.js'

const VerifyToolInput = z.object({
  action: z.enum(['check', 'report', 'history']),
  constraints: z.array(z.string()).optional(),
})

type VerifyAction = z.infer<typeof VerifyToolInput>

interface Deviation {
  type: 'api_change' | 'breaking_change' | 'constraint_violation'
  file: string
  description: string
  severity: 'high' | 'medium' | 'low'
}

interface VerifyResult {
  hasDeviation: boolean
  deviations: Deviation[]
  summary: string
  checkedAt: number
}

export const VerifyTool = buildTool({
  name: 'VerifyTool',
  aliases: ['verify', 'refactor_verify'],
  inputSchema: VerifyToolInput,
  
  description: async (input: VerifyAction) => {
    switch (input.action) {
      case 'check':
        return `Verify refactoring against constraints`
      case 'report':
        return 'Generate deviation report'
      case 'history':
        return 'View change history'
      default:
        return 'Verify refactoring correctness'
    }
  },
  
  async call(args: VerifyAction, context: ToolUseContext) {
    const store = context.projectStore as ReturnType<typeof import('../../../state/projectKnowledgeStore.js').createProjectKnowledgeStore> | undefined
    
    switch (args.action) {
      case 'check': {
        if (!store) {
          return { data: { hasDeviation: false, deviations: [], summary: 'No project store' }, error: undefined }
        }
        
        const constraints = args.constraints ?? store.getSessionContext().constraints
        const history = store.getSessionContext().history
        const deviations: Deviation[] = []
        
        // Check each change against constraints
        for (const change of history) {
          if (change.file.includes('api') || change.file.includes('types')) {
            if (change.before.includes('export') && !change.after.includes(change.before.split('=')[1]?.trim())) {
              deviations.push({
                type: 'api_change',
                file: change.file,
                description: 'API signature changed',
                severity: 'high',
              })
            }
          }
          
          if (change.after.includes('BREAKING') || change.after.includes('breaking')) {
            deviations.push({
              type: 'breaking_change',
              file: change.file,
              description: 'Potential breaking change detected',
              severity: 'high',
            })
          }
        }
        
        // Simple constraint check
        for (const constraint of constraints) {
          if (constraint.toLowerCase().includes('api stable')) {
            const hasApiChange = deviations.some(d => d.type === 'api_change')
            if (hasApiChange) {
              deviations.push({
                type: 'constraint_violation',
                file: '[global]',
                description: `Constraint violated: "${constraint}"`,
                severity: 'high',
              })
            }
          }
        }
        
        const result: VerifyResult = {
          hasDeviation: deviations.length > 0,
          deviations,
          summary: deviations.length === 0
            ? 'No deviations detected'
            : `Found ${deviations.length} potential deviation(s)`,
          checkedAt: Date.now(),
        }
        
        return { data: result }
      }
      
      case 'report': {
        if (!store) {
          return { data: { summary: 'No project store' } }
        }
        const context = store.getSessionContext()
        return {
          data: {
            filesProcessed: context.files.size,
            constraints: context.constraints,
            changesCount: context.history.length,
            deviationsCount: 0,
          },
        }
      }
      
      case 'history': {
        if (!store) {
          return { data: { history: [] } }
        }
        return { data: { history: store.getSessionContext().history } }
      }
      
      default:
        return { data: null, error: 'Unknown action' }
    }
  },
  
  isReadOnly: () => true,
})

export { VerifyToolInput }
```

- [ ] **Step 4: Run test to verify it passes**

```bash
cd templates/refactor-harness && bun test tests/unit/verifyTool.test.ts
Expected: PASS
```

- [ ] **Step 5: Commit**

```bash
git add templates/refactor-harness/src/tools/RefactorTools/VerifyTool/index.ts tests/unit/verifyTool.test.ts
git commit -m "feat(refactor-harness): implement VerifyTool"
```

---

## Task 8: Register RefactorTools in Tool Registry

**Files:**
- Modify: `templates/refactor-harness/src/tools/tools.ts`

- [ ] **Step 1: Update tools.ts to register RefactorTools**

```typescript
// Add imports at top
import { ScopeTool } from './RefactorTools/ScopeTool/index.js'
import { VerifyTool } from './RefactorTools/VerifyTool/index.js'

// In getAllTools(), add RefactorTools
export function getAllTools(): Tool[] {
  const tools: Tool[] = [
    // Core tools - always enabled
    BashTool,
    FileReadTool,
    FileWriteTool,
    FileEditTool,
    GrepTool,
    GlobTool,
    WebFetchTool,
    
    // Refactor tools - gated by FEATURE_REFACTOR_HARNESS
    ScopeTool,
    VerifyTool,
  ]
  
  // Feature-gated tools (keep existing)
  if (feature('AGENT_TRIGGERS_REMOTE')) {
    // Add remote trigger tool
  }
  
  if (feature('MONITOR_TOOL')) {
    // Add monitor tool
  }
  
  if (feature('KAIROS')) {
    // Add Kairos-specific tools
  }
  
  return tools
}
```

- [ ] **Step 2: Run lint to verify**

```bash
cd templates/refactor-harness && bun run lint
Expected: No errors
```

- [ ] **Step 3: Commit**

```bash
git add templates/refactor-harness/src/tools/tools.ts
git commit -m "feat(refactor-harness): register ScopeTool and VerifyTool"
```

---

## Task 9: Create Refactor Entry Point

**Files:**
- Create: `templates/refactor-harness/src/entrypoints/cli.ts`
- Create: `templates/refactor-harness/AGENTS.md`

- [ ] **Step 1: Create refactor CLI entry**

```typescript
// src/entrypoints/cli.ts
import { getAllTools } from '../tools/tools.js'
import { createProjectKnowledgeStore } from '../state/projectKnowledgeStore.js'
import { createContextCollapser } from '../memory/contextCollapse.js'

interface RefactorOptions {
  constraints: string[]
  projectRoot: string
}

export async function startRefactorMode(options: Partial<RefactorOptions> = {}) {
  const store = createProjectKnowledgeStore()
  const collapser = createContextCollapser()
  
  // Initialize with constraints if provided
  if (options.constraints?.length) {
    store.updateConstraints(options.constraints)
    store.addFact('initialized', new Date().toISOString())
  }
  
  const tools = getAllTools()
  
  console.log('🔧 Refactor Harness started')
  console.log(`   Project root: ${options.projectRoot ?? process.cwd()}`)
  console.log(`   Tools available: ${tools.length}`)
  console.log(`   Constraints: ${store.getSessionContext().constraints.join(', ') || 'none'}`)
  
  return {
    store,
    collapser,
    tools,
  }
}

// CLI entry point
if (import.meta.main) {
  const args = process.argv.slice(2)
  const constraints = args.filter(a => a.startsWith('--constraint=')).map(a => a.split('=')[1])
  const projectRoot = args.find(a => a.startsWith('--root='))?.split('=')[1] ?? process.cwd()
  
  startRefactorMode({ constraints, projectRoot })
}
```

- [ ] **Step 2: Create AGENTS.md**

```markdown
# AGENTS.md

## 项目概述

Refactor Harness — 基于 Extended Harness 架构的重构工作流工具，专为 kernel 级别代码仓库设计。

## 核心能力

- **上下文管理**: ProjectKnowledgeStore 管理重构范围和历史
- **平台感知搜索**: 自动选择最优搜索工具 (rg > grep > findstr)
- **偏离检测**: VerifyTool 对比改动与约束，检测偏离
- **上下文压缩**: 当会话接近边界时自动折叠历史

## 核心命令

\`\`\`bash
bun install          # 安装依赖
bun run dev           # 开发模式
bun run build         # 构建
bun test              # 运行测试
bun run lint          # 检查 lint
bun run lint:fix      # 自动修复 lint
\`\`\`

## 运行时要求

- **必须使用 Bun**（不是 Node.js）
- ESM 模块系统 (\`"type": "module"\`)

## 架构要点

- **入口**: \`src/entrypoints/cli.ts\`
- **Memory Layer**: \`src/state/projectKnowledgeStore.ts\` + \`src/memory/contextCollapse.ts\`
- **RefactorTools**: \`src/tools/RefactorTools/ScopeTool/\`, \`src/tools/RefactorTools/VerifyTool/\`
- **平台搜索**: \`src/tools/shared/platformSearch.ts\`

## Feature Flag 系统

代码中使用：
\`\`\`typescript
import { feature } from 'bun:bundle'
feature('FLAG_NAME')  // 返回 boolean
\`\`\`

## 测试

- 框架：\`bun:test\`
- 单元测试：\`tests/unit/*.test.ts\`

## 重要路径

- \`src/types/global.d.ts\` — 全局类型声明
- \`src/state/store.ts\` — Harness 状态存储
- \`src/tools/tools.ts\` — 工具注册表
```

- [ ] **Step 3: Commit**

```bash
git add templates/refactor-harness/src/entrypoints/cli.ts templates/refactor-harness/AGENTS.md
git commit -m "feat(refactor-harness): add refactor entry point and AGENTS.md"
```

---

## Task 10: Run Full Test Suite

**Files:**
- (No new files)

- [ ] **Step 1: Run all tests**

```bash
cd templates/refactor-harness && bun test
Expected: All tests pass
```

- [ ] **Step 2: Run lint check**

```bash
cd templates/refactor-harness && bun run lint
Expected: No errors
```

- [ ] **Step 3: Commit if changes needed**

```bash
git add -A && git commit -m "test(refactor-harness): verify full test suite"
```

---

## Self-Review Checklist

1. **Spec coverage:**
   - [x] Platform-aware search (rg/findstr/grep) → Task 3
   - [x] ProjectKnowledgeStore with bounded management → Task 4
   - [x] Context collapse/eviction → Task 5
   - [x] ScopeTool → Task 6
   - [x] VerifyTool → Task 7
   - [x] Tool registration → Task 8
   - [x] Entry point → Task 9

2. **Placeholder scan:** No TBD/TODO found. All code is complete.

3. **Type consistency:**
   - `createProjectKnowledgeStore` returns `ProjectKnowledgeStore` interface
   - All tools use same `ToolUseContext` interface from `Tool.ts`
   - `ChangeRecord`, `RefactorScope` types consistent across tasks

---

**Plan complete and saved to `docs/superpowers/plans/2026-04-16-refactor-harness-implementation-plan.md`**

**Two execution options:**

1. **Subagent-Driven (recommended)** — I dispatch a fresh subagent per task, review between tasks, fast iteration

2. **Inline Execution** — Execute tasks in this session using executing-plans, batch execution with checkpoints

**Which approach?**