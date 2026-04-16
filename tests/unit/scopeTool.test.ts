import { describe, expect, test, beforeEach } from 'bun:test'
import { ScopeTool } from '../../src/tools/RefactorTools/ScopeTool/index'
import { createProjectKnowledgeStore } from '../../src/state/projectKnowledgeStore'
import type { ToolUseContext } from '../../src/tools/Tool'

describe('ScopeTool', () => {
  const store = createProjectKnowledgeStore()
  const mockContext: ToolUseContext = {
    options: { debug: false, tools: [], mcpClients: [] },
    abortController: new AbortController(),
    messages: [],
    projectStore: store,
  }

  beforeEach(() => {
    store.clearSession()
  })

  test('name is ScopeTool', () => {
    expect(ScopeTool.name).toBe('ScopeTool')
  })

  test('adds file to scope', async () => {
    const result = await ScopeTool.call(
      { action: 'add', file: 'src/kernel/foo.ts', reason: 'Core module' },
      mockContext,
      async () => ({ behavior: 'allow' }),
      {} as any
    )
    expect(result.data.added).toBe(true)
  })

  test('list returns scoped files', async () => {
    store.addToScope('file1.ts', 'reason1')
    store.addToScope('file2.ts', 'reason2')

    const result = await ScopeTool.call(
      { action: 'list' },
      mockContext,
      async () => ({ behavior: 'allow' }),
      {} as any
    )
    expect(result.data.files).toHaveLength(2)
  })

  test('clear resets scope', async () => {
    store.addToScope('file1.ts', 'reason1')
    const result = await ScopeTool.call(
      { action: 'clear' },
      mockContext,
      async () => ({ behavior: 'allow' }),
      {} as any
    )
    expect(result.data.cleared).toBe(true)
    expect(store.getSessionContext().files.size).toBe(0)
  })
})