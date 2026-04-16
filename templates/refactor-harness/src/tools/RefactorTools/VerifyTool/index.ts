import { z } from 'zod'
import { buildTool, type ToolUseContext } from '../../Tool.js'
import { createProjectKnowledgeStore } from '../../../state/projectKnowledgeStore.js'

const VerifyToolInput = z.object({
  action: z.enum(['check', 'report', 'history']),
  constraints: z.array(z.string()).optional(),
})

type VerifyAction = z.infer<typeof VerifyToolInput>

interface Deviation {
  type: 'api_change' | 'breaking_change' | 'constraint_violation'
  file: string
  description: string
  severity: 'high' | 'medium' | 'low'
}

interface VerifyResult {
  hasDeviation: boolean
  deviations: Deviation[]
  summary: string
  checkedAt: number
}

declare module '../../Tool.js' {
  interface ToolUseContext {
    projectStore?: ReturnType<typeof createProjectKnowledgeStore>
  }
}

export const VerifyTool = buildTool({
  name: 'VerifyTool',
  aliases: ['verify', 'refactor_verify'],
  inputSchema: VerifyToolInput,

  description: async (input: VerifyAction) => {
    switch (input.action) {
      case 'check':
        return 'Verify refactoring against constraints'
      case 'report':
        return 'Generate deviation report'
      case 'history':
        return 'View change history'
      default:
        return 'Verify refactoring correctness'
    }
  },

  async call(args: VerifyAction, context: ToolUseContext) {
    const store = context.projectStore

    switch (args.action) {
      case 'check': {
        if (!store) {
          return { data: { hasDeviation: false, deviations: [], summary: 'No project store' } }
        }

        const constraints = args.constraints ?? store.getSessionContext().constraints
        const history = store.getSessionContext().history
        const deviations: Deviation[] = []

        for (const change of history) {
          if (change.file.includes('api') || change.file.includes('types')) {
            if (change.before.includes('export') && !change.after.includes(change.before.split('=')[1]?.trim())) {
              deviations.push({
                type: 'api_change',
                file: change.file,
                description: 'API signature changed',
                severity: 'high',
              })
            }
          }

          if (change.after.includes('BREAKING') || change.after.includes('breaking')) {
            deviations.push({
              type: 'breaking_change',
              file: change.file,
              description: 'Potential breaking change detected',
              severity: 'high',
            })
          }
        }

        for (const constraint of constraints) {
          if (constraint.toLowerCase().includes('api stable')) {
            const hasApiChange = deviations.some(d => d.type === 'api_change')
            if (hasApiChange) {
              deviations.push({
                type: 'constraint_violation',
                file: '[global]',
                description: `Constraint violated: "${constraint}"`,
                severity: 'high',
              })
            }
          }
        }

        const result: VerifyResult = {
          hasDeviation: deviations.length > 0,
          deviations,
          summary: deviations.length === 0
            ? 'No deviations detected'
            : `Found ${deviations.length} potential deviation(s)`,
          checkedAt: Date.now(),
        }

        return { data: result }
      }

      case 'report': {
        if (!store) {
          return { data: { summary: 'No project store' } }
        }
        const ctx = store.getSessionContext()
        return {
          data: {
            filesProcessed: ctx.files.size,
            constraints: ctx.constraints,
            changesCount: ctx.history.length,
            deviationsCount: 0,
          },
        }
      }

      case 'history': {
        if (!store) {
          return { data: { history: [] } }
        }
        return { data: { history: store.getSessionContext().history } }
      }

      default:
        return { data: null, error: 'Unknown action' }
    }
  },

  isReadOnly: () => true,
})

export { VerifyToolInput }