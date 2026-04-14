# OpenCode Integration Guide

## AGENTS.md

The `AGENTS.md` file is the primary instruction file for OpenCode. Place it in the project root.

### Required Content

```markdown
# AGENTS.md

## 项目概述
[1-3 句话描述项目]

## 核心命令
\`\`\`bash
bun install
bun run dev
bun run build
bun test
\`\`\`

## 运行时要求
- 必须使用 Bun
- ESM 模块系统

## 架构要点
- 入口：src/entrypoints/cli.ts
- 核心循环：src/core/query.ts
- Tool 注册：src/tools/tools.ts
- 状态管理：src/state/store.ts

## Feature Flag 系统
\`\`\`typescript
import { feature } from 'bun:bundle'
feature('FLAG_NAME')
\`\`\`

## 测试
- 框架：bun:test
- 单元测试：src/**/__tests__/*.test.ts
```

## opencode.json

Optional configuration file:

```json
{
  "$schema": "https://opencode.ai/config.json",
  "instructions": "./AGENTS.md",
  "commands": {
    "HARNESS": {
      "description": "Initialize harness project",
      "script": "bun scripts/init-harness.ts"
    }
  }
}
```

## /HARNESS Shortcut

To add a `/HARNESS` command:

1. Create `opencode.json` with the command
2. Or add to `AGENTS.md`:

```markdown
## Commands

- `/HARNESS` - Initialize a new harness project
```

## Skill Installation

Install harness-init skill:

```bash
opencode --install-skill https://github.com/username/harness-init
opencode --install-skill /path/to/local/harness-init
```

## Project Verification

Verify project is correctly set up for OpenCode:

1. OpenCode reads `AGENTS.md` on project open
2. Commands in `opencode.json` are registered
3. Skill triggers on matching phrases

## Best Practices

1. **Keep AGENTS.md concise** - Only high-signal facts
2. **Use exact commands** - `bun run dev`, not `npm start`
3. **Document non-obvious conventions** - Bun-only features, path aliases
4. **Test AGENTS.md** - Open project and verify agent understands structure
