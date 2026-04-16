import { beforeEach, describe, expect, test } from 'bun:test'
import { createProjectKnowledgeStore } from '../../src/state/projectKnowledgeStore'
import { VerifyTool } from '../../src/tools/RefactorTools/VerifyTool/index'
import type { ToolUseContext } from '../../src/tools/Tool'

describe('VerifyTool', () => {
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

  test('name is VerifyTool', () => {
    expect(VerifyTool.name).toBe('VerifyTool')
  })

  test('check with no changes returns no deviation', async () => {
    const result = await VerifyTool.call(
      { action: 'check', constraints: ['Keep API stable'] },
      mockContext,
      async () => ({ behavior: 'allow' }),
      {} as any
    )
    expect(result.data.hasDeviation).toBe(false)
  })

  test('check detects API change', async () => {
    store.addChangeRecord({
      file: 'src/api.ts',
      before: 'export const API = v1',
      after: 'export const API = v2',
      timestamp: Date.now(),
    })

    const result = await VerifyTool.call(
      { action: 'check', constraints: ['Keep API stable'] },
      mockContext,
      async () => ({ behavior: 'allow' }),
      {} as any
    )
    expect(result.data.hasDeviation).toBe(true)
  })

  test('history returns change records', async () => {
    store.addChangeRecord({
      file: 'src/foo.ts',
      before: 'old',
      after: 'new',
      timestamp: Date.now(),
    })

    const result = await VerifyTool.call(
      { action: 'history' },
      mockContext,
      async () => ({ behavior: 'allow' }),
      {} as any
    )
    expect(result.data.history).toHaveLength(1)
  })
})