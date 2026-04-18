import { describe, it, expect, beforeAll } from 'vitest'
import RAPIER from '@dimforge/rapier2d-compat'
import { buildCustomTable } from '../custom'
import { newBlankLayout } from '../../../editor/boilerplate'

let world: RAPIER.World

beforeAll(async () => {
  await RAPIER.init()
  world = new RAPIER.World({ x: 0, y: 0 })
})

describe('buildCustomTable', () => {
  it('builds the boilerplate layout with one body per element', () => {
    const layout = newBlankLayout()
    const t = buildCustomTable(world, layout)
    expect(t.bodies.length).toBe(layout.elements.length)
    expect(t.flipperLeft.kind).toBe('flipperLeft')
    expect(t.flipperRight.kind).toBe('flipperRight')
    expect(t.drain.kind).toBe('drain')
    expect(t.plungerVisual).toEqual(layout.plungerVisual)
  })

  it('throws when a required kind is missing', () => {
    const layout = newBlankLayout()
    layout.elements = layout.elements.filter((e) => e.kind !== 'drain')
    expect(() => buildCustomTable(world, layout)).toThrow(/drain/)
  })

  it('places bumpers and pegs as circles', () => {
    const layout = newBlankLayout()
    layout.elements.push({ id: 'b', kind: 'bumper', x: 200, y: 220, r: 24 })
    layout.elements.push({ id: 'p', kind: 'peg', x: 140, y: 500, r: 6 })
    const t = buildCustomTable(world, layout)
    const b = t.bodies.find((x) => x.id === 'b')!
    const p = t.bodies.find((x) => x.id === 'p')!
    expect(b.shape).toEqual({ type: 'circle', r: 24 })
    expect(p.shape).toEqual({ type: 'circle', r: 6 })
  })

  it('places polyline rails as one rect per segment', () => {
    const layout = newBlankLayout()
    layout.elements.push({
      id: 'rail',
      kind: 'arcRail',
      points: [{ x: 100, y: 100 }, { x: 200, y: 100 }, { x: 300, y: 200 }],
      thickness: 6,
    })
    const t = buildCustomTable(world, layout)
    const segs = t.bodies.filter((x) => x.id.startsWith('rail-'))
    expect(segs.length).toBe(2)
    expect(segs.every((s) => s.kind === 'arcRail')).toBe(true)
  })
})
