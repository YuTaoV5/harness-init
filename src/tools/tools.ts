import { ScopeTool } from "./RefactorTools/ScopeTool/index.js";
import { VerifyTool } from "./RefactorTools/VerifyTool/index.js";
import type { Tool } from "./Tool.js";

export type { Tool, Tools } from "./Tool.js";

export function getAllTools(): Tool[] {
  return [ScopeTool, VerifyTool];
}

export function getToolByName(name: string): Tool | undefined {
  const tools = getAllTools();
  return tools.find((t) => t.name === name || t.aliases?.includes(name));
}

export function isToolEnabled(name: string): boolean {
  const tool = getToolByName(name);
  return tool?.isEnabled?.() ?? false;
}
