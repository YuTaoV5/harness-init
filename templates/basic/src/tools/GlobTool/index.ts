/**
 * GlobTool - Find files by pattern
 */

import { z } from 'zod'
import { buildTool } from '../Tool.js'

export const GlobToolInput = z.object({
  pattern: z.string().describe('Glob pattern to match'),
  path: z.string().optional().describe('Base path to search from'),
})

const GlobTool = buildTool({
  name: 'Glob',
  aliases: ['find', 'ls'],
  inputSchema: GlobToolInput,

  description: async (input) => `Find files matching: ${input.pattern}`,

  async call(args) {
    try {
      const { glob } = await import('glob')
      const matches = await glob(args.pattern, {
        cwd: args.path || process.cwd(),
        absolute: false,
      })
      
      return { data: { matches, count: matches.length } }
    } catch (error) {
      return {
        data: null,
        error: error instanceof Error ? error.message : String(error),
      }
    }
  },
})

export { GlobTool }
