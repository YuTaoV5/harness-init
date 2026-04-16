# Refactor Harness Design

> **设计起源**：本设计源于对 Harness 架构通用性的讨论，最终确定采用 Extended 方案构建适合 kernel 级代码仓库重构的专用 Harness。

---

## 一、问题背景与需求确认

### Q&A 讨论记录

---

**Q: 你觉得对于 harness 架构来说，它本身应该是针对 agent 的优化（比如说上下文压缩/hook 机制等等），他对通用工程有借鉴意义吗？你觉得通用工程需要部署类似 harness 的架构吗，还是说 harness 就该是只针对 agent 的开发？**

**A:**

我首先需要了解一些背景来给出一个准确的判断：

1. 你在思考这个问题时，脑海中是针对哪种规模的工程？
   - 小型工具/脚本
   - 中型应用（多模块，团队协作，可能有插件系统）
   - **大型平台（微服务架构，多团队，长期维护）**

---

**Q: 你是针对哪种规模？**

**A: 微服务架构，多团队，长期维护**

---

**Q: 你主要担心的是 harness 哪些方面"溢出"到通用工程会出问题？**

**A:**
- B. 概念污染 — Agent/Tool 这些概念对非 AI 团队是负担
- C. 上下文压缩等特性 — 在通用场景下没有意义

---

**Q: 如果把 harness 的设计精华抽离掉 agent 语义，你希望它解决什么问题？换句话说，你宁愿要一个叫什么名字的架构？**

**A:**
- D. 全部都要，但重命名（可以说具体名称）

---

**Q: 你想要 Harness 的能力，但用自己的语义，还是愿意用 Harness 的语义框架？**

**A:** 选了 C（不确定哪个更合适）— 需要具体对比

---

**Q: 具体对比：**

### 方案 A：直接用 Harness 语义

```
你面对的问题          →  Harness 原语
重构上下文            →  messages (会话历史)
一次重构操作（搜/改/验） →  tool call
项目知识积累          →  memories
偏离检测结果          →  system prompt 的约束
```

**优点**：开箱即用，Harness 已经完整实现了工作集管理、记忆、偏离检测。社区有参考实现（Claude Code 架构是公开的）。

**缺点**：需要把你的问题"翻译"成 agent 概念。代码里会有 `useTool`、`sendMessage` 这类语义。

### 方案 B：抽取能力，用自己的语义

```
Harness 的能力         →  你的语义
Working Set Manager   →  RefactorWorkspace（重构工作区）
Memory System          →  ProjectKnowledgeBase（项目知识库）
Context Compression    →  ScopeManager（范围管理器）
Tool Pipeline          →  OperationChain（操作链）
```

**优点**：完全用你的业务语言。可以独立演进，不被 agent 概念束缚。

**缺点**：需要自己实现，工作量大。没有现成的参考实现。

### 我的建议

如果你的重构工作流可以接受"用 Harness 原语思考"，先用方案 A，因为它已经完整，你不需要重新发明轮子。等你遇到真正的别扭点（比如"我想做 X，但 Harness 没有"）再考虑抽象层。

---

**Q: 你选哪个？**

**A: 方案 A**

---

**Q: 我觉得很符合。但是有一点问题，请你参考 X:\Items\opencode_prjs\harness\claude-code-main\docs\features 里面 computer-use 开头的的几个文件，里面描述了不同平台对于不同 shell 不同搜索工具，比如 rg 效率远优于 grep 之类的描述，请你在设计时候考虑不同操作系统平台的高效工具作为参考文档**

**A:** 好的，我会在设计中加入平台感知的搜索工具选择策略。

---

**Q: 就这样，实现你的 plan**

**A:** 开始执行实现计划...

---

### 最终决策

经过详细讨论，用户选择 **方案 A：直接用 Harness 语义**，并补充要求在设计中考虑：
1. **平台感知工具选择** — 参考 computer-use 相关文档，不同平台使用最高效的搜索工具
2. **上下文压缩策略** — 参考 context-collapse 设计

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