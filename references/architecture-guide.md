# Architecture Guide

## Layered Architecture

The harness follows a layered architecture with clear separation of concerns:

```
┌─────────────────────────────────────────────────────────────────┐
│                        Entry Layer                               │
│  cli.ts ──→ main.ts (Commander.js)                              │
│  ├─ Fast paths (--version, --help)                              │
│  ├─ REPL mode (interactive)                                     │
│  ├─ Headless mode (programmatic)                                │
│  ├─ Daemon mode (long-running)                                  │
│  └─ Bridge mode (remote control)                                │
├─────────────────────────────────────────────────────────────────┤
│                      Core Engine                                 │
│  query.ts ──→ QueryEngine.ts                                    │
│  ├─ Message handling & streaming                                 │
│  ├─ Tool execution                                              │
│  ├─ Session management                                          │
│  └─ Context building                                            │
├─────────────────────────────────────────────────────────────────┤
│                       Tool System                                │
│  Tool.ts ──→ tools.ts ──→ tools/<ToolName>/                     │
│  ├─ Tool interface (buildTool factory)                         │
│  ├─ Tool registry (conditional loading)                         │
│  ├─ Built-in tools (Bash, File, Grep, Glob)                    │
│  └─ MCP dynamic tools                                          │
├─────────────────────────────────────────────────────────────────┤
│                    State Management                              │
│  store.ts (Zustand-style createStore)                          │
│  ├─ AppState: messages, tools, permissions                      │
│  └─ Selectors & bootstrap state                                │
├─────────────────────────────────────────────────────────────────┤
│                    Provider Layer                               │
│  services/api/ ──→ providers/                                  │
│  ├─ Anthropic (direct)                                         │
│  ├─ AWS Bedrock                                               │
│  ├─ Google Vertex                                              │
│  ├─ OpenAI compatibility (Ollama, DeepSeek, vLLM)              │
│  └─ Gemini compatibility                                       │
└─────────────────────────────────────────────────────────────────┘
```

## Entry Point Design

The CLI entry point (`src/entrypoints/cli.ts`) implements fast paths:

```typescript
// Fast path: version (zero module loading)
if (argv.version) {
  console.log('version')
  return // No other modules loaded
}

// Fast path: help
if (argv.help) {
  printHelp()
  return
}

// Mode dispatch (lazy load full CLI)
if (argv.daemon) {
  await import('./daemon/main.js')
  return
}

if (argv.bridge) {
  await import('./bridge/bridgeMain.js')
  return
}

// Default: REPL
await startREPLMode()
```

**Key principle**: The heavier the operation, the deeper in the import chain it should be.

## Core Query Loop

The query loop (`src/core/query.ts`) is a generator function:

```typescript
export async function* query(
  messages: Message[],
  tools: Tool[],
  options: QueryOptions = {}
): AsyncGenerator<StreamEvent> {
  const provider = getProvider()
  const stream = await provider.query(messages, tools, options)
  
  for await (const event of stream) {
    yield event
  }
}
```

This pattern allows:
- Streaming responses
- Incremental tool execution
- Cancellable operations

## State Management

The Zustand-style store provides reactive state:

```typescript
export function createStore<T>(
  initialState: T,
  onChange?: (args: { newState: T; oldState: T }) => void
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

## Feature Flag System

Feature flags use `bun:bundle`:

```typescript
import { feature } from 'bun:bundle'

// Code
if (feature('BUDDY')) {
  // Enable buddy
}

// Enable at runtime
// FEATURE_BUDDY=1 bun run dev
```

## Monorepo Structure

For larger projects, use Bun workspaces:

```json
{
  "workspaces": ["packages/*"],
  "dependencies": {
    "@harness/core": "workspace:*",
    "@harness/tools": "workspace:*"
  }
}
```
