import { describe, it, expect } from 'vitest'
import {
  PLAYFIELD_WIDTH,
  PLAYFIELD_HEIGHT,
  BALL_START,
  BALL_RADIUS,
  POINTS,
} from '../constants'

describe('constants', () => {
  it('uses 600x900 playfield', () => {
    expect(PLAYFIELD_WIDTH).toBe(600)
    expect(PLAYFIELD_HEIGHT).toBe(900)
  })

  it('starts ball inside plunger lane', () => {
    expect(BALL_START.x).toBe(550)
    expect(BALL_START.y).toBe(820)
    expect(BALL_RADIUS).toBe(12)
  })

  it('exposes rollover scoring; no drop target points', () => {
    expect(POINTS.BUMPER).toBe(100)
    expect(POINTS.SLINGSHOT).toBe(50)
    expect(POINTS.ROLLOVER).toBe(10)
    expect(POINTS.ROLLOVER_BANK).toBe(500)
    expect((POINTS as Record<string, number>).DROP_TARGET).toBeUndefined()
    expect((POINTS as Record<string, number>).DROP_TARGET_BANK).toBeUndefined()
  })
})
