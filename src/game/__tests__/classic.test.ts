import { describe, it, expect, beforeAll } from 'vitest'
import RAPIER from '@dimforge/rapier2d-compat'
import { buildClassicTable } from '../tables/classic'
import { PLAYFIELD_HEIGHT } from '../constants'

let world: RAPIER.World

beforeAll(async () => {
  await RAPIER.init()
  world = new RAPIER.World({ x: 0, y: 0 })
})

describe('classic table', () => {
  it('returns the expected mix of bodies', () => {
    const t = buildClassicTable(world)
    const byKind = new Map<string, number>()
    for (const b of t.bodies) byKind.set(b.kind, (byKind.get(b.kind) ?? 0) + 1)

    expect(byKind.get('bumper')).toBe(5)
    expect(byKind.get('slingshot')).toBe(2)
    expect(byKind.get('rollover')).toBe(3)
    expect(byKind.get('peg')).toBe(6)
    expect(byKind.get('flipperLeft')).toBe(1)
    expect(byKind.get('flipperRight')).toBe(1)
    expect(byKind.get('drain')).toBe(1)
    expect(byKind.get('dropTarget')).toBeUndefined()
  })

  it('places flipper pivots at (180, H-100) and (380, H-100)', () => {
    const t = buildClassicTable(world)
    expect(t.leftPivot).toEqual({ x: 180, y: PLAYFIELD_HEIGHT - 100 })
    expect(t.rightPivot).toEqual({ x: 380, y: PLAYFIELD_HEIGHT - 100 })
  })

  it('exposes rolloverById with three entries', () => {
    const t = buildClassicTable(world)
    expect(t.rolloverById.size).toBe(3)
    expect([...t.rolloverById.keys()]).toEqual(['roll0', 'roll1', 'roll2'])
  })

  it('plunger visual top sits at lane-floor top so it does not overlap ball', () => {
    const t = buildClassicTable(world)
    expect(t.plungerVisual.y).toBe(880)
    expect(t.plungerVisual.h).toBe(14)
  })
})
