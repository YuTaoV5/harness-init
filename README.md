# Refactor Harness / 重构工具

<div align="center">

**A bounded-context memory management system for large-scale code repository refactoring.**
**大规模代码仓库重构的有限上下文内存管理系统。**

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](LICENSE)
[![Bun](https://img.shields.io/badge/Bun-≥1.2.0-red.svg)](https://bun.sh)

</div>

---

## Origin / 起源

This project emerged from a brainstorming session about **large-scale codebase refactoring** challenges:

> "When refactoring large codebases — kernel-level code, microservice architectures, multi-team projects, long-term maintenance systems — the core problem isn't the refactoring itself. It's **context management**. AI coding agents have bounded memory, yet refactoring requires understanding cross-file dependencies, maintaining constraint consistency, and tracking scope across thousands of files."

> "在大规模代码库重构时——内核级代码、微服务架构、多团队项目、长期维护系统——核心问题不是重构本身，而是**上下文管理**。AI 编码代理的内存是有限的，而重构需要理解跨文件依赖、维护约束一致性、跟踪数千个文件的范围。"

**Refactor Harness** was designed to solve this — a harness architecture that manages bounded context, enables platform-aware search, tracks refactoring scope, and detects deviations from constraints.

**Refactor Harness** 应运而生——一种管理有限上下文、支持平台感知搜索、跟踪重构范围并检测约束偏差的工具架构。

---

## What It Does / 功能

```
┌─────────────────────────────────────────────────────────────┐
│                    Large Codebase                             │
│         (Kernel / Microservices / Multi-team)                │
└──────────────────────┬────────────────────────────────────┘
                       │
                       ▼
┌─────────────────────────────────────────────────────────────┐
│                  Refactor Harness                             │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐     │
│  │   Context    │  │   Scope      │  │    Verify    │     │
│  │  Collapse    │  │   Tool       │  │    Tool      │     │
│  │  (LRU Evict) │  │ (Track files)│  │  (Deviation) │     │
│  └──────────────┘  └──────────────┘  └──────────────┘     │
│  ┌──────────────┐  ┌──────────────┐                       │
│  │  Platform    │  │   Project    │                       │
│  │   Search     │  │  Knowledge   │                       │
│  │ (rg>grep>..) │  │    Store     │                       │
│  └──────────────┘  └──────────────┘                       │
└─────────────────────────────────────────────────────────────┘
```

### Core Capabilities / 核心能力

| Capability | Implementation | Purpose |
|------------|----------------|---------|
| **Context Management** | `ProjectKnowledgeStore` | Track refactoring scope, history, constraints in bounded memory |
| **Context Collapse** | `ContextCollapse` | Evict old records when approaching context limits (LRU strategy) |
| **Platform Search** | `PlatformSearch` | Auto-select optimal search tool (rg > grep > findstr) |
| **Scope Tracking** | `ScopeTool` | Manage files in refactoring scope with status (pending/in-progress/done) |
| **Deviation Detection** | `VerifyTool` | Detect API changes and constraint violations during refactor |

---

## Why These Matter / 为什么重要

### Context Collapse / 上下文压缩

AI agents have limited context windows. When refactoring a large codebase over hours or days, the agent can't remember every decision made. **Context Collapse** uses LRU eviction to summarize old context and preserve recent decisions.

**AI 代理的上下文窗口是有限的。**当在数小时或数天内重构大型代码库时，代理无法记住每个决策。**上下文压缩**使用 LRU 驱逐策略来总结旧上下文并保留最近的决策。

### Platform-Aware Search / 平台感知搜索

```typescript
// On Windows: rg > findstr > dir
// On macOS/Linux: rg > grep > find
```

Ripgrep (`rg`) is **5-10x faster** than `grep` and **significantly faster** than PowerShell's `findstr`. The harness automatically detects available tools and uses the fastest one.

Ripgrep (`rg`) 比 `grep` 快 **5-10 倍**，比 PowerShell 的 `findstr` **快得多**。工具自动检测可用工具并使用最快的工具。

### Scope Tracking / 范围跟踪

Refactoring without scope tracking is like editing with no undo — you lose track of what's changed and what's left. ScopeTool maintains a manifest of files with their status.

没有范围跟踪的重构就像没有撤销的编辑——你无法跟踪什么改变了，什么还没变。ScopeTool 维护一个文件清单及其状态。

### Deviation Detection / 偏差检测

Constraints like "Keep API stable" or "No breaking changes" are hard to maintain across hundreds of files. VerifyTool detects when changes violate these constraints.

"保持 API 稳定"或"无破坏性更改"等约束在数百个文件中难以维护。VerifyTool 检测更改何时违反这些约束。

---

## Installation / 安装

```bash
# Clone the repository
git clone https://github.com/YuTaoV5/harness-init.git
cd harness-init

# Install dependencies
bun install

# Run tests
bun test
```

### As an OpenCode Skill / 作为 OpenCode 技能

```bash
# Link to OpenCode skills directory
ln -s /path/to/harness-init ~/.opencode/skills/refactor-harness

# Use via /HARNESS command in OpenCode
```

---

## Quick Start / 快速开始

### Analyze a Project / 分析项目

```bash
bun run src/entrypoints/cli.ts --mode=analyze --root=/path/to/project --constraint="Keep API stable"
```

### Start Refactor Mode / 启动重构模式

```bash
bun run src/entrypoints/cli.ts --mode=refactor --root=/path/to/project --constraint="No breaking changes"
```

### Tool Usage / 工具使用

```typescript
// ScopeTool - Manage refactoring scope
{ action: 'add', file: 'src/kernel/foo.ts', reason: 'Core module' }
{ action: 'list' }
{ action: 'status', file: 'src/foo.ts', status: 'done' }
{ action: 'remove', file: 'src/foo.ts' }

// VerifyTool - Detect deviations
{ action: 'check', constraints: ['Keep API stable'] }
{ action: 'report' }
{ action: 'history' }
```

---

## Project Structure / 项目结构

```
harness-init/
├── src/
│   ├── entrypoints/
│   │   └── cli.ts              # CLI entry point
│   ├── state/
│   │   ├── store.ts            # Zustand-style store
│   │   └── projectKnowledgeStore.ts  # Bounded memory layer
│   ├── memory/
│   │   └── contextCollapse.ts  # Context eviction (LRU)
│   ├── tools/
│   │   ├── Tool.ts             # Tool interface
│   │   ├── tools.ts            # Tool registry
│   │   ├── shared/
│   │   │   └── platformSearch.ts  # Platform-aware search
│   │   └── RefactorTools/
│   │       ├── ScopeTool/      # Scope management
│   │       └── VerifyTool/     # Deviation detection
│   └── types/
│       └── global.d.ts         # Global types
├── tests/
│   └── unit/                   # Unit tests (22 passing)
├── SKILL.md                    # OpenCode skill metadata
├── package.json
├── tsconfig.json
├── biome.json
└── README.md
```

---

## Goals Achieved / 达成目标

| Goal | Status |
|------|--------|
| Bounded context management for long refactors | ✅ |
| Platform-aware efficient search | ✅ |
| Scope tracking for cross-file refactors | ✅ |
| Deviation detection (verify changes against constraints) | ✅ |
| Context collapse when approaching limits | ✅ |
| Runnable as OpenCode skill | ✅ |

---

## License / 许可证

MIT — Use freely, modify endlessly.

---

<div align="center">

**Manage context. Track scope. Detect deviations. Refactor at scale.**

**管理上下文。跟踪范围。检测偏差。大规模重构。**

</div>
