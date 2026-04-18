import { describe, it, expect } from 'vitest'
import { History } from '../History'

describe('History', () => {
  it('returns undefined when undo with no entries', () => {
    const h = new History<string>(10)
    expect(h.undo()).toBeUndefined()
    expect(h.redo()).toBeUndefined()
  })

  it('undoes the most recent push to the previous state', () => {
    const h = new History<string>(10)
    h.push('a')
    h.push('b')
    expect(h.undo()).toBe('a')
  })

  it('redoes after undo', () => {
    const h = new History<string>(10)
    h.push('a')
    h.push('b')
    h.undo()
    expect(h.redo()).toBe('b')
  })

  it('truncates redo stack when a new push happens after undo', () => {
    const h = new History<string>(10)
    h.push('a')
    h.push('b')
    h.undo()
    h.push('c')
    expect(h.redo()).toBeUndefined()
    expect(h.undo()).toBe('a')
  })

  it('caps stack size and drops oldest entries', () => {
    const h = new History<number>(3)
    for (let i = 1; i <= 5; i++) h.push(i)
    expect(h.undo()).toBe(4)
    expect(h.undo()).toBe(3)
    expect(h.undo()).toBeUndefined()
  })
})
