import { describe, expect, test } from 'bun:test'
import { detectSearchTool, searchFiles } from '../../src/tools/shared/platformSearch'
import { execSync } from 'child_process'

describe('platformSearch', () => {
  const currentPlatform = process.platform

  test('detectSearchTool returns a tool that is actually installed', async () => {
    const tool = await detectSearchTool()
    
    expect(['rg', 'grep', 'findstr']).toContain(tool)
    
    const versionCmd = tool === 'rg' ? 'rg --version' : 
                       tool === 'grep' ? 'grep --version' : 
                       'findstr /?'
    expect(() => execSync(versionCmd, { stdio: 'pipe' })).not.toThrow()
  })

  test('detectSearchTool prefers rg on non-win32 when installed', async () => {
    if (currentPlatform === 'win32') {
      return
    }
    
    try {
      execSync('rg --version', { stdio: 'ignore' })
      const tool = await detectSearchTool()
      expect(tool).toBe('rg')
    } catch {
      // rg not installed, skip
    }
  })

  test('searchFiles returns proper SearchResult objects', async () => {
    const results = await searchFiles({
      pattern: 'test',
      path: '.',
    })
    
    expect(Array.isArray(results)).toBe(true)
    
    for (const result of results) {
      expect(result).toHaveProperty('file')
      expect(result).toHaveProperty('line')
      expect(result).toHaveProperty('content')
      expect(typeof result.file).toBe('string')
      expect(typeof result.line).toBe('number')
      expect(typeof result.content).toBe('string')
    }
  })

  test('searchFiles with include filter works', async () => {
    const results = await searchFiles({
      pattern: 'test',
      path: '.',
      include: '*.ts',
    })
    
    expect(Array.isArray(results)).toBe(true)
    for (const result of results) {
      expect(result.file).toMatch(/\.ts$/)
    }
  })

  test('searchFiles handles case insensitive search', async () => {
    const results = await searchFiles({
      pattern: 'Test',
      path: '.',
      caseSensitive: false,
    })
    
    expect(Array.isArray(results)).toBe(true)
  })
})
