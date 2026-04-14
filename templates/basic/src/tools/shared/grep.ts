/**
 * Shared grep utility
 */

interface GrepOptions {
  pattern: string
  path?: string
  include?: string
  recursive?: boolean
  caseSensitive?: boolean
}

interface GrepResult {
  file: string
  line: number
  content: string
}

export async function grep(options: GrepOptions): Promise<GrepResult[]> {
  const {
    pattern,
    path = '.',
    include,
    recursive = true,
    caseSensitive = false,
  } = options

  const { glob } = await import('glob')
  const { readFile } = await import('fs/promises')
  
  const results: GrepResult[] = []
  
  // Find files
  const globPattern = include 
    ? recursive ? `**/${include}` : include
    : recursive ? '**/*' : '*'
  
  const files = await glob(globPattern, { cwd: path, absolute: true })
  
  const regex = new RegExp(pattern, caseSensitive ? 'g' : 'gi')
  
  for (const file of files) {
    try {
      const content = await readFile(file, 'utf-8')
      const lines = content.split('\n')
      
      for (let i = 0; i < lines.length; i++) {
        const line = lines[i]
        if (regex.test(line)) {
          results.push({
            file,
            line: i + 1,
            content: line.trim(),
          })
        }
      }
    } catch {
      // Skip binary or unreadable files
    }
  }
  
  return results
}
