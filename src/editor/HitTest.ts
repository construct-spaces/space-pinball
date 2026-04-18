import {
  type Element,
  type Decor,
  RECT_KINDS,
  CIRCLE_KINDS,
  FLIPPER_KINDS,
  POLYLINE_KINDS,
} from './types'
import { FLIPPER_LENGTH, FLIPPER_THICKNESS } from '../game/constants'

function pointInRect(
  px: number,
  py: number,
  cx: number,
  cy: number,
  w: number,
  h: number,
  angle: number,
): boolean {
  const dx = px - cx
  const dy = py - cy
  const c = Math.cos(-angle)
  const s = Math.sin(-angle)
  const lx = dx * c - dy * s
  const ly = dx * s + dy * c
  return Math.abs(lx) <= w / 2 && Math.abs(ly) <= h / 2
}

function pointInCircle(px: number, py: number, cx: number, cy: number, r: number): boolean {
  const dx = px - cx
  const dy = py - cy
  return dx * dx + dy * dy <= r * r
}

function distanceToSegment(
  px: number,
  py: number,
  ax: number,
  ay: number,
  bx: number,
  by: number,
): number {
  const dx = bx - ax
  const dy = by - ay
  const len2 = dx * dx + dy * dy
  if (len2 === 0) return Math.hypot(px - ax, py - ay)
  let t = ((px - ax) * dx + (py - ay) * dy) / len2
  t = Math.max(0, Math.min(1, t))
  const cx = ax + t * dx
  const cy = ay + t * dy
  return Math.hypot(px - cx, py - cy)
}

export function hitTest(
  point: { x: number; y: number },
  elements: Element[],
): Element | undefined {
  for (let i = elements.length - 1; i >= 0; i--) {
    const e = elements[i]
    if (RECT_KINDS.has(e.kind)) {
      const r = e as Extract<Element, { kind: 'wall' | 'slingshot' | 'rollover' | 'drain' }>
      if (pointInRect(point.x, point.y, r.x, r.y, r.w, r.h, r.angle)) return e
    } else if (CIRCLE_KINDS.has(e.kind)) {
      const c = e as Extract<Element, { kind: 'bumper' | 'peg' | 'teleport' }>
      if (pointInCircle(point.x, point.y, c.x, c.y, c.r)) return e
    } else if (FLIPPER_KINDS.has(e.kind)) {
      const f = e as Extract<Element, { kind: 'flipperLeft' | 'flipperRight' }>
      if (pointInRect(point.x, point.y, f.x, f.y, FLIPPER_LENGTH, FLIPPER_THICKNESS, 0)) {
        return e
      }
    } else if (POLYLINE_KINDS.has(e.kind)) {
      const p = e as Extract<Element, { kind: 'arcRail' | 'gateRail' }>
      const half = p.thickness / 2
      for (let j = 0; j < p.points.length - 1; j++) {
        const a = p.points[j]
        const b = p.points[j + 1]
        if (distanceToSegment(point.x, point.y, a.x, a.y, b.x, b.y) <= half) return e
      }
    }
  }
  return undefined
}

const TEXT_HIT_W = 80
const TEXT_HIT_H = 24

export function hitTestDecor(
  point: { x: number; y: number },
  decorations: Decor[] | undefined,
): Decor | undefined {
  if (!decorations) return undefined
  for (let i = decorations.length - 1; i >= 0; i--) {
    const d = decorations[i]
    if (d.kind === 'light' || d.kind === 'emitter') {
      const r = d.kind === 'light' ? d.r : 12
      const dx = point.x - d.x
      const dy = point.y - d.y
      if (dx * dx + dy * dy <= r * r) return d
    } else if (d.kind === 'text') {
      if (
        point.x >= d.x - TEXT_HIT_W / 2 &&
        point.x <= d.x + TEXT_HIT_W / 2 &&
        point.y >= d.y - TEXT_HIT_H / 2 &&
        point.y <= d.y + TEXT_HIT_H / 2
      ) {
        return d
      }
    }
  }
  return undefined
}
