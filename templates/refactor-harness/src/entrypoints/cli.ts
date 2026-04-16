import { getAllTools } from '../tools/tools.js'
import { createProjectKnowledgeStore } from '../state/projectKnowledgeStore.js'
import { createContextCollapser } from '../memory/contextCollapse.js'

interface RefactorOptions {
  constraints: string[]
  projectRoot: string
}

export async function startRefactorMode(options: Partial<RefactorOptions> = {}) {
  const store = createProjectKnowledgeStore()
  const collapser = createContextCollapser()

  if (options.constraints?.length) {
    store.updateConstraints(options.constraints)
    store.addFact('initialized', new Date().toISOString())
  }

  const tools = getAllTools()

  console.log('🔧 Refactor Harness started')
  console.log(`   Project root: ${options.projectRoot ?? process.cwd()}`)
  console.log(`   Tools available: ${tools.length}`)
  console.log(`   Constraints: ${store.getSessionContext().constraints.join(', ') || 'none'}`)

  return {
    store,
    collapser,
    tools,
  }
}

if (import.meta.main) {
  const args = process.argv.slice(2)
  const constraints = args.filter(a => a.startsWith('--constraint=')).map(a => a.split('=')[1])
  const projectRoot = args.find(a => a.startsWith('--root='))?.split('=')[1] ?? process.cwd()

  startRefactorMode({ constraints, projectRoot })
}