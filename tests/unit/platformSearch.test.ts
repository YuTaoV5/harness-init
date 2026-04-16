import { describe, expect, test } from 'bun:test'
import { detectSearchTool, searchFiles } from '../../src/tools/shared/platformSearch'

describe('platformSearch', () => {
  test('detectSearchTool returns valid tool', async () => {
    const tool = await detectSearchTool()
    expect(['rg', 'grep', 'findstr']).toContain(tool)
  })

  test('searchFiles returns array', async () => {
    const results = await searchFiles({ pattern: 'test', path: '.' })
    expect(Array.isArray(results)).toBe(true)
  })
})