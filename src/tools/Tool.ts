import { z } from 'zod'

export type AnyObject = { [key: string]: unknown }

export type Tool<
  Input extends AnyObject = AnyObject,
  Output = unknown,
> = {
  name: string
  aliases?: string[]
  inputSchema: Input
  description(input: z.infer<Input>): Promise<string>
  call(
    args: z.infer<Input>,
    context: ToolUseContext,
    canUseTool: CanUseToolFn,
    parentMessage: AssistantMessage
  ): Promise<ToolResult<Output>>
  isEnabled?(): boolean
  isConcurrencySafe?(input: z.infer<Input>): boolean
  isReadOnly?(input: z.infer<Input>): boolean
  isDestructive?(input: z.infer<Input>): boolean
  checkPermissions?(input: z.infer<Input>, context: ToolUseContext): Promise<PermissionResult>
}

export type Tools = readonly Tool[]

export type ToolDef<
  Input extends AnyObject = AnyObject,
  Output = unknown,
> = Omit<Tool<Input, Output>, DefaultableToolKeys> &
  Partial<Pick<Tool<Input, Output>, DefaultableToolKeys>>

type DefaultableToolKeys = 'isEnabled' | 'isConcurrencySafe' | 'isReadOnly' | 'isDestructive' | 'checkPermissions'

const TOOL_DEFAULTS = {
  isEnabled: () => true,
  isConcurrencySafe: () => false,
  isReadOnly: () => false,
  isDestructive: () => false,
  checkPermissions: async (input: AnyObject): Promise<PermissionResult> => ({ behavior: 'allow', updatedInput: input }),
}

export function buildTool<D extends ToolDef>(def: D): Tool {
  return {
    ...TOOL_DEFAULTS,
    userFacingName: () => def.name,
    ...def,
  } as Tool
}

export interface ToolUseContext {
  options: {
    debug: boolean
    tools: Tools
    mcpClients: unknown[]
  }
  abortController: AbortController
  messages: Message[]
  projectStore?: unknown
  [key: string]: unknown
}

export type PermissionResult =
  | { behavior: 'allow'; updatedInput?: Record<string, unknown> }
  | { behavior: 'deny'; reason?: string }
  | { behavior: 'ask' }

export interface Message {
  id: string
  role: 'user' | 'assistant' | 'system'
  content: string
}

export interface AssistantMessage extends Message {
  role: 'assistant'
  toolCalls?: ToolCall[]
}

export interface ToolCall {
  id: string
  name: string
  input: Record<string, unknown>
}

export interface ToolResult<T = unknown> {
  data: T
  error?: string
  newMessages?: Message[]
}

export type CanUseToolFn = () => Promise<PermissionResult>

export function toolMatchesName(tool: { name: string; aliases?: string[] }, name: string): boolean {
  return tool.name === name || (tool.aliases?.includes(name) ?? false)
}

export function findToolByName(tools: Tools, name: string): Tool | undefined {
  return tools.find(t => toolMatchesName(t, name))
}