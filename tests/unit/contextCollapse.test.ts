import { describe, expect, test } from 'bun:test'
import { createContextCollapser } from '../../src/memory/contextCollapse'
import type { ChangeRecord } from '../../src/state/projectKnowledgeStore'

describe('ContextCollapse', () => {
  test('collapseHistory returns unchanged records under limit', () => {
    const collapser = createContextCollapser({ maxRecords: 10 })

    const records: ChangeRecord[] = Array.from({ length: 5 }, (_, i) => ({
      file: `file${i}.ts`,
      before: 'old',
      after: 'new',
      timestamp: Date.now() - i * 1000,
    }))

    const collapsed = collapser.collapseHistory(records)
    expect(collapsed.length).toBe(5)
  })

  test('collapseHistory reduces records over limit', () => {
    const collapser = createContextCollapser({ maxRecords: 5 })

    const records: ChangeRecord[] = Array.from({ length: 10 }, (_, i) => ({
      file: `file${i}.ts`,
      before: 'old',
      after: 'new',
      timestamp: Date.now() - i * 1000,
    }))

    const collapsed = collapser.collapseHistory(records)
    expect(collapsed.length).toBeLessThanOrEqual(6)
    expect(collapsed[collapsed.length - 1].file).toBe('[collapsed]')
  })

  test('generateSummary formats correctly', () => {
    const collapser = createContextCollapser({})

    const summary = collapser.generateSummary({
      filesProcessed: 15,
      constraints: ['Keep API stable'],
      recentChanges: ['Changed foo.ts', 'Refactored bar.ts'],
    })

    expect(summary).toContain('15 files')
    expect(summary).toContain('Keep API stable')
  })
})