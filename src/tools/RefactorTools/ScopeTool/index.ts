import { z } from 'zod'
import { buildTool, type ToolUseContext } from '../../Tool.js'
import { createProjectKnowledgeStore } from '../../../state/projectKnowledgeStore.js'

const ScopeToolInput = z.object({
  action: z.enum(['add', 'remove', 'list', 'status', 'clear']),
  file: z.string().optional(),
  reason: z.string().optional(),
  status: z.enum(['pending', 'done', 'failed']).optional(),
})

type ScopeAction = z.infer<typeof ScopeToolInput>

export const ScopeTool = buildTool({
  name: 'ScopeTool',
  aliases: ['scope', 'refactor_scope'],
  inputSchema: ScopeToolInput,

  description: async (input: ScopeAction) => {
    switch (input.action) {
      case 'add':
        return `Add "${input.file}" to refactor scope${input.reason ? ` (reason: ${input.reason})` : ''}`
      case 'remove':
        return `Remove "${input.file}" from refactor scope`
      case 'list':
        return 'List all files in refactor scope'
      case 'status':
        return `Update status of "${input.file}" to "${input.status}"`
      case 'clear':
        return 'Clear entire refactor scope'
      default:
        return 'Manage refactor scope'
    }
  },

  async call(args: ScopeAction, context: ToolUseContext) {
    let store = context.projectStore as ReturnType<typeof createProjectKnowledgeStore> | undefined
    if (!store) {
      store = createProjectKnowledgeStore()
      context.projectStore = store
    }

    switch (args.action) {
      case 'add': {
        if (!args.file) {
          return { data: null, error: 'File is required for add action' }
        }
        store.addToScope(args.file, args.reason ?? 'No reason provided')
        return { data: { added: true, file: args.file } }
      }

      case 'remove': {
        if (!args.file) {
          return { data: null, error: 'File is required for remove action' }
        }
        const files = store.getSessionContext().files
        const existed = files.delete(args.file)
        return { data: { removed: existed, file: args.file } }
      }

      case 'list': {
        const files = Array.from(store.getSessionContext().files.entries())
        return {
          data: {
            files: files.map(([path, entry]) => ({ path, ...entry })),
            total: files.length,
          },
        }
      }

      case 'status': {
        if (!args.file || !args.status) {
          return { data: null, error: 'File and status are required' }
        }
        store.updateFileStatus(args.file, args.status)
        return { data: { updated: true, file: args.file, status: args.status } }
      }

      case 'clear': {
        store.clearSession()
        return { data: { cleared: true } }
      }

      default:
        return { data: null, error: 'Unknown action' }
    }
  },

  isReadOnly: (input: ScopeAction) => {
    return input.action === 'list' || input.action === 'clear'
  },
})

export { ScopeToolInput }