/**
 * GrepTool - Search file contents
 */

import { z } from 'zod'
import { buildTool } from '../Tool.js'
import { grep } from '../shared/grep.js'

export const GrepToolInput = z.object({
  pattern: z.string().describe('Pattern to search for'),
  path: z.string().optional().describe('Path to search in (file or directory)'),
  include: z.string().optional().describe('File pattern to include (e.g., *.ts)'),
  recursive: z.boolean().optional().describe('Search recursively'),
  caseSensitive: z.boolean().optional().default(false),
})

const GrepTool = buildTool({
  name: 'Grep',
  aliases: ['search', 'find'],
  inputSchema: GrepToolInput,

  description: async (input) => `Search for "${input.pattern}"${input.path ? ` in ${input.path}` : ''}`,

  async call(args) {
    try {
      const results = await grep({
        pattern: args.pattern,
        path: args.path,
        include: args.include,
        recursive: args.recursive ?? true,
        caseSensitive: args.caseSensitive ?? false,
      })
      
      return { data: results }
    } catch (error) {
      return {
        data: null,
        error: error instanceof Error ? error.message : String(error),
      }
    }
  },
})

export { GrepTool }
