/**
 * FileWriteTool - Write content to files
 */

import { z } from 'zod'
import { buildTool } from '../Tool.js'
import { writeFile } from 'fs/promises'
import { mkdir } from 'fs/promises'

export const FileWriteToolInput = z.object({
  path: z.string().describe('Path to write to'),
  content: z.string().describe('Content to write'),
  createDirs: z.boolean().optional().describe('Create parent directories if they dont exist'),
})

const FileWriteTool = buildTool({
  name: 'Write',
  aliases: ['file_write'],
  inputSchema: FileWriteToolInput,

  description: async (input) => `Write to file: ${input.path}`,

  async call(args) {
    try {
      if (args.createDirs) {
        const dir = args.path.split('/').slice(0, -1).join('/')
        if (dir) await mkdir(dir, { recursive: true })
      }
      
      await writeFile(args.path, args.content, 'utf-8')
      
      return {
        data: {
          path: args.path,
          bytes: Buffer.byteLength(args.content, 'utf-8'),
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

export { FileWriteTool }
