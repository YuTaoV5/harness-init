# Refactor Harness Design

> **设计起源**：本设计源于对 Harness 架构通用性的讨论，最终确定采用 Extended 方案构建适合 kernel 级代码仓库重构的专用 Harness。

---

## 一、问题背景与需求确认

### Q&A 讨论记录

**Q1: 你觉得对于 harness 架构来说，他本身应该是针对 agent 的优化，他对通用工程有借鉴意义吗？**

A: Harness 的设计模式（如分层架构、状态管理、工具系统、hook机制、上下文压缩等）对通用软件工程确实有借鉴价值。但需要区分：
- **真正的架构精华**：Hook/中间件机制、Feature Flag 系统、Zustand 风格状态存储、异步生成器查询循环
- **Agent 语义包装**：Tool/Agent 概念、上下文压缩的记忆功能

---

**Q2: 你主要担心的是 harness 哪些方面"溢出"到通用工程会出问题？**

A: 主要是两点：
1. **概念污染** — Agent/Tool 这些概念对非 AI 团队是负担
2. **上下文压缩等特性** — 在通用场景下没有意义

---

**Q3: 如果把 harness 的设计精华抽离掉 agent 语义，你希望它解决什么问题？**

A: 用户选择 **D. 全部都要，但重命名** — 希望保留所有能力但用自己的语义。

---

**Q4: 你的实际场景是已有系统在重构，还是新系统要设计？**

A: 现在有庞大的系统，相当于 **kernel 级别的代码仓库**。针对某个跨用例链很长很杂的功能，往往业务代码涉及很多文件。想重构时需要：
1. 上下文压缩
2. 更高效的搜索
3. 时刻检查是否偏离需求

---

**Q5: 你理解的 harness 工程是囊括这些并且有更多类似 Claude Code 架构的内存管理以及记忆功能**

A: 这重新 frame 了问题 — **Harness 架构本身就包含了用户需要的这些能力（工作集管理、记忆功能、偏离检测），而这些能力对他的重构工作流有直接价值**。

---

**Q6: 你最自然的思维方式是哪种？**

A: 用户选择 **C（不确定哪个更合适）— 需要具体对比**

**方案 A：直接用 Harness 语义**
- 你面对的问题 → Harness 原语
- 重构上下文 → messages (会话历史)
- 一次重构操作（搜/改/验）→ tool call
- 项目知识积累 → memories
- 偏离检测结果 → system prompt 的约束

**方案 B：抽取能力，用自己的语义**
- Harness 原语 → 你自己的语义
- 需要自己实现，工作量大

---

**Q7: 你选哪个？**

A: **方案 A** — 用 Harness 语义框架

---

### 最终决策

采用 **Extended 方案 A**：基于 Harness 架构 + 自定义 Memory Layer + VerifyPipeline，保留 Harness 的核心能力，扩展记忆和验证层。

---

## 二、核心痛点

当前存在庞大的 kernel 级别代码仓库，跨用例链很长很杂。重构时面临三大痛点：

1. **上下文管理** — 重构涉及很多文件，过程中需要记住已处理的文件、依赖关系、改动关联
2. **高效搜索** — 在庞大代码库里快速定位相关文件和代码段
3. **偏离检测** — 重构过程中持续验证改动是否还符合原始需求

---

## 三、Architecture

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

### 能力映射

| 重构需求 | Harness 能力 | 说明 |
|---------|-------------|------|
| 上下文管理 | messages + 会话历史 | Harness query loop 自带 |
| 高效搜索 | GrepTool/GlobTool | 平台感知版本已实现 |
| 记忆功能 | ProjectKnowledgeStore | 自定义扩展 |
| 偏离检测 | VerifyTool | 自定义工具 |
| 上下文压缩 | ContextCollapse | 参考 Claude Code 实现 |

---

## 四、Memory Layer

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

---

## 五、Toolset

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

---

## 六、Workflow

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

---

## 七、Trade-offs

- ✅ 最小成本获得最大定制力
- ✅ 社区有 Claude Code 等参考实现
- ✅ 接受了 Harness 语义框架，快速上手
- ⚠️ 需要维护额外存储（ProjectKnowledgeStore）
- ⚠️ 项目知识积累需要设计持久化策略

---

## 八、This Architecture Can Do

| 场景 | 能力 |
|------|------|
| **跨文件重构** | ScopeTool 管理重构范围，跟踪每个文件的处理状态和原因 |
| **大规模代码库搜索** | PlatformSearch 自动选择最优搜索工具（rg/findstr/grep） |
| **重构偏离检测** | VerifyTool 对比改动与约束，检测 API 变更、breaking change |
| **长会话上下文管理** | ContextCollapse 在接近边界时自动折叠历史 |
| **项目知识积累** | ProjectKnowledgeStore 持久化项目级事实和会话上下文 |
| **多团队协作** | 分离的 facts 和 session context，支持多人接力重构 |

---

## 九、实现状态

已完成：
- [x] ProjectKnowledgeStore
- [x] ContextCollapse
- [x] PlatformSearch (平台感知搜索)
- [x] ScopeTool
- [x] VerifyTool
- [x] 工具注册
- [x] CLI 入口
- [x] 36 个测试全部通过

待完成：
- [ ] 持久化策略设计（磁盘存储）
- [ ] 与 Harness query loop 集成
- [ ] REPL 模式支持