import RAPIER from '@dimforge/rapier2d-compat'
import { type TableBody, fixedRect, fixedCircle, kinematicFlipper } from './builders'
import type { Layout } from '../../editor/types'

export interface CustomTable {
  bodies: TableBody[]
  flipperLeft: TableBody
  flipperRight: TableBody
  drain: TableBody
  rolloverById: Map<string, TableBody>
  teleportById: Map<string, TableBody>
  leftPivot: { x: number; y: number }
  rightPivot: { x: number; y: number }
  plungerVisual: { x: number; y: number; w: number; h: number }
}

export function buildCustomTable(world: RAPIER.World, layout: Layout): CustomTable {
  const bodies: TableBody[] = []
  const rolloverById = new Map<string, TableBody>()
  const teleportById = new Map<string, TableBody>()
  let flipperLeft: TableBody | undefined
  let flipperRight: TableBody | undefined
  let drain: TableBody | undefined
  let leftPivot: { x: number; y: number } | undefined
  let rightPivot: { x: number; y: number } | undefined

  for (const e of layout.elements) {
    switch (e.kind) {
      case 'wall':
      case 'slingshot':
      case 'rollover':
      case 'drain': {
        const opts: { angle?: number; restitution?: number; friction?: number; sensor?: boolean } = {
          angle: e.angle,
        }
        if (e.kind === 'slingshot') opts.restitution = 1.3
        if (e.kind === 'rollover' || e.kind === 'drain') opts.sensor = true
        const tb = fixedRect(world, e.id, e.kind, e.x, e.y, e.w, e.h, opts)
        bodies.push(tb)
        if (e.kind === 'rollover') rolloverById.set(e.id, tb)
        if (e.kind === 'drain') drain = tb
        break
      }
      case 'teleport':
      case 'bumper':
      case 'peg': {
        const opts = e.kind === 'bumper' ? { restitution: 1.5 } : { restitution: 0.8 }
        if (e.kind === 'teleport') {
          const tb = fixedCircle(world, e.id, e.kind, e.x, e.y, e.r, { sensor: true })
          bodies.push(tb)
          teleportById.set(e.id, tb)
        } else {
          bodies.push(fixedCircle(world, e.id, e.kind, e.x, e.y, e.r, opts))
        }
        break
      }
      case 'flipperLeft':
      case 'flipperRight': {
        const side = e.kind === 'flipperLeft' ? 'left' : 'right'
        const tb = kinematicFlipper(world, e.id, e.kind, { x: e.x, y: e.y }, side)
        bodies.push(tb)
        if (side === 'left') {
          flipperLeft = tb
          leftPivot = { x: e.x, y: e.y }
        } else {
          flipperRight = tb
          rightPivot = { x: e.x, y: e.y }
        }
        break
      }
      case 'arcRail':
      case 'gateRail': {
        const restitution = e.kind === 'arcRail' ? 0.6 : 0.2
        const segKind = e.kind === 'arcRail' ? 'arcRail' : 'wall'
        for (let i = 0; i < e.points.length - 1; i++) {
          const a = e.points[i]
          const b = e.points[i + 1]
          const cx = (a.x + b.x) / 2
          const cy = (a.y + b.y) / 2
          const dx = b.x - a.x
          const dy = b.y - a.y
          const len = Math.hypot(dx, dy)
          const ang = Math.atan2(dy, dx)
          bodies.push(
            fixedRect(world, `${e.id}-${i}`, segKind, cx, cy, len, e.thickness, {
              angle: ang,
              restitution,
            }),
          )
        }
        break
      }
    }
  }

  if (!drain) throw new Error('layout missing required element: drain')
  if (!flipperLeft || !leftPivot) throw new Error('layout missing required element: flipperLeft')
  if (!flipperRight || !rightPivot) throw new Error('layout missing required element: flipperRight')

  return {
    bodies,
    flipperLeft,
    flipperRight,
    drain,
    rolloverById,
    teleportById,
    leftPivot,
    rightPivot,
    plungerVisual: layout.plungerVisual,
  }
}
