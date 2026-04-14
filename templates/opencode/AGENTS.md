# AGENTS.md

## 项目概述

{{PROJECT_DESCRIPTION}} — 基于 Harness 架构的 AI 编程助手项目。

## 核心命令

```bash
bun install          # 安装依赖
bun run dev           # 开发模式
bun run dev:inspect   # 调试模式 (BUN_INSPECT=9229)
bun run build         # 构建
bun test              # 运行测试
bun run lint          # 检查 lint
bun run lint:fix      # 自动修复 lint
bun run format        # 格式化
```

## 运行时要求

- **必须使用 Bun**（不是 Node.js）
- ESM 模块系统 (`"type": "module"`)

## 架构要点

- **入口**：`src/entrypoints/cli.ts`
- **核心循环**：`src/core/query.ts`
- **Tool 注册**：`src/tools/tools.ts`
- **状态管理**：`src/state/store.ts`

## Feature Flag 系统

代码中使用：
```typescript
import { feature } from 'bun:bundle'
feature('FLAG_NAME')  // 返回 boolean
```

启用方式：`FEATURE_<FLAG_NAME>=1` 环境变量

Dev 默认启用：`BUDDY`、`BRIDGE_MODE`、`AGENT_TRIGGERS_REMOTE`、`CHICAGO_MCP`、`VOICE_MODE`、`ULTRATHINK`、`LODESTONE`

## 测试

- 框架：`bun:test`
- 单元测试：`src/**/__tests__/*.test.ts`
- Mock：`mock.module()` 必须内联在测试文件中

## 重要路径

- `src/types/global.d.ts` — 全局类型声明
- `scripts/dev.ts` — Dev 模式入口
- `scripts/defines.ts` — MACRO 定义
- `build.ts` — 构建配置
