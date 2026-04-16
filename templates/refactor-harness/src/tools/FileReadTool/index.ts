/**
 * FileReadTool - Read file contents
 */

import { z } from 'zod'
import { buildTool } from '../Tool.js'
import { readFile } from 'fs/promises'
import { stat } from 'fs/promises'

export const FileReadToolInput = z.object({
  path: z.string().describe('Path to the file to read'),
  offset: z.number().optional().describe('Line number to start reading from'),
  limit: z.number().optional().describe('Maximum number of lines to read'),
})

const FileReadTool = buildTool({
  name: 'Read',
  aliases: ['file_read', 'cat'],
  inputSchema: FileReadToolInput,

  description: async (input) => `Read file: ${input.path}`,

  async call(args) {
    try {
      const content = await readFile(args.path, 'utf-8')
      const lines = content.split('\n')
      const start = args.offset ?? 0
      const end = args.limit ? start + args.limit : lines.length
      const selected = lines.slice(start, end)
      
      return {
        data: {
          content: selected.join('\n'),
          path: args.path,
          lines: lines.length,
          truncated: end < lines.length,
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

export { FileReadTool }
