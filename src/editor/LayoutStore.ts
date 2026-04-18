import type { Layout } from './types'

const KEY = 'pinball.layouts.v1'
const DRAFT_ID = '__draft__'

interface Container {
  version: 1
  drafts: Record<string, Layout>
  currentId?: string
}

function emptyContainer(): Container {
  return { version: 1, drafts: {} }
}

class MemoryStorage implements Storage {
  private store = new Map<string, string>()
  get length() { return this.store.size }
  getItem(k: string): string | null { return this.store.get(k) ?? null }
  setItem(k: string, v: string): void { this.store.set(k, v) }
  removeItem(k: string): void { this.store.delete(k) }
  clear(): void { this.store.clear() }
  key(i: number): string | null { return [...this.store.keys()][i] ?? null }
}

function getStorage(): Storage {
  const ls = globalThis.localStorage
  if (ls && typeof ls.getItem === 'function') return ls
  return new MemoryStorage()
}

export class LayoutStore {
  constructor(private storage: Storage = getStorage()) {}

  private read(): Container {
    const raw = this.storage.getItem(KEY)
    if (!raw) return emptyContainer()
    try {
      const parsed = JSON.parse(raw) as Container
      if (parsed.version !== 1 || !parsed.drafts) return emptyContainer()
      return parsed
    } catch {
      return emptyContainer()
    }
  }

  private write(c: Container): void {
    this.storage.setItem(KEY, JSON.stringify(c))
  }

  list(): Layout[] {
    const c = this.read()
    return Object.values(c.drafts)
      .filter((l) => l.id !== DRAFT_ID)
      .sort((a, b) => b.updatedAt - a.updatedAt)
  }

  get(id: string): Layout | undefined {
    return this.read().drafts[id]
  }

  save(layout: Layout): void {
    const c = this.read()
    c.drafts[layout.id] = { ...layout, updatedAt: Date.now() }
    c.currentId = layout.id
    this.write(c)
  }

  saveDraft(layout: Layout): void {
    const c = this.read()
    c.drafts[DRAFT_ID] = { ...layout, id: DRAFT_ID, updatedAt: Date.now() }
    this.write(c)
  }

  remove(id: string): void {
    const c = this.read()
    delete c.drafts[id]
    if (c.currentId === id) c.currentId = undefined
    this.write(c)
  }

  duplicate(id: string): Layout {
    const orig = this.get(id)
    if (!orig) throw new Error(`layout not found: ${id}`)
    const dup: Layout = {
      ...(JSON.parse(JSON.stringify(orig)) as Layout),
      id: crypto.randomUUID(),
      name: orig.name + ' copy',
      createdAt: Date.now(),
      updatedAt: Date.now(),
      publishedId: undefined,
    }
    this.save(dup)
    return dup
  }
}
