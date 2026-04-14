/**
 * Global Type Declarations
 */

// MACRO defines (injected at build/dev time)
declare const MACRO: {
  VERSION: string
  BUILD_TIME: string
  PROJECT_NAME: string
}

// Feature flag function (from bun:bundle)
declare function feature(flag: string): boolean

// Bun types
declare module 'bun' {
  export function spawn(command: string | URL, options?: SpawnOptions): ChildProcess
  export interface ChildProcess {
    stdout: ReadableStream<string> | null
    stderr: ReadableStream<string> | null
    then<TResult>(onfulfilled: (value: ChildProcess) => TResult): Promise<TResult>
    catch<TResult>(onrejected: (reason: unknown) => TResult): Promise<TResult>
    exitCode: number | null
  }
}

// Re-exports
export type { Message } from '../state/store.js'
export type { Tool, Tools, ToolResult } from '../tools/Tool.js'
