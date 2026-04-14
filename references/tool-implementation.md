# Tool Implementation Guide

## Tool Interface

Every tool implements the `Tool` interface:

```typescript
export type Tool<
  Input extends AnyObject = AnyObject,
  Output = unknown,
> = {
  name: string
  inputSchema: z.ZodType
  description(input: z.infer<Input>): Promise<string>
  call(
    args: z.infer<Input>,
    context: ToolUseContext,
    canUseTool: CanUseToolFn,
    parentMessage: AssistantMessage,
  ): Promise<ToolResult<Output>>
  
  // Optional methods
  isEnabled?(): boolean
  isReadOnly?(input: z.infer<Input>): boolean
  isConcurrencySafe?(input: z.infer<Input>): boolean
  checkPermissions?(input, context): Promise<PermissionResult>
}
```

## Tool Directory Structure

```
src/tools/<ToolName>/
├── index.ts          # Tool definition (buildTool call)
├── inputSchema.ts   # Zod schema for input
├── description.ts   # Description string function
├── call.ts          # Execution logic
└── render.tsx       # Optional UI rendering
```

## Example: BashTool

### inputSchema.ts
```typescript
import { z } from 'zod'

export const BashToolInput = z.object({
  command: z.string().describe('The shell command to execute'),
  cwd: z.string().optional().describe('Working directory'),
  timeout: z.number().optional().describe('Timeout in ms'),
})
```

### index.ts
```typescript
import { z } from 'zod'
import { buildTool } from '../Tool.js'
import { BashToolInput } from './inputSchema.js'

export const BashTool = buildTool({
  name: 'Bash',
  inputSchema: BashToolInput,

  description: async (input) => `Execute: ${input.command}`,

  async call(args, context) {
    const result = await exec(args.command, {
      cwd: args.cwd,
      timeout: args.timeout,
    })
    
    return {
      data: {
        stdout: result.stdout,
        stderr: result.stderr,
        exitCode: result.exitCode,
      },
    }
  },

  isReadOnly: (input) => isReadOnlyCommand(input.command),
})
```

## Tool Registry

Register tools in `src/tools/tools.ts`:

```typescript
import { feature } from 'bun:bundle'

export function getAllTools(): Tool[] {
  const tools: Tool[] = [
    BashTool,
    FileReadTool,
    FileWriteTool,
    FileEditTool,
    GrepTool,
    GlobTool,
  ]

  // Conditional loading
  if (feature('AGENT_TRIGGERS_REMOTE')) {
    tools.push(RemoteTriggerTool)
  }

  return tools
}
```

## Permission System

Tools can implement `checkPermissions`:

```typescript
checkPermissions: async (input, context) => {
  // Check if command matches allowed patterns
  if (isDangerous(input.command)) {
    return { behavior: 'deny', reason: 'Dangerous command' }
  }
  return { behavior: 'allow', updatedInput: input }
}
```

## Testing Tools

```typescript
import { describe, test, expect, mock } from 'bun:test'

describe('BashTool', () => {
  test('executes command', async () => {
    const tool = BashTool
    const result = await tool.call(
      { command: 'echo hello' },
      createMockContext(),
      () => Promise.resolve({ behavior: 'allow' }),
      {} as any
    )
    
    expect(result.data?.stdout).toContain('hello')
  })
})
```
