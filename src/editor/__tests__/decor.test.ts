import { describe, it, expect } from 'vitest'
import { matchesTrigger } from '../../game/DecorationLayer'

describe('matchesTrigger', () => {
  it('matches simple type triggers', () => {
    expect(matchesTrigger({ type: 'bumper' }, { type: 'bumper' })).toBe(true)
    expect(matchesTrigger({ type: 'bumper' }, { type: 'slingshot' })).toBe(false)
  })

  it('hit trigger requires sourceId match', () => {
    expect(matchesTrigger({ type: 'hit', sourceId: 'b1' }, { type: 'hit', sourceId: 'b1' })).toBe(true)
    expect(matchesTrigger({ type: 'hit', sourceId: 'b2' }, { type: 'hit', sourceId: 'b1' })).toBe(false)
    expect(matchesTrigger({ type: 'hit' }, { type: 'hit', sourceId: 'b1' })).toBe(false)
  })

  it('mismatched type returns false', () => {
    expect(matchesTrigger({ type: 'bumper' }, { type: 'hit', sourceId: 'b1' })).toBe(false)
  })
})
