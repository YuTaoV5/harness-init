import { describe, expect, test, beforeEach } from 'bun:test'
import { ScopeTool } from '../../src/tools/RefactorTools/ScopeTool/index.js'
import { createProjectKnowledgeStore } from '../../src/state/projectKnowledgeStore.js'
import type { ToolUseContext } from '../../src/tools/Tool.js'

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

  test('adds file to scope with reason', async () => {
    const result = await ScopeTool.call(
      { action: 'add', file: 'src/kernel/foo.ts', reason: 'Core module' },
      mockContext,
      async () => ({ behavior: 'allow' }),
      {} as any
    )
    expect(result.data.added).toBe(true)
    expect(store.getSessionContext().files.has('src/kernel/foo.ts')).toBe(true)
  })

  test('list returns all scoped files', async () => {
    store.addToScope('file1.ts', 'reason1')
    store.addToScope('file2.ts', 'reason2')

    const result = await ScopeTool.call(
      { action: 'list' },
      mockContext,
      async () => ({ behavior: 'allow' }),
      {} as any
    )
    expect(result.data.files).toHaveLength(2)
    expect(result.data.total).toBe(2)
  })

  test('updates file status', async () => {
    store.addToScope('test.ts', 'test')
    const result = await ScopeTool.call(
      { action: 'status', file: 'test.ts', status: 'done' },
      mockContext,
      async () => ({ behavior: 'allow' }),
      {} as any
    )
    expect(store.getSessionContext().files.get('test.ts')?.status).toBe('done')
  })

  test('removes file from scope', async () => {
    store.addToScope('test.ts', 'test')
    const result = await ScopeTool.call(
      { action: 'remove', file: 'test.ts' },
      mockContext,
      async () => ({ behavior: 'allow' }),
      {} as any
    )
    expect(result.data.removed).toBe(true)
    expect(store.getSessionContext().files.has('test.ts')).toBe(false)
  })

  test('clear resets scope', async () => {
    store.addToScope('file1.ts', 'reason1')
    store.addToScope('file2.ts', 'reason2')
    const result = await ScopeTool.call(
      { action: 'clear' },
      mockContext,
      async () => ({ behavior: 'allow' }),
      {} as any
    )
    expect(result.data.cleared).toBe(true)
    expect(store.getSessionContext().files.size).toBe(0)
  })

  test('add without file returns error', async () => {
    const result = await ScopeTool.call(
      { action: 'add' },
      mockContext,
      async () => ({ behavior: 'allow' }),
      {} as any
    )
    expect(result.error).toBe('File is required for add action')
  })
})