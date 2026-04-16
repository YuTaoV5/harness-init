---
name: harness-init
description: "Build a Refactor Harness for large codebase refactoring. Use when: user wants to refactor a large codebase, mentions /HARNESS command, needs scope tracking and deviation detection for cross-file refactors, or needs bounded context management for long-running refactors. Creates a runnable harness with Context Collapse, ScopeTool, VerifyTool, and PlatformSearch."
---

# Refactor Harness

A bounded-context memory management system for large-scale code repository refactoring. Ships as a runnable skill with Context Collapse, ScopeTool, VerifyTool, and PlatformSearch.

## Installation

```bash
# Copy to OpenCode skills directory
cp -r harness-init ~/.opencode/skills/

# Or link for development
cd ~/.opencode/skills && ln -s /path/to/harness-init harness-init
```

## Usage

```
/HARNESS                      # Start Refactor Harness session
```

## Core Capabilities

| Capability | Purpose |
|------------|---------|
| **Context Management** | Track refactoring scope, history, and constraints in bounded memory |
| **Context Collapse** | Evict old records when approaching context limits (LRU strategy) |
| **Platform Search** | Auto-select optimal search tool (rg > grep > findstr) |
| **Scope Tracking** | Manage files in refactoring scope with status (pending/in-progress/done) |
| **Deviation Detection** | Detect API changes and constraint violations during refactor |

## Architecture

Refactor Harness is built on these core capabilities:

| Capability | Implementation | Purpose |
|------------|----------------|---------|
| **Context Management** | `ProjectKnowledgeStore` | Track refactoring scope, history, and constraints |
| **Context Collapse** | `ContextCollapse` | Evict old records when approaching context limits |
| **Platform Search** | `PlatformSearch` | Auto-select optimal search tool (rg > grep > findstr) |
| **Scope Tracking** | `ScopeTool` | Manage files in refactoring scope with status |
| **Deviation Detection** | `VerifyTool` | Detect API changes and constraint violations |

## When to Use This Skill

**You MUST use this skill when:**
- User says "build a harness", "create harness", "initialize harness"
- User invokes `/HARNESS` command
- User wants to create an AI coding harness for a GUI app or CLI tool
- User wants to set up an agent framework with proper architecture
- User has a large codebase that needs structured refactoring

## Core Concepts

### Bounded Resource Management

Memory layer uses bounded resource management (inspired by cache eviction):

```
Bounded Resource (context limit) + Eviction Strategy = Working Set Management
```

### Platform-Aware Search

Automatically selects the best search tool for the platform:

| Platform | Tool Priority |
|----------|--------------|
| Windows | `rg` > `findstr` > `dir` |
| macOS | `rg` > `grep` > `find` |
| Linux | `rg` > `grep` > `find` |

## Quick Start

### Analyze a Project

```bash
bun run src/entrypoints/cli.ts --mode=analyze --root=/path/to/project --constraint="Keep API stable"
```

### Start Refactor Mode

```bash
bun run src/entrypoints/cli.ts --mode=refactor --root=/path/to/project --constraint="No breaking changes"
```

## Tool Reference

### ScopeTool

Manage refactoring scope:

```typescript
{ action: 'add', file: 'src/kernel/foo.ts', reason: 'Core module' }
{ action: 'list' }
{ action: 'status', file: 'src/foo.ts', status: 'done' }
{ action: 'remove', file: 'src/foo.ts' }
{ action: 'clear' }
```

### VerifyTool

Detect refactoring deviations:

```typescript
{ action: 'check', constraints: ['Keep API stable'] }
{ action: 'report' }
{ action: 'history' }
```

## Project Structure

```
harness-init/
├── src/
│   ├── entrypoints/cli.ts       # CLI entry point
│   ├── state/
│   │   ├── store.ts            # Harness state store
│   │   └── projectKnowledgeStore.ts  # Memory layer
│   ├── memory/
│   │   └── contextCollapse.ts  # Context eviction
│   ├── tools/
│   │   ├── Tool.ts            # Tool interface
│   │   ├── tools.ts           # Tool registry
│   │   ├── shared/
│   │   │   └── platformSearch.ts  # Platform-aware search
│   │   └── RefactorTools/
│   │       ├── ScopeTool/     # Scope management
│   │       └── VerifyTool/    # Deviation detection
│   └── types/global.d.ts
├── scripts/
│   └── init-harness.ts        # Project initialization
├── templates/                  # Harness templates
├── references/                 # Architecture references
├── tests/unit/               # Unit tests
├── package.json
└── SKILL.md
```

## Test

```bash
bun test              # Run all tests
bun run lint          # Check lint
bun run lint:fix      # Fix lint issues
```

## Initialize New Harness Project

```bash
bun scripts/init-harness.ts <project-name> --template basic
```