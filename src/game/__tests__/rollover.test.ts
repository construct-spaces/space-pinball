import { describe, it, expect } from 'vitest'

// Pure logic helper that mirrors the rule used in PhysicsWorld.onBallHit
// for the 'rollover' case. Kept here as a unit-testable fragment.
function applyRollover(
  lit: Set<string>,
  hit: string,
  totalLanes: number,
): { points: number; bank: boolean } {
  if (lit.has(hit)) return { points: 0, bank: false }
  lit.add(hit)
  if (lit.size === totalLanes) {
    lit.clear()
    return { points: 10, bank: true }
  }
  return { points: 10, bank: false }
}

describe('rollover lit set', () => {
  it('first hit lights and scores 10', () => {
    const s = new Set<string>()
    expect(applyRollover(s, 'roll0', 3)).toEqual({ points: 10, bank: false })
    expect(s.has('roll0')).toBe(true)
  })

  it('repeat hit on same rollover scores 0', () => {
    const s = new Set<string>(['roll0'])
    expect(applyRollover(s, 'roll0', 3)).toEqual({ points: 0, bank: false })
  })

  it('completing all three banks and clears', () => {
    const s = new Set<string>(['roll0', 'roll1'])
    expect(applyRollover(s, 'roll2', 3)).toEqual({ points: 10, bank: true })
    expect(s.size).toBe(0)
  })
})
