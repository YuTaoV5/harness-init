# Refactor Harness Design

## Context

当前存在庞大的 kernel 级别代码仓库，跨用例链很长很杂。重构时面临三大痛点：
1. 上下文管理 — 重构涉及很多文件，过程中需要记住已处理的文件、依赖关系、改动关联
2. 高效搜索 — 在庞大代码库里快速定位相关文件和代码段
3. 偏离检测 — 重构过程中持续验证改动是否还符合原始需求

用户选择方案 2：基于 Harness 架构 + 自定义 Memory Layer，保留 Harness 的核心能力（query loop、tool registry、state store），扩展记忆和验证层。

## Decision

采用 Extended 方案：Harness Core + 自定义 Memory Layer + VerifyPipeline。

## Architecture

```
┌──────────────────────────────────────────────────────┐
│                    Entry Layer                       │
│  cli.ts ──→ startRefactorMode()                      │
└──────────────────────────────────────────────────────┘
                          │
┌──────────────────────────────────────────────────────┐
│                    Harness Core                      │
│  query loop + tool registry + state store           │
└──────────────────────────────────────────────────────┘
                          │
        ┌─────────────────┼─────────────────┐
        ▼                 ▼                 ▼
┌──────────────┐ ┌──────────────┐ ┌──────────────┐
│RefactorTools │ │Memory Layer  │ │VerifyPipeline│
│  (custom)    │ │ (extension)  │ │  (extension) │
└──────────────┘ └──────────────┘ └──────────────┘
```

## Memory Layer

### 核心概念：Bounded Resource Management

Memory Layer 本质上是**有边界的资源管理系统**，参考 context-collapse 设计：

```
Bounded Resource (上下文窗口/token限制) + Eviction Strategy = Working Set Management
```

等价通用模式：
- 缓存淘汰（LRU/LFU/TTL）
- 虚拟内存分页
- 数据库连接池

### ProjectKnowledgeStore

持久化项目级知识：

```typescript
interface ProjectKnowledgeStore {
  // 项目级持久化知识
  addFact(key: string, value: string): void
  getFact(key: string): string | undefined
  
  // 当前重构会话的上下文（会话级，有边界）
  getSessionContext(): RefactorScope
  updateSessionContext(scope: RefactorScope): void
  addToScope(file: string, reason: string): void
  
  // 上下文折叠（当会话接近边界时）
  collapseContext(): CollapseResult
  recoverFromOverflow(): void
}
```

与 Harness store 的关系：
- `Harness store` → 轻量状态（工具列表、配置、权限）
- `ProjectKnowledgeStore` → 重量知识（文件关系、需求约束），**有上下文边界限制**

### RefactorScope

会话级重构范围：

```typescript
interface RefactorScope {
  files: Map<string, { addedAt: Date; reason: string; status: 'pending' | 'done' | 'failed' }>
  constraints: string[]  // 原始需求/约束
  history: ChangeRecord[]
}
```

### 上下文折叠策略

当会话接近 token/context 边界时，采用 LLM 压缩摘要策略（不是简单截断）：

1. **保留**：决策、文件路径、错误、约束
2. **折叠**：重复操作、相似的搜索结果
3. **紧急释放**：413 恢复时触发紧急折叠

## Toolset

### 平台感知工具选择

不同操作系统有各自最优的搜索/文件工具，设计时必须考虑平台差异：

| 能力 | Windows | macOS | Linux | 说明 |
|------|---------|-------|-------|------|
| **文件搜索** | `rg` > `findstr` > `dir` | `rg` > `find` | `rg` > `find` | ripgrep 性能远超原生 grep |
| **内容搜索** | `rg` > `findstr` > `grep` | `rg` > `grep` | `rg` > `grep` | 同样 rg 最优 |
| **路径展开** | `Get-ChildItem` (PS) | `realpath` | `realpath` | glob pattern 转换 |
| **文件读取** | `Get-Content` (PS) / `type` | `cat` | `cat` | 大文件有差异 |
| **差异比对** | `fc` / `certutil` | `diff` | `diff` | 用于 VerifyTool |

> 参考：`computer-use-windows-enhancement.md` Phase D 说明 Windows 上 PowerShell 子进程启动 ~273ms，高频操作需要考虑直接 API 或缓存。

### 工具定义

| Tool | 功能 | 平台考虑 |
|------|------|---------|
| `ScopeTool` | 管理重构范围文件列表 | ProjectKnowledgeStore |
| `SearchTool` | 高效搜索（Grep+Glob封装） | **平台自动选择最优工具**（rg > findstr > grep） |
| `EditTool` | 文件改写 | Harness 内置 |
| `VerifyTool` | before/after比对，返回偏离报告 | ProjectKnowledgeStore，需要 diff 工具 |

## Workflow

```
用户输入需求
     ↓
ScopeTool 初始化重构范围（读写 ProjectKnowledgeStore）
     ↓
SearchTool 定位相关文件
     ↓
EditTool 执行改写
     ↓
VerifyTool 验证结果（before/after比对）
     ↓
偏离 → 返回报告，询问用户是否继续
     ↓
无偏离 → 持久化到 ProjectKnowledgeStore，更新会话上下文
```

## Trade-offs

- ✅ 最小成本获得最大定制力
- ✅ 社区有 Claude Code 等参考实现
- ⚠️ 需要维护额外存储（ProjectKnowledgeStore）
- ⚠️ 项目知识积累需要设计持久化策略

## Next Steps

1. 基于 basic template 初始化项目
2. 实现 ProjectKnowledgeStore
3. 实现 RefactorTools（ScopeTool, VerifyTool）
4. 集成到 Harness tool registry
5. 持久化策略设计