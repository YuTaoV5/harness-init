/**
 * Tool Interface Definition
 * Standard interface for all tools in the harness
 */

import { z } from 'zod'

export type AnyObject = { [key: string]: unknown }

// Tool definition
export type Tool<
  Input extends AnyObject = AnyObject,
  Output = unknown,
  P extends ToolProgressData = ToolProgressData,
> = {
  name: string
  aliases?: string[]
  inputSchema: Input
  description(input: z.infer<Input>): Promise<string>
  call(
    args: z.infer<Input>,
    context: ToolUseContext,
    canUseTool: CanUseToolFn,
    parentMessage: AssistantMessage,
    onProgress?: ToolCallProgress<P>
  ): Promise<ToolResult<Output>>
  
  // Optional methods with defaults
  isEnabled?(): boolean
  isConcurrencySafe?(input: z.infer<Input>): boolean
  isReadOnly?(input: z.infer<Input>): boolean
  isDestructive?(input: z.infer<Input>): boolean
  checkPermissions?(input: z.infer<Input>, context: ToolUseContext): Promise<PermissionResult>
  
  // Rendering (for UI)
  renderToolResultMessage?(content: Output, options: RenderOptions): React.ReactNode
  renderToolUseMessage?(input: Partial<z.infer<Input>>, options: RenderOptions): React.ReactNode
}

export type Tools = readonly Tool[]

// Tool definition for buildTool
export type ToolDef<
  Input extends AnyObject = AnyObject,
  Output = unknown,
  P extends ToolProgressData = ToolProgressData,
> = Omit<Tool<Input, Output, P>, DefaultableToolKeys> &
  Partial<Pick<Tool<Input, Output, P>, DefaultableToolKeys>>

type DefaultableToolKeys = 'isEnabled' | 'isConcurrencySafe' | 'isReadOnly' | 'isDestructive' | 'checkPermissions'

// Default implementations
const TOOL_DEFAULTS = {
  isEnabled: () => true,
  isConcurrencySafe: () => false,
  isReadOnly: () => false,
  isDestructive: () => false,
  checkPermissions: async (input: AnyObject): Promise<PermissionResult> => ({ behavior: 'allow', updatedInput: input }),
}

// Build a complete Tool from a partial definition
export function buildTool<D extends ToolDef>(def: D): Tool {
  return {
    ...TOOL_DEFAULTS,
    userFacingName: () => def.name,
    ...def,
  } as Tool
}

// Context passed to tool calls
export interface ToolUseContext {
  options: {
    debug: boolean
    tools: Tools
    mcpClients: unknown[]
  }
  abortController: AbortController
  messages: Message[]
  [key: string]: unknown
}

// Permission types
export type PermissionResult = 
  | { behavior: 'allow'; updatedInput?: Record<string, unknown> }
  | { behavior: 'deny'; reason?: string }
  | { behavior: 'ask' }

// Message type
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

// Tool result
export interface ToolResult<T = unknown> {
  data: T
  error?: string
  newMessages?: Message[]
}

// Progress
export interface ToolProgressData {
  type: string
  [key: string]: unknown
}

export type ToolCallProgress<P extends ToolProgressData = ToolProgressData> = (
  progress: { toolUseID: string; data: P }
) => void

// Can use tool function
export type CanUseToolFn = () => Promise<PermissionResult>

// Render options
export interface RenderOptions {
  theme?: string
  verbose?: boolean
  commands?: unknown[]
}

// Helper functions
export function toolMatchesName(tool: { name: string; aliases?: string[] }, name: string): boolean {
  return tool.name === name || (tool.aliases?.includes(name) ?? false)
}

export function findToolByName(tools: Tools, name: string): Tool | undefined {
  return tools.find(t => toolMatchesName(t, name))
}
