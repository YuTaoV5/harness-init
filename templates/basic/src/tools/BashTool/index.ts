/**
 * BashTool - Execute shell commands
 */

import { z } from 'zod'
import { buildTool } from '../Tool.js'

export const BashToolInput = z.object({
  command: z.string().describe('The shell command to execute'),
  cwd: z.string().optional().describe('Working directory'),
  timeout: z.number().optional().describe('Timeout in milliseconds'),
  description: z.string().optional().describe('Description of what this command does'),
})

const BashTool = buildTool({
  name: 'Bash',
  inputSchema: BashToolInput,
  
  description: async (input) => {
    const desc = input.description || input.command
    return `Execute shell command: ${desc}`
  },

  async call(args, context) {
    const result = await execCommand(args.command, {
      cwd: args.cwd || process.cwd(),
      timeout: args.timeout,
    })
    
    return {
      data: {
        stdout: result.stdout,
        stderr: result.stderr,
        exitCode: result.exitCode,
      },
    }
  },

  isReadOnly: (input) => {
    const cmd = input.command.trim().toLowerCase()
    // Common read-only commands
    const readOnlyCommands = [
      'ls', 'cat', 'head', 'tail', 'grep', 'find', 'which', 'whoami',
      'pwd', 'echo', 'printenv', 'git status', 'git log', 'git diff',
    ]
    return readOnlyCommands.some(c => cmd.startsWith(c))
  },
})

async function execCommand(
  command: string,
  options: { cwd?: string; timeout?: number }
): Promise<{ stdout: string; stderr: string; exitCode: number }> {
  return new Promise((resolve) => {
    const proc = Bun.spawn(command, {
      shell: true,
      cwd: options.cwd,
      timeout: options.timeout,
      stdout: 'pipe',
      stderr: 'pipe',
    })
    
    let stdout = ''
    let stderr = ''
    
    proc.stdout?.text().then((v) => { stdout = v })
    proc.stderr?.text().then((v) => { stderr = v })
    
    proc.then((p) => {
      resolve({ stdout, stderr, exitCode: p.exitCode ?? 0 })
    }).catch((err) => {
      resolve({ stdout, stderr: String(err), exitCode: 1 })
    })
  })
}

export { BashTool }
