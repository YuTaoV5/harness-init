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

### ProjectKnowledgeStore

持久化项目级知识：

```typescript
interface ProjectKnowledgeStore {
  addFact(key: string, value: string): void
  getFact(key: string): string | undefined
  getSessionContext(): RefactorScope
  updateSessionContext(scope: RefactorScope): void
  addToScope(file: string, reason: string): void
}
```

与 Harness store 的关系：
- `Harness store` → 轻量状态（工具列表、配置、权限）
- `ProjectKnowledgeStore` → 重量知识（文件关系、需求约束）

### RefactorScope

会话级重构范围：

```typescript
interface RefactorScope {
  files: Map<string, { addedAt: Date; reason: string; status: 'pending' | 'done' | 'failed' }>
  constraints: string[]  // 原始需求/约束
  history: ChangeRecord[]
}
```

## Toolset

| Tool | 功能 | 依赖 |
|------|------|------|
| `ScopeTool` | 管理重构范围文件列表 | ProjectKnowledgeStore |
| `SearchTool` | 高效搜索（Grep+Glob封装） | Harness 内置 |
| `EditTool` | 文件改写 | Harness 内置 |
| `VerifyTool` | before/after比对，返回偏离报告 | ProjectKnowledgeStore |

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