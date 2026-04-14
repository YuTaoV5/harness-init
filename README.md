# Harness Init

<div align="center">

**Build production-grade AI coding harnesses for any software system.**

A skill for OpenCode that designs and generates complete Harness architecture projects — CLI control layers, agent frameworks, and tool systems.

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](LICENSE)
[![Bun](https://img.shields.io/badge/Bun-≥1.2.0-red.svg)](https://bun.sh)
[![OpenCode](https://img.shields.io/badge/OpenCode-Skill-blueviolet)](https://opencode.ai)

</div>

---

## What is a Harness?

A **Harness** is a control layer framework that enables AI coding agents to operate software designed for humans — without needing a display or mouse.

```
┌─────────────────────────────────────────────────────────────┐
│                    AI Coding Agent                           │
│         (OpenCode, Claude Code, Codex, etc.)                │
└──────────────────────┬────────────────────────────────────┘
                       │ Tools (Bash, File, Grep...)
                       ▼
┌─────────────────────────────────────────────────────────────┐
│                   Harness Framework                          │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐     │
│  │   CLI Entry  │  │  Tool System │  │    State    │     │
│  │   Point      │  │  (60+ tools) │  │   Store     │     │
│  └──────────────┘  └──────────────┘  └──────────────┘     │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐     │
│  │  Query Loop  │  │  Providers   │  │ Feature Flags│     │
│  │              │  │  (Multi-LLM) │  │              │     │
│  └──────────────┘  └──────────────┘  └──────────────┘     │
└──────────────────────┬────────────────────────────────────────┘
                       │ Structured Commands
                       ▼
┌─────────────────────────────────────────────────────────────┐
│              Target Software (Any GUI/CLI)                   │
│     GIMP, Blender, LibreOffice, FFmpeg, Custom Apps...       │
└─────────────────────────────────────────────────────────────┘
```

**Examples of what you can harness:**

| Software | Backend CLI | Native Format |
|----------|-------------|---------------|
| GIMP | `gimp -i -b '(script-fu-...)'` | XCF |
| Blender | `blender --background --python script.py` | .blend |
| LibreOffice | `libreoffice --headless --convert-to` | ODF |
| FFmpeg | `ffmpeg [args]` | Muxed media |
| Shotcut | `melt project.mlt` | MLT XML |
| Any CLI tool | `subprocess` calls | — |

---

## Features

### Architecture Patterns

- **Layered Architecture** — Entry → Core Engine → Tool System → State → Provider
- **Fast Path Design** — Zero-module loading for `--version`, `--help`
- **Multi-Mode CLI** — REPL, daemon, bridge, headless modes
- **Feature Flag System** — `import { feature } from 'bun:bundle'`

### Tool System

- **60+ Built-in Tools** — Bash, FileRead, FileWrite, FileEdit, Grep, Glob, WebFetch...
- **buildTool Factory** — Standardized tool interface with Zod schemas
- **Conditional Loading** — Feature-gated tools via `feature('FLAG')`
- **Permission System** — Per-tool permission checks

### State Management

- **Zustand-style Store** — Minimal, TypeScript-native implementation
- **Selector Pattern** — Composable state selectors
- **Module-level Singleton** — Bootstrap state (sessionId, cwd, projectRoot)

### Provider Integration

- **Anthropic** — Direct API with streaming
- **AWS Bedrock** — Claude via AWS
- **Google Vertex** — Claude via GCP
- **OpenAI Compatible** — Ollama, DeepSeek, vLLM
- **Gemini Compatible** — Google AI

### Dev Experience

- **Bun Runtime** — Fast startup, native TypeScript
- **Biome** — Lint + format in one tool
- **bun:test** — Built-in test framework
- **MACRO Defines** — Compile-time constants via `scripts/defines.ts`

---

## Installation

### OpenCode

```bash
opencode --install-skill /path/to/harness-init
```

Or use the `/HARNESS` shortcut after installation.

### Manual

Copy the `harness-init` folder to your skills directory:

| Location | Path |
|----------|------|
| Global | `~/.opencode/skills/` |
| Workspace | `<project>/skills/` |

---

## Quick Start

### 1. Generate a New Harness

```bash
# Basic harness
bun scripts/init-harness.ts my-harness --template basic

# With OpenCode integration
bun scripts/init-harness.ts my-harness --template opencode

# With Superpowers workflow
bun scripts/init-harness.ts my-harness --template superpowers
```

### 2. Navigate to Project

```bash
cd my-harness
bun install
```

### 3. Run Dev Mode

```bash
bun run dev
```

### 4. Build for Production

```bash
bun run build
```

---

## Project Structure

```
my-harness/
├── src/
│   ├── entrypoints/
│   │   └── cli.ts              # CLI entry with fast paths
│   ├── core/
│   │   └── query.ts           # Core query loop
│   ├── tools/
│   │   ├── Tool.ts            # Tool interface + buildTool
│   │   ├── tools.ts           # Tool registry
│   │   └── BashTool/          # Individual tools
│   ├── providers/             # LLM providers
│   ├── state/
│   │   └── store.ts           # Zustand-style store
│   └── types/
│       └── global.d.ts        # Global types + MACRO defines
├── scripts/
│   ├── dev.ts                 # Dev mode launcher
│   └── defines.ts             # MACRO definitions
├── tests/
│   └── *.test.ts              # Unit + integration tests
├── package.json
├── tsconfig.json
├── biome.json                 # Lint + format config
├── build.ts                   # Production build
├── AGENTS.md                  # Agent instructions ←
└── opencode.json              # OpenCode config (optional)
```

---

## Core Commands

```bash
bun install              # Install dependencies
bun run dev             # Development mode
bun run dev:inspect     # Debug mode (BUN_INSPECT=9229)
bun run build           # Production build
bun test                # Run tests
bun run lint            # Check lint
bun run lint:fix        # Auto-fix lint
bun run format          # Format code
```

---

## Architecture Deep Dive

### Entry Point Pattern

```typescript
// src/entrypoints/cli.ts
export async function main() {
  // Fast path: zero module loading
  if (argv.version) {
    printVersion()
    return
  }

  // Feature-gated fast paths
  if (argv.daemonWorker) return startDaemonWorker(argv)

  // Mode dispatch
  if (argv.daemon) return startDaemonMode()
  if (argv.bridge) return startBridgeMode()

  // Default: full CLI
  return startREPLMode()
}
```

### Tool Interface

```typescript
// src/tools/Tool.ts
export type Tool<Input = AnyObject, Output = unknown> = {
  name: string
  inputSchema: z.ZodType
  description(input: z.infer<Input>): Promise<string>
  call(
    args: z.infer<Input>,
    context: ToolUseContext,
    canUseTool: CanUseToolFn,
    parentMessage: AssistantMessage,
  ): Promise<ToolResult<Output>>
  isEnabled?(): boolean
  isReadOnly?(input: z.infer<Input>): boolean
}

export function buildTool<D extends ToolDef>(def: D): Tool {
  return { ...TOOL_DEFAULTS, ...def }
}
```

### Feature Flags

```typescript
// Enable: FEATURE_BUDDY=1 bun run dev
import { feature } from 'bun:bundle'

if (feature('BUDDY')) {
  // Enable buddy companion
}
```

### State Store

```typescript
// src/state/store.ts
export function createStore<T>(
  initialState: T,
  onChange?: (args: { newState: T; oldState: T }) => void
): Store<T> {
  let state = initialState
  const listeners = new Set<Listener>()

  return {
    getState: () => state,
    setState: (updater) => {
      const next = updater(state)
      if (Object.is(next, state)) return
      state = next
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

## Templates

### Basic

Standard harness with CLI entry, query loop, Zustand store, tool registry, and Bun build config.

### OpenCode (basic +)

Basic template plus:
- Pre-generated `AGENTS.md`
- `opencode.json` configuration
- `/HARNESS` command setup

### Superpowers (opencode +)

OpenCode template plus:
- Design document generation workflow
- Implementation plan templates
- Git worktree integration
- Verification checkpoints

---

## Superpowers Workflow

This skill integrates with the **Superpowers** workflow for structured AI-assisted development:

```
┌─────────────┐
│ brainstorming │ ←── Design the harness
└──────┬──────┘
       │ (design approved)
       ▼
┌─────────────┐
│ harness-init │ ←── Generate project (this skill)
└──────┬──────┘
       │ (project generated)
       ▼
┌─────────────┐
│ writing-plans │ ←── Create implementation plan
└──────┬──────┘
       │ (plan approved)
       ▼
┌─────────────┐
│ executing-plans │ ←── Execute plan tasks
└──────┬──────┘
       │ (all tasks complete)
       ▼
┌─────────────────────────┐
│ finishing-a-development- │
│ branch                  │
└─────────────────────────┘
```

---

## Templates

### Basic Template

Standard harness with:
- CLI entry point (`src/entrypoints/cli.ts`)
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

## Example: Harness for GIMP

### Generated Structure

```
gimp-harness/
├── src/
│   ├── entrypoints/
│   │   └── cli.tsx
│   ├── core/
│   │   └── query.ts
│   ├── tools/
│   │   ├── BashTool/
│   │   ├── GimpTool/          # Custom GIMP tools
│   │   └── ...
│   ├── state/
│   │   └── store.ts
│   └── utils/
│       └── gimp_backend.ts    # Backend wrapper
├── scripts/
│   ├── dev.ts
│   └── defines.ts
├── package.json
├── tsconfig.json
├── biome.json
├── build.ts
├── AGENTS.md
└── README.md
```

### Usage

```bash
# Start harness
gimp-harness --daemon

# In REPL mode
> open image.xcf
> apply-filter resize 1920 1080
> export output.png
```

---

## References

Detailed documentation for specific topics:

| Document | Description |
|----------|-------------|
| [references/architecture-guide.md](references/architecture-guide.md) | Layered architecture patterns |
| [references/tool-implementation.md](references/tool-implementation.md) | Creating custom tools |
| [references/provider-integration.md](references/provider-integration.md) | LLM provider adapters |
| [references/opencode-setup.md](references/opencode-setup.md) | OpenCode integration guide |

---

## Related Projects

- **[nuwa-skill](https://github.com/alchaincyf/nuwa-skill)** — Distill any person's thinking style into an AI skill
- **[awesome-openclaw-skills](https://github.com/VoltAgent/awesome-openclaw-skills)** — 5200+ community-built skills for AI coding agents
- **[cli-anything](https://github.com/anomalyco/cli-anything)** — CLI wrapper methodology for GUI applications
- **[claude-code](https://github.com/anthropics/claude-code)** — Anthropic's official AI coding agent

---

## License

MIT — Use freely, modify endlessly.

---

<div align="center">

**Build harnesses. Control any software. Ship faster.**

</div>
