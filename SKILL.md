---
name: harness-init
description: "Design and generate a complete Harness architecture project for any software system. Use when building AI coding harnesses, CLI control layers, or agent frameworks. Triggers on: build a harness, create harness for project, initialize harness architecture, set up agent framework, design CLI control layer, /HARNESS command. Works after brainstorming — uses approved design to generate the full project."
---

# Harness Init

Design and generate a complete Harness architecture project for any software system.

## When to Use This Skill

**You MUST use this skill when:**
- User says "build a harness", "create harness", "initialize harness"
- User invokes `/HARNESS` command
- User wants to create an AI coding harness for a GUI app or CLI tool
- User wants to set up an agent framework with proper architecture
- User approved a harness design from brainstorming and needs to generate the project

**Prerequisite:** This skill works AFTER a design is approved through the brainstorming skill. If no design exists, invoke the brainstorming skill first.

## Quick Start

### OpenCode Installation

```bash
# Install the harness-init skill
opencode --install-skill https://github.com/your-username/harness-init

# Or from local path
opencode --install-skill /path/to/harness-init

# Use the /HARNESS shortcut
/HARNESS
```

### Direct Invocation

```
Skill: harness-init
```

---

## The Process

### Step 1: Understand the Approved Design

Read the approved design document (from brainstorming). Extract:

1. **Project name** and purpose
2. **Target software** to harness (or generic harness if no specific target)
3. **Interaction model** (REPL, subcommand CLI, or both)
4. **Required tools** (Bash, FileEdit, Grep, custom tools)
5. **State management** approach
6. **Provider integration** (Anthropic, OpenAI, Gemini, or multi-provider)
7. **Feature flags** needed
8. **Monorepo structure** (yes/no, workspace packages)

### Step 2: Generate Project Structure

Use the bundled `scripts/init-harness.ts` script to scaffold the project:

```bash
bun scripts/init-harness.ts <project-name> --template basic
```

Or invoke the script directly:

```typescript
import { initHarness } from './scripts/init-harness'

await initHarness({
  name: 'my-harness',
  template: 'basic',
  options: {
    withREPL: true,
    withDaemon: false,
    withBridge: false,
    providers: ['anthropic', 'openai'],
    tools: ['bash', 'file', 'grep', 'glob'],
    features: ['BUDDY', 'BRIDGE_MODE'],
  }
})
```

### Step 3: Customize for Target Software

If harnessing a specific application (e.g., GIMP, Blender, LibreOffice):

1. **Backend integration** (`src/utils/<软件>_backend.ts`)
   - Find the software's CLI interface
   - Wrap subprocess calls
   - Handle error cases with clear messages

2. **Native format handling** (`src/core/`)
   - Parse/modify native project files (XML, JSON, binary)
   - Generate valid intermediate files

3. **Tool mapping** (`src/tools/`)
   - Map GUI actions to tool calls
   - Implement permission system

### Step 4: Generate AGENTS.md

Create the `AGENTS.md` file with:

- Project overview (1-3 sentences)
- Exact commands: `bun install`, `bun run dev`, `bun run build`, `bun test`
- Runtime requirements (Bun, ESM)
- Architecture overview (entry, core, tools, state, providers)
- Feature flag usage
- Testing approach
- Important paths

### Step 5: Initialize Git Repository

```bash
cd <project-name>
git init
git add .
git commit -m "Initial harness project structure"
```

---

## Project Templates

### Basic Template

Standard harness with:
- CLI entry point (`src/entrypoints/cli.tsx`)
- Core query loop (`src/core/query.ts`)
- Zustand-style store (`src/state/store.ts`)
- Tool registry (`src/tools/tools.ts`)
- Bun build configuration (`build.ts`)
- Biome lint/format config

### OpenCode Template (basic +)

Basic template plus:
- `AGENTS.md` (pre-generated)
- `opencode.json` (OpenCode config)
- Superpowers integration
- `/HARNESS` shortcut setup

### Superpowers Template (opencode +)

OpenCode template plus:
- Design document generation
- Implementation plan templates
- Verification checkpoints
- Git worktree integration

---

## Architecture Patterns

### Layered Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                      Entry Layer                             │
│  cli.tsx ──→ main.tsx (Commander.js)                       │
│  ├─ --version / -v      (zero-module fast path)             │
│  ├─ REPL mode           (interactive)                        │
│  ├─ Headless mode      (programmatic)                       │
│  ├─ Daemon mode        (long-running service)               │
│  └─ Bridge mode        (remote control)                     │
├─────────────────────────────────────────────────────────────┤
│                      Core Engine                             │
│  query.ts ──→ QueryEngine.ts                                │
│  ├─ Message handling & streaming                            │
│  ├─ Tool execution                                          │
│  ├─ Session management                                      │
│  └─ Context building                                        │
├─────────────────────────────────────────────────────────────┤
│                      Tool System                             │
│  Tool.ts ──→ tools.ts ──→ tools/<ToolName>/                 │
│  ├─ Tool interface (buildTool factory)                      │
│  ├─ Tool registry (conditional loading)                    │
│  ├─ Built-in tools (Bash, File, Grep, Glob)                │
│  └─ MCP dynamic tools                                       │
├─────────────────────────────────────────────────────────────┤
│                    State Management                          │
│  store.ts (Zustand-style createStore)                       │
│  ├─ AppState: messages, tools, permissions, connections     │
│  └─ Selectors & bootstrap state                             │
├─────────────────────────────────────────────────────────────┤
│                    Provider Layer                            │
│  services/api/ ──→ providers/                               │
│  ├─ Anthropic (direct)                                      │
│  ├─ AWS Bedrock                                             │
│  ├─ Google Vertex                                           │
│  ├─ OpenAI compatibility (Ollama, DeepSeek, vLLM)            │
│  └─ Gemini compatibility                                    │
└─────────────────────────────────────────────────────────────┘
```

### Entry Point Pattern

```typescript
// src/entrypoints/cli.tsx
export async function main() {
  // Fast paths (zero module loading)
  if (argv.version) return printVersion()
  if (argv.dumpPrompt) return dumpSystemPrompt()

  // Feature-gated fast paths
  if (argv.daemonWorker) return startDaemonWorker(argv)
  if (argv.remoteControl) return startBridgeMode()

  // Mode dispatch
  if (argv.daemon) return startDaemonMode()
  if (argv.background) return startBgSessionMode()

  // Default: full CLI
  return startREPLMode()
}
```

### Tool Interface Pattern

```typescript
// src/tools/Tool.ts
export type Tool<
  Input extends AnyObject = AnyObject,
  Output = unknown,
> = {
  name: string
  inputSchema: z.ZodType
  description(input: z.infer<Input>): Promise<string>
  call(args: z.infer<Input>, context: ToolUseContext): Promise<ToolResult<Output>>
  isEnabled(): boolean
  isConcurrencySafe(input: z.infer<Input>): boolean
  isReadOnly(input: z.infer<Input>): boolean
}

export function buildTool<D extends ToolDef>(def: D): BuiltTool<D> {
  return { ...TOOL_DEFAULTS, userFacingName: () => def.name, ...def } as BuiltTool<D>
}
```

### Feature Flag Pattern

```typescript
// Use bun:bundle for all feature flags
import { feature } from 'bun:bundle'

// Code pattern
if (feature('BUDDY')) {
  // Enable buddy feature
}

// Enable via environment
// FEATURE_BUDDY=1 bun run dev
```

### State Store Pattern

```typescript
// src/state/store.ts
export function createStore<T>(
  initialState: T,
  onChange?: (args: { newState: T; oldState: T }) => void,
): Store<T> {
  let state = initialState
  const listeners = new Set<Listener>()

  return {
    getState: () => state,
    setState: (updater) => {
      const prev = state
      const next = updater(prev)
      if (Object.is(next, prev)) return
      state = next
      onChange?.({ newState: next, oldState: prev })
      for (const listener of listeners) listener()
    },
    subscribe: (listener) => {
      listeners.add(listener)
      return () => listeners.delete(listener)
    },
  }
}
```

---

## Feature Flag Reference

| Flag | Purpose | Dev Default | Build Default |
|------|---------|-------------|---------------|
| `BUDDY` | Companion agent | On | Off |
| `DAEMON` | Long-running daemon | Off | Off |
| `BRIDGE_MODE` | Remote control | On | Off |
| `BG_SESSIONS` | Background sessions | Off | Off |
| `CHICAGO_MCP` | Computer use | On | On |
| `VOICE_MODE` | Voice input | On | On |
| `AGENT_TRIGGERS_REMOTE` | Remote agent triggers | On | On |
| `AGENT_TRIGGERS` | Local agent triggers | On | On |
| `ULTRATHINK` | Extended thinking | On | On |
| `LODESTONE` | Lodestone integration | On | On |
| `EXTRACT_MEMORIES` | Memory extraction | On | On |
| `VERIFICATION_AGENT` | Verification | On | On |

---

## Implementation Checklist

### Phase 1: Core Structure
- [ ] Initialize project with `bun init`
- [ ] Configure `package.json` (type: module, engines: bun, workspaces)
- [ ] Set up `tsconfig.json` (bundler moduleResolution, bun types)
- [ ] Configure Biome (`biome.json`)
- [ ] Create directory structure
- [ ] Implement CLI entry with fast paths

### Phase 2: Core Engine
- [ ] Implement `query.ts` core loop
- [ ] Create `QueryEngine.ts` orchestrator
- [ ] Add session management
- [ ] Set up context building

### Phase 3: Tool System
- [ ] Define Tool interface (`Tool.ts`)
- [ ] Create `buildTool` factory
- [ ] Implement tool registry (`tools.ts`)
- [ ] Add 3-5 core tools (Bash, FileEdit, Grep)
- [ ] Implement permission system

### Phase 4: State Management
- [ ] Create Zustand-style store
- [ ] Define AppState types
- [ ] Add selectors
- [ ] Implement persistence (optional)

### Phase 5: Provider Integration
- [ ] Set up Anthropic provider
- [ ] Add OpenAI compatibility layer
- [ ] Implement stream adapters
- [ ] Add model selection

### Phase 6: OpenCode Integration
- [ ] Generate `AGENTS.md`
- [ ] Configure `opencode.json`
- [ ] Set up `/HARNESS` shortcut
- [ ] Add Superpowers integration

### Phase 7: Documentation & Testing
- [ ] Write unit tests (`bun test`)
- [ ] Add integration tests
- [ ] Create `README.md`
- [ ] Initialize git repository

---

## Superpowers Integration

This skill is designed to work within the Superpowers workflow:

```
┌─────────────────┐
│  brainstorming  │ ←── First: design the harness
└────────┬────────┘
         │ (design approved)
         ▼
┌─────────────────┐
│  harness-init   │ ←── This skill: generate project
└────────┬────────┘
         │ (project generated)
         ▼
┌─────────────────┐
│  writing-plans   │ ←── Next: create implementation plan
└────────┬────────┘
         │ (plan approved)
         ▼
┌─────────────────┐
│ executing-plans │ ←── Execute the plan
└────────┬────────┘
         │ (all tasks complete)
         ▼
┌─────────────────────────┐
│ finishing-a-development- │
│ branch                   │
└─────────────────────────┘
```

---

## Bundled Resources

### Scripts

- `scripts/init-harness.ts` — Scaffold new harness project
- `scripts/add-tool.ts` — Add new tool to registry
- `scripts/dev.ts` — Development mode launcher

### Templates

- `templates/basic/` — Basic harness template
- `templates/opencode/` — OpenCode-integrated template
- `templates/superpowers/` — Superpowers workflow template

### References

- `references/architecture-guide.md` — Detailed architecture patterns
- `references/tool-implementation.md` — Tool creation patterns
- `references/provider-integration.md` — Provider adapter patterns
- `references/opencode-setup.md` — OpenCode integration guide

---

## Example: Harness for GIMP

### Approved Design Summary
- **Target:** GIMP (GNU Image Manipulation Program)
- **Backend:** `gimp -i -b '(script-fu-...)'`
- **Native format:** XCF (XML-based)
- **Interaction:** REPL + subcommand CLI
- **Tools:** Bash, FileRead, FileWrite, Grep, custom GIMP tools

### Generated Structure

```
gimp-harness/
├── src/
│   ├── entrypoints/
│   │   ├── cli.tsx
│   │   └── main.tsx
│   ├── core/
│   │   ├── query.ts
│   │   └── context.ts
│   ├── tools/
│   │   ├── Tool.ts
│   │   ├── tools.ts
│   │   ├── BashTool/
│   │   ├── GimpTool/          # Custom
│   │   │   ├── index.ts
│   │   │   ├── inputSchema.ts
│   │   │   └── call.ts
│   │   └── ...
│   ├── state/
│   │   └── store.ts
│   ├── utils/
│   │   └── gimp_backend.ts    # Backend wrapper
│   └── types/
│       └── global.d.ts
├── scripts/
│   ├── dev.ts
│   └── defines.ts
├── tests/
│   ├── unit/
│   └── integration/
├── package.json
├── tsconfig.json
├── biome.json
├── build.ts
├── AGENTS.md
├── opencode.json
└── README.md
```

---

## AGENTS.md Template

```markdown
# AGENTS.md

## 项目概述

[项目名称] — [简短描述用途]

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
- ESM 模块系统 (`"type": "module"`)

## 架构要点

- **入口**：`src/entrypoints/cli.tsx`
- **核心循环**：`src/core/query.ts`
- **Tool 注册**：`src/tools/tools.ts`
- **状态管理**：`src/state/store.ts`

## Feature Flag 系统

\`\`\`typescript
import { feature } from 'bun:bundle'
feature('FLAG_NAME')  // 返回 boolean
\`\`\`

启用方式：`FEATURE_<FLAG_NAME>=1` 环境变量

## 测试

- 框架：`bun:test`
- 单元测试：`src/**/__tests__/*.test.ts`
- Mock：`mock.module()` 必须内联在测试文件中

## 重要路径

- `src/types/global.d.ts` — 全局类型
- `scripts/dev.ts` — Dev 模式入口
- `build.ts` — 构建配置
```
