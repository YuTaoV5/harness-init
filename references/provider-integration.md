# Provider Integration Guide

## Provider Interface

```typescript
interface LLMProvider {
  name: string
  query(
    messages: Message[],
    tools: Tool[],
    options?: QueryOptions
  ): Promise<ResponseStream>
  isAvailable(): boolean
  listModels(): string[]
  getModel(capability: 'fast' | 'balanced' | 'powerful'): string
}

interface ResponseStream {
  async *[Symbol.asyncIterator](): AsyncGenerator<StreamEvent>
  abort(): void
}
```

## Stream Events

```typescript
type StreamEvent =
  | { type: 'message_start'; message: Message }
  | { type: 'content_block_start'; index: number; block: ContentBlock }
  | { type: 'content_block_delta'; index: number; delta: TextDelta | InputDelta }
  | { type: 'content_block_stop'; index: number }
  | { type: 'message_stop' }
  | { type: 'error'; error: string }
```

## Anthropic Provider

```typescript
import { Anthropic } from '@anthropic-ai/sdk'

export class AnthropicProvider implements LLMProvider {
  name = 'anthropic'
  private client: Anthropic

  constructor(apiKey?: string) {
    this.client = new Anthropic({ apiKey: apiKey || process.env.ANTHROPIC_API_KEY })
  }

  isAvailable(): boolean {
    return !!this.client.apiKey
  }

  async query(messages, tools, options = {}) {
    const response = await this.client.messages.stream({
      model: options.model || 'claude-sonnet-4-20250514',
      max_tokens: options.maxTokens || 4096,
      messages: toAnthropicFormat(messages),
      tools: toAnthropicTools(tools),
    })

    return new AnthropicStream(response)
  }
}
```

## OpenAI Compatibility Layer

For Ollama, DeepSeek, vLLM:

```typescript
export class OpenAIProvider implements LLMProvider {
  name = 'openai'
  private baseURL: string
  private apiKey: string

  constructor(config: { baseURL: string; apiKey: string }) {
    this.baseURL = config.baseURL
    this.apiKey = config.apiKey
  }

  isAvailable(): boolean {
    return !!this.apiKey
  }

  async query(messages, tools, options = {}) {
    const response = await fetch(`${this.baseURL}/chat/completions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${this.apiKey}`,
      },
      body: JSON.stringify({
        model: options.model || 'gpt-4',
        messages: toOpenAIFormat(messages),
        tools: toOpenAITools(tools),
        stream: true,
      }),
    })

    return new OpenAIStream(response)
  }
}
```

## Stream Adapter Pattern

Convert between provider formats:

```typescript
export class AnthropicStream implements ResponseStream {
  constructor(private response: AsyncIterable<any>) {}

  async *[Symbol.asyncIterator]() {
    for await (const event of this.response) {
      yield convertToInternalFormat(event)
    }
  }

  abort() {
    // Handle abort
  }
}

function convertToInternalFormat(event: any): StreamEvent {
  switch (event.type) {
    case 'message_start':
      return { type: 'message_start', message: event.message }
    case 'content_block_delta':
      return {
        type: 'content_block_delta',
        index: event.index,
        delta: event.delta,
      }
    case 'message_stop':
      return { type: 'message_stop' }
    default:
      return { type: 'error', error: `Unknown event: ${event.type}` }
  }
}
```

## Provider Selection

```typescript
export function getProvider(): LLMProvider {
  if (process.env.USE_OPENAI === '1') {
    return new OpenAIProvider({
      baseURL: process.env.OPENAI_BASE_URL || 'http://localhost:11434/v1',
      apiKey: process.env.OPENAI_API_KEY || 'dummy',
    })
  }
  
  if (process.env.USE_GEMINI === '1') {
    return new GeminiProvider({
      apiKey: process.env.GEMINI_API_KEY!,
    })
  }

  return new AnthropicProvider(process.env.ANTHROPIC_API_KEY)
}
```
