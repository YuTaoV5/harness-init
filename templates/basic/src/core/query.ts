/**
 * Core Query Loop
 * Handles message streaming and tool execution
 */

import type { Message } from '../types/message.js'
import type { Tool, ToolResult } from '../tools/Tool.js'

export interface QueryOptions {
  model?: string
  maxTokens?: number
  temperature?: number
  systemPrompt?: string
}

export interface StreamEvent {
  type: 'content_block_delta' | 'content_block_stop' | 'message_stop' | 'message_start' | 'error'
  index?: number
  delta?: { type: 'text_delta'; text: string }
  message?: Message
  error?: string
}

/**
 * Main query function - streaming response generator
 */
export async function* query(
  messages: Message[],
  tools: Tool[],
  options: QueryOptions = {}
): AsyncGenerator<StreamEvent> {
  // Get the provider
  const provider = getProvider()
  
  // Validate
  if (!provider.isAvailable()) {
    yield { type: 'error', error: 'No LLM provider available. Set ANTHROPIC_API_KEY or use OPENAI-compatible mode.' }
    return
  }

  // Build request
  const stream = await provider.query(messages, tools, options)

  // Stream events
  for await (const event of stream) {
    yield event
  }
}

/**
 * Execute a tool call
 */
export async function executeTool(
  tool: Tool,
  args: unknown,
  context: ToolUseContext
): Promise<ToolResult> {
  try {
    return await tool.call(args as any, context, () => Promise.resolve({ behavior: 'allow' }), {} as any)
  } catch (error) {
    return {
      data: null,
      error: error instanceof Error ? error.message : String(error),
    }
  }
}

// Placeholder - implement based on your provider setup
function getProvider(): LLMProvider {
  throw new Error('Provider not configured. See AGENTS.md for setup instructions.')
}

interface LLMProvider {
  name: string
  query(messages: Message[], tools: Tool[], options?: QueryOptions): Promise<ResponseStream>
  isAvailable(): boolean
  listModels(): string[]
}

interface ResponseStream {
  async *[Symbol.asyncIterator](): AsyncGenerator<StreamEvent>
  abort(): void
}

interface ToolUseContext {
  // Add context properties as needed
  [key: string]: unknown
}
