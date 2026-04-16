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

  test('collapseHistory creates summary with correct count', () => {
    const collapser = createContextCollapser({ maxRecords: 3 })

    const records: ChangeRecord[] = Array.from({ length: 5 }, (_, i) => ({
      file: `file${i}.ts`,
      before: 'old',
      after: 'new',
      timestamp: Date.now() - i * 1000,
    }))

    const collapsed = collapser.collapseHistory(records)
    const summary = collapsed[collapsed.length - 1]
    expect(summary.after).toContain('2 changes across 2 files')
  })

  test('generateSummary formats correctly with all fields', () => {
    const collapser = createContextCollapser({})

    const summary = collapser.generateSummary({
      filesProcessed: 15,
      constraints: ['Keep API stable', 'No breaking changes'],
      recentChanges: ['Changed foo.ts', 'Refactored bar.ts', 'Updated baz.ts', 'Fixed qux.ts'],
    })

    expect(summary).toContain('15 files')
    expect(summary).toContain('Keep API stable')
    expect(summary).toContain('Changed foo.ts')
    expect(summary).toContain('...and 1 more')
  })

  test('generateSummary handles empty constraints', () => {
    const collapser = createContextCollapser({})

    const summary = collapser.generateSummary({
      filesProcessed: 5,
      constraints: [],
      recentChanges: [],
    })

    expect(summary).toContain('5 files')
    expect(summary).not.toContain('Constraints')
  })

  test('generateSummary handles single constraint', () => {
    const collapser = createContextCollapser({})

    const summary = collapser.generateSummary({
      filesProcessed: 10,
      constraints: ['Keep API stable'],
      recentChanges: [],
    })

    expect(summary).toContain('Constraints: Keep API stable')
  })
})