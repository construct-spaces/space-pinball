import { describe, it, expect } from 'vitest'
import { newBlankLayout } from '../boilerplate'

describe('newBlankLayout', () => {
  it('returns a layout with a name, fresh id, and standard dimensions', () => {
    const l = newBlankLayout()
    expect(l.name).toBe('Untitled')
    expect(l.width).toBe(600)
    expect(l.height).toBe(900)
    expect(l.id).toMatch(/^[0-9a-f-]+$/i)
  })

  it('preloads outer walls, drain, and both flippers', () => {
    const l = newBlankLayout()
    const kinds = l.elements.map((e) => e.kind)
    expect(kinds.filter((k) => k === 'wall').length).toBeGreaterThanOrEqual(3)
    expect(kinds).toContain('drain')
    expect(kinds).toContain('flipperLeft')
    expect(kinds).toContain('flipperRight')
  })

  it('sets ballStart and plungerVisual to lane defaults', () => {
    const l = newBlankLayout()
    expect(l.ballStart).toEqual({ x: 550, y: 820 })
    expect(l.plungerVisual).toEqual({ x: 550, y: 880, w: 28, h: 14 })
  })
})
