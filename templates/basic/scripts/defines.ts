/**
 * MACRO defines for dev and build
 * Centralized version and build constants
 */

interface MacroDefine {
  [key: string]: string
}

export function getMacroDefines(): MacroDefine {
  return {
    'MACRO.VERSION': JSON.stringify('{{VERSION}}'),
    'MACRO.BUILD_TIME': JSON.stringify(new Date().toISOString()),
    'MACRO.PROJECT_NAME': JSON.stringify('{{PROJECT_NAME}}'),
  }
}
