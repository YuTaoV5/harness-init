export interface ChangeRecord {
  file: string
  before: string
  after: string
  timestamp: number
  verified?: boolean
}

export interface FileEntry {
  addedAt: number
  reason: string
  status: 'pending' | 'done' | 'failed'
}

export interface RefactorScope {
  files: Map<string, FileEntry>
  constraints: string[]
  history: ChangeRecord[]
}

export interface ProjectKnowledgeStore {
  addFact(key: string, value: string): void
  getFact(key: string): string | undefined
  getAllFacts(): Record<string, string>
  getSessionContext(): RefactorScope
  addToScope(file: string, reason: string): void
  updateFileStatus(file: string, status: FileEntry['status']): void
  updateConstraints(constraints: string[]): void
  addChangeRecord(record: ChangeRecord): void
  clearSession(): void
  getContextUsage(): { used: number; limit: number; percent: number }
  isNearLimit(): boolean
}

const CONTEXT_LIMIT = 100

export function createProjectKnowledgeStore(): ProjectKnowledgeStore {
  const facts = new Map<string, string>()
  const scope: RefactorScope = {
    files: new Map(),
    constraints: [],
    history: [],
  }

  return {
    addFact(key: string, value: string) {
      facts.set(key, value)
    },

    getFact(key: string): string | undefined {
      return facts.get(key)
    },

    getAllFacts(): Record<string, string> {
      return Object.fromEntries(facts)
    },

    getSessionContext(): RefactorScope {
      return scope
    },

    addToScope(file: string, reason: string) {
      scope.files.set(file, {
        addedAt: Date.now(),
        reason,
        status: 'pending',
      })
    },

    updateFileStatus(file: string, status: FileEntry['status']) {
      const entry = scope.files.get(file)
      if (entry) {
        entry.status = status
      }
    },

    updateConstraints(constraints: string[]) {
      scope.constraints = constraints
    },

    addChangeRecord(record: ChangeRecord) {
      scope.history.push(record)
    },

    clearSession() {
      scope.files.clear()
      scope.constraints = []
      scope.history = []
    },

    getContextUsage() {
      const used = scope.files.size + scope.history.length + scope.constraints.length
      return {
        used,
        limit: CONTEXT_LIMIT,
        percent: Math.round((used / CONTEXT_LIMIT) * 100),
      }
    },

    isNearLimit() {
      return this.getContextUsage().percent >= 80
    },
  }
}