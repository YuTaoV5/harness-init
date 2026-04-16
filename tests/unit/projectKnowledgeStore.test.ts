import { describe, expect, test, beforeEach } from 'bun:test'
import { createProjectKnowledgeStore } from '../../src/state/projectKnowledgeStore'

describe('ProjectKnowledgeStore', () => {
  let store: ReturnType<typeof createProjectKnowledgeStore>

  beforeEach(() => {
    store = createProjectKnowledgeStore()
  })

  test('addFact and getFact work', () => {
    store.addFact('requirement', 'Extract kernel module X')
    expect(store.getFact('requirement')).toBe('Extract kernel module X')
  })

  test('getFact returns undefined for unknown key', () => {
    expect(store.getFact('unknown')).toBeUndefined()
  })

  test('addToScope adds file with reason', () => {
    store.addToScope('src/kernel/foo.ts', 'Core module')
    const context = store.getSessionContext()
    expect(context.files.has('src/kernel/foo.ts')).toBe(true)
  })

  test('updateConstraints sets constraints array', () => {
    store.updateConstraints(['Keep API stable', 'No breaking changes'])
    const context = store.getSessionContext()
    expect(context.constraints).toEqual(['Keep API stable', 'No breaking changes'])
  })

  test('addChangeRecord tracks history', () => {
    store.addChangeRecord({
      file: 'src/foo.ts',
      before: 'original',
      after: 'modified',
      timestamp: Date.now(),
    })
    expect(store.getSessionContext().history).toHaveLength(1)
  })

  test('clearSession resets session context but keeps facts', () => {
    store.addFact('project', 'kernel-v2')
    store.addToScope('src/foo.ts', 'test')
    store.clearSession()
    expect(store.getFact('project')).toBe('kernel-v2')
    expect(store.getSessionContext().files.size).toBe(0)
  })

  test('isNearLimit returns false when under 80%', () => {
    expect(store.isNearLimit()).toBe(false)
  })

  test('isNearLimit returns true when over 80%', () => {
    for (let i = 0; i < 81; i++) {
      store.addChangeRecord({ file: `file${i}.ts`, before: 'x', after: 'y', timestamp: Date.now() })
    }
    expect(store.isNearLimit()).toBe(true)
  })
})