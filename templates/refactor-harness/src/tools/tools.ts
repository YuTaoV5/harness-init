/**
 * Tool Registry
 * Assembles all available tools with conditional loading
 */

import { feature } from 'bun:bundle'
import { buildTool, type Tool } from './Tool.js'

// Import built-in tools
import { BashTool } from './BashTool/index.js'
import { FileReadTool } from './FileReadTool/index.js'
import { FileWriteTool } from './FileWriteTool/index.js'
import { FileEditTool } from './FileEditTool/index.js'
import { GrepTool } from './GrepTool/index.js'
import { GlobTool } from './GlobTool/index.js'
import { WebFetchTool } from './WebFetchTool/index.js'

// Import Refactor tools
import { ScopeTool } from './RefactorTools/ScopeTool/index.js'
import { VerifyTool } from './RefactorTools/VerifyTool/index.js'

export { type Tool, type Tools } from './Tool.js'

// Get all enabled tools
export function getAllTools(): Tool[] {
  const tools: Tool[] = [
    // Core tools - always enabled
    BashTool,
    FileReadTool,
    FileWriteTool,
    FileEditTool,
    GrepTool,
    GlobTool,
    WebFetchTool,

    // Refactor tools
    ScopeTool,
    VerifyTool,
  ]

  // Feature-gated tools
  if (feature('AGENT_TRIGGERS_REMOTE')) {
    // Add remote trigger tool
  }

  if (feature('MONITOR_TOOL')) {
    // Add monitor tool
  }

  if (feature('KAIROS')) {
    // Add Kairos-specific tools
  }

  return tools
}

// Get tool by name
export function getToolByName(name: string): Tool | undefined {
  const tools = getAllTools()
  return tools.find(t => t.name === name || t.aliases?.includes(name))
}

// Check if tool is enabled
export function isToolEnabled(name: string): boolean {
  const tool = getToolByName(name)
  return tool?.isEnabled?.() ?? false
}
