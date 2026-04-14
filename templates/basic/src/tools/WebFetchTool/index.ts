/**
 * WebFetchTool - Fetch web content
 */

import { z } from 'zod'
import { buildTool } from '../Tool.js'

export const WebFetchToolInput = z.object({
  url: z.string().url().describe('URL to fetch'),
  method: z.enum(['GET', 'POST']).optional().default('GET'),
  headers: z.record(z.string()).optional().describe('HTTP headers'),
  body: z.string().optional().describe('Request body'),
})

const WebFetchTool = buildTool({
  name: 'WebFetch',
  aliases: ['fetch', 'curl', 'wget'],
  inputSchema: WebFetchToolInput,

  description: async (input) => `Fetch: ${input.url}`,

  async call(args) {
    try {
      const response = await fetch(args.url, {
        method: args.method,
        headers: args.headers,
        body: args.body,
      })
      
      const text = await response.text()
      
      return {
        data: {
          status: response.status,
          statusText: response.statusText,
          headers: Object.fromEntries(response.headers.entries()),
          body: text.slice(0, 10000), // Limit response size
        },
      }
    } catch (error) {
      return {
        data: null,
        error: error instanceof Error ? error.message : String(error),
      }
    }
  },
})

export { WebFetchTool }
