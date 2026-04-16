import { describe, expect, test, beforeEach } from 'bun:test'
import { VerifyTool } from '../../src/tools/RefactorTools/VerifyTool/index.js'
import { createProjectKnowledgeStore } from '../../src/state/projectKnowledgeStore.js'
import type { ToolUseContext } from '../../src/tools/Tool.js'

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
    store.updateConstraints(['Keep API stable'])

    const result = await VerifyTool.call(
      { action: 'check', constraints: ['Keep API stable'] },
      mockContext,
      async () => ({ behavior: 'allow' }),
      {} as any
    )

    expect(result.data.hasDeviation).toBe(false)
    expect(result.data.deviations).toHaveLength(0)
  })

  test('check detects API change in types files', async () => {
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
    expect(result.data.deviations.length).toBeGreaterThan(0)
  })

  test('check detects breaking change', async () => {
    store.addChangeRecord({
      file: 'src/lib.ts',
      before: 'function helper() {}',
      after: 'function helper() { throw new Error("BREAKING") }',
      timestamp: Date.now(),
    })

    const result = await VerifyTool.call(
      { action: 'check' },
      mockContext,
      async () => ({ behavior: 'allow' }),
      {} as any
    )

    expect(result.data.hasDeviation).toBe(true)
    expect(result.data.deviations.some((d: any) => d.type === 'breaking_change')).toBe(true)
  })

  test('report returns summary', async () => {
    store.addChangeRecord({
      file: 'src/foo.ts',
      before: 'old',
      after: 'new',
      timestamp: Date.now(),
    })
    store.updateConstraints(['constraint1'])

    const result = await VerifyTool.call(
      { action: 'report' },
      mockContext,
      async () => ({ behavior: 'allow' }),
      {} as any
    )

    expect(result.data.filesProcessed).toBe(0)
    expect(result.data.changesCount).toBe(1)
    expect(result.data.constraints).toEqual(['constraint1'])
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
    expect(result.data.history[0].file).toBe('src/foo.ts')
  })

  test('check without store returns no deviation', async () => {
    const contextWithoutStore: ToolUseContext = {
      options: { debug: false, tools: [], mcpClients: [] },
      abortController: new AbortController(),
      messages: [],
    }

    const result = await VerifyTool.call(
      { action: 'check' },
      contextWithoutStore,
      async () => ({ behavior: 'allow' }),
      {} as any
    )

    expect(result.data.hasDeviation).toBe(false)
    expect(result.data.summary).toBe('No project store')
  })
})