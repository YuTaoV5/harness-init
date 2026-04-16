# AGENTS.md

## 项目概述

Refactor Harness — 基于 Extended Harness 架构的重构工作流工具，专为 kernel 级别代码仓库设计。

## 核心能力

- **上下文管理**: ProjectKnowledgeStore 管理重构范围和历史
- **平台感知搜索**: 自动选择最优搜索工具 (rg > grep > findstr)
- **偏离检测**: VerifyTool 对比改动与约束，检测偏离
- **上下文压缩**: 当会话接近边界时自动折叠历史

## 核心命令

```bash
bun install          # 安装依赖
bun run dev           # 开发模式
bun run build         # 构建
bun test              # 运行测试
bun run lint          # 检查 lint
bun run lint:fix      # 自动修复 lint
```

## 运行时要求

- **必须使用 Bun**（不是 Node.js）
- ESM 模块系统 (`"type": "module"`)

## 架构要点

- **入口**: `src/entrypoints/cli.ts`
- **Memory Layer**: `src/state/projectKnowledgeStore.ts` + `src/memory/contextCollapse.ts`
- **RefactorTools**: `src/tools/RefactorTools/ScopeTool/`, `src/tools/RefactorTools/VerifyTool/`
- **平台搜索**: `src/tools/shared/platformSearch.ts`

## Feature Flag 系统

代码中使用：
```typescript
import { feature } from 'bun:bundle'
feature('FLAG_NAME')  // 返回 boolean
```

## 测试

- 框架：`bun:test`
- 单元测试：`tests/unit/*.test.ts`

## 重要路径

- `src/types/global.d.ts` — 全局类型声明
- `src/state/store.ts` — Harness 状态存储
- `src/tools/tools.ts` — 工具注册表