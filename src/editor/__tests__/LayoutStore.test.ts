import { describe, it, expect, beforeEach } from 'vitest'
import { LayoutStore } from '../LayoutStore'
import { newBlankLayout } from '../boilerplate'

class MemStorage {
  store = new Map<string, string>()
  getItem(k: string): string | null { return this.store.get(k) ?? null }
  setItem(k: string, v: string): void { this.store.set(k, v) }
  removeItem(k: string): void { this.store.delete(k) }
}

let storage: MemStorage
let s: LayoutStore

beforeEach(() => {
  storage = new MemStorage()
  s = new LayoutStore(storage as unknown as Storage)
})

describe('LayoutStore', () => {
  it('starts with empty list', () => {
    expect(s.list()).toEqual([])
  })

  it('save then get round-trips a layout', () => {
    const l = newBlankLayout()
    s.save(l)
    expect(s.get(l.id)?.id).toBe(l.id)
  })

  it('save then list shows the layout', () => {
    const l = newBlankLayout()
    s.save(l)
    expect(s.list().map((x) => x.id)).toEqual([l.id])
  })

  it('remove drops the layout', () => {
    const l = newBlankLayout()
    s.save(l)
    s.remove(l.id)
    expect(s.get(l.id)).toBeUndefined()
  })

  it('duplicate creates a fresh id with " copy" suffix', () => {
    const l = newBlankLayout()
    s.save(l)
    const dup = s.duplicate(l.id)
    expect(dup.id).not.toBe(l.id)
    expect(dup.name).toBe(l.name + ' copy')
    expect(s.list().length).toBe(2)
  })

  it('saveDraft writes to the reserved __draft__ slot', () => {
    const l = newBlankLayout()
    s.saveDraft(l)
    expect(s.get('__draft__')?.elements.length).toBe(l.elements.length)
  })
})
