import { describe, it, expect } from 'vitest'
import { hitTest } from '../HitTest'
import type { Element } from '../types'

const rect: Element = { id: 'r', kind: 'wall', x: 100, y: 100, w: 40, h: 20, angle: 0 }
const rectRot: Element = { id: 'rr', kind: 'wall', x: 100, y: 100, w: 40, h: 20, angle: Math.PI / 2 }
const circle: Element = { id: 'c', kind: 'bumper', x: 200, y: 200, r: 24 }
const flipper: Element = { id: 'f', kind: 'flipperLeft', x: 300, y: 300 }
const poly: Element = {
  id: 'p',
  kind: 'arcRail',
  points: [{ x: 0, y: 0 }, { x: 100, y: 100 }],
  thickness: 6,
}

describe('hitTest', () => {
  it('hits inside an axis-aligned rect', () => {
    expect(hitTest({ x: 110, y: 105 }, [rect])?.id).toBe('r')
    expect(hitTest({ x: 200, y: 200 }, [rect])).toBeUndefined()
  })

  it('hits inside a rotated rect', () => {
    expect(hitTest({ x: 105, y: 115 }, [rectRot])?.id).toBe('rr')
    expect(hitTest({ x: 130, y: 100 }, [rectRot])).toBeUndefined()
  })

  it('hits inside a circle', () => {
    expect(hitTest({ x: 215, y: 200 }, [circle])?.id).toBe('c')
    expect(hitTest({ x: 230, y: 200 }, [circle])).toBeUndefined()
  })

  it('hits inside a flipper bounding box (uses default flipper size)', () => {
    expect(hitTest({ x: 305, y: 300 }, [flipper])?.id).toBe('f')
  })

  it('hits within polyline thickness', () => {
    expect(hitTest({ x: 50, y: 50 }, [poly])?.id).toBe('p')
    expect(hitTest({ x: 0, y: 100 }, [poly])).toBeUndefined()
  })

  it('returns the topmost (last) element when overlapping', () => {
    const a: Element = { id: 'a', kind: 'wall', x: 100, y: 100, w: 40, h: 40, angle: 0 }
    const b: Element = { id: 'b', kind: 'wall', x: 100, y: 100, w: 20, h: 20, angle: 0 }
    expect(hitTest({ x: 100, y: 100 }, [a, b])?.id).toBe('b')
  })
})
