import { describe, it, expect } from 'vitest'
import { snapToGrid, snapPoint } from '../snap'

describe('snapToGrid', () => {
  it('rounds to nearest grid step', () => {
    expect(snapToGrid(13, 10)).toBe(10)
    expect(snapToGrid(16, 10)).toBe(20)
    expect(snapToGrid(0, 10)).toBe(0)
  })

  it('returns the raw value when force=true', () => {
    expect(snapToGrid(13, 10, true)).toBe(13)
  })

  it('uses default grid size of 10', () => {
    expect(snapToGrid(17)).toBe(20)
  })
})

describe('snapPoint', () => {
  it('snaps both axes', () => {
    expect(snapPoint({ x: 13, y: 27 }, 10)).toEqual({ x: 10, y: 30 })
  })
})
