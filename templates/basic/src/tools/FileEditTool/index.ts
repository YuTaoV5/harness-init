/**
 * FileEditTool - Edit file contents
 */

import { z } from 'zod'
import { buildTool } from '../Tool.js'
import { readFile, writeFile } from 'fs/promises'

export const FileEditToolInput = z.object({
  path: z.string().describe('Path to the file to edit'),
  oldString: z.string().describe('String to replace'),
  newString: z.string().describe('Replacement string'),
})

const FileEditTool = buildTool({
  name: 'Edit',
  aliases: ['file_edit', 'replace'],
  inputSchema: FileEditToolInput,

  description: async (input) => `Edit file: ${input.path}`,

  async call(args) {
    try {
      const content = await readFile(args.path, 'utf-8')
      
      if (!content.includes(args.oldString)) {
        return {
          data: null,
          error: `Could not find "${args.oldString}" in ${args.path}`,
        }
      }
      
      const newContent = content.replace(args.oldString, args.newString)
      await writeFile(args.path, newContent, 'utf-8')
      
      return {
        data: {
          path: args.path,
          replaced: true,
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

export { FileEditTool }
