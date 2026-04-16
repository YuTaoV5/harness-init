export type SearchTool = 'rg' | 'grep' | 'findstr'

interface SearchResult {
  file: string
  line: number
  content: string
}

interface SearchOptions {
  pattern: string
  path?: string
  include?: string
  recursive?: boolean
  caseSensitive?: boolean
}

const TOOL_PRIORITY: SearchTool[] = ['rg', 'grep', 'findstr']

export async function detectSearchTool(): Promise<SearchTool> {
  const platform = process.platform
  
  if (platform === 'win32') {
    for (const tool of TOOL_PRIORITY) {
      try {
        const { execSync } = await import('child_process')
        execSync(`${tool} --version`, { stdio: 'ignore' })
        return tool
      } catch {
        continue
      }
    }
    return 'findstr'
  }
  
  try {
    const { execSync } = await import('child_process')
    execSync('rg --version', { stdio: 'ignore' })
    return 'rg'
  } catch {
    return 'grep'
  }
}

export async function searchFiles(options: SearchOptions): Promise<SearchResult[]> {
  const tool = await detectSearchTool()
  const { pattern, path = '.', include, recursive = true } = options
  
  const args = buildSearchArgs(tool, pattern, { include, recursive, caseSensitive: options.caseSensitive })
  
  const { execSync } = await import('child_process')
  
  try {
    const output = execSync(`${tool} ${args.join(' ')}`, { cwd: path, encoding: 'utf-8' })
    return parseSearchOutput(output, tool)
  } catch {
    return fallbackGrep(options)
  }
}

function buildSearchArgs(tool: SearchTool, pattern: string, options: { include?: string; recursive?: boolean; caseSensitive?: boolean }): string[] {
  const args: string[] = ['-n']
  
  if (options.caseSensitive === false) {
    args.push('-i')
  }
  
  if (options.include) {
    switch (tool) {
      case 'rg':
        args.push('-g', options.include)
        break
      case 'grep':
        args.push('--include=' + options.include)
        break
      case 'findstr':
        args.push(options.include)
        break
    }
  }
  
  args.push(pattern)
  args.push(options.recursive === false ? '' : '*')
  
  return args.filter(Boolean)
}

function parseSearchOutput(output: string, tool: SearchTool): SearchResult[] {
  const results: SearchResult[] = []
  const lines = output.split('\n').filter(Boolean)
  
  for (const line of lines) {
    const match = line.match(/^(.+?):(\d+):(.+)$/)
    if (match) {
      results.push({
        file: match[1],
        line: parseInt(match[2], 10),
        content: match[3].trim(),
      })
    }
  }
  
  return results
}

async function fallbackGrep(options: SearchOptions): Promise<SearchResult[]> {
  const { glob } = await import('glob')
  const { readFile } = await import('fs/promises')
  
  const { pattern, path = '.', include, recursive = true } = options
  const results: SearchResult[] = []
  
  const globPattern = include
    ? recursive ? `**/${include}` : include
    : recursive ? '**/*' : '*'
  
  const files = await glob(globPattern, { cwd: path, absolute: true })
  const regex = new RegExp(pattern, options.caseSensitive ? 'g' : 'gi')
  
  for (const file of files) {
    try {
      const content = await readFile(file, 'utf-8')
      const lines = content.split('\n')
      
      for (let i = 0; i < lines.length; i++) {
        if (regex.test(lines[i])) {
          results.push({
            file,
            line: i + 1,
            content: lines[i].trim(),
          })
        }
      }
    } catch {
      // Skip binary or unreadable files
    }
  }
  
  return results
}
