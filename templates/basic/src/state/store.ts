/**
 * Zustand-style State Store
 * Minimal implementation for harness projects
 */

type Listener = () => void

export type Store<T> = {
  getState: () => T
  setState: (updater: (prev: T) => T) => void
  subscribe: (listener: Listener) => () => void
}

export function createStore<T>(
  initialState: T,
  onChange?: (args: { newState: T; oldState: T }) => void
): Store<T> {
  let state = initialState
  const listeners = new Set<Listener>()

  return {
    getState: () => state,

    setState: (updater: (prev: T) => T) => {
      const prev = state
      const next = updater(prev)
      if (Object.is(next, prev)) return
      state = next
      onChange?.({ newState: next, oldState: prev })
      for (const listener of listeners) listener()
    },

    subscribe: (listener: Listener) => {
      listeners.add(listener)
      return () => listeners.delete(listener)
    },
  }
}

// App State interface
export interface AppState {
  messages: Message[]
  tools: Tool[]
  session: Session
  permissions: PermissionState
  isLoading: boolean
  error: string | null
}

export interface Message {
  id: string
  role: 'user' | 'assistant' | 'system'
  content: string
  timestamp: number
}

export interface Session {
  id: string
  model: string
  createdAt: number
}

export interface Tool {
  name: string
  description: string
}

export interface PermissionState {
  mode: 'default' | 'bypass' | 'ask'
  allowed: Set<string>
  denied: Set<string>
}

// Default state factory
export function createDefaultState(): AppState {
  return {
    messages: [],
    tools: [],
    session: {
      id: crypto.randomUUID(),
      model: 'claude-sonnet-4-20250514',
      createdAt: Date.now(),
    },
    permissions: {
      mode: 'default',
      allowed: new Set(),
      denied: new Set(),
    },
    isLoading: false,
    error: null,
  }
}

// Create the store
export const useStore = createStore<AppState>(createDefaultState())
