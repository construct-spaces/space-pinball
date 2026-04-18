import RAPIER from '@dimforge/rapier2d-compat'
import {
  PLAYFIELD_WIDTH as W,
  PLAYFIELD_HEIGHT as H,
} from '../constants'
import { type TableBody, fixedRect, fixedCircle, kinematicFlipper } from './builders'

export type { TableBody } from './builders'

export interface ClassicTable {
  bodies: TableBody[]
  flipperLeft: TableBody
  flipperRight: TableBody
  drain: TableBody
  rolloverById: Map<string, TableBody>
  leftPivot: { x: number; y: number }
  rightPivot: { x: number; y: number }
  plungerVisual: { x: number; y: number; w: number; h: number }
}

export function buildClassicTable(world: RAPIER.World): ClassicTable {
  const bodies: TableBody[] = []
  const wallT = 20

  // ── Geometry constants (single source of truth) ──────────────────────────
  // Playfield interior: x ∈ [20, 490], width 470
  // Single divider:     x ∈ [490, 520], width 30  (replaces the old gap strip)
  // Lane interior:      x ∈ [520, 580], width 60
  // Lane center:        x = 550
  const LANE_INNER_RIGHT = 580
  const LANE_CENTER_X = 550

  // ── Outer walls ──────────────────────────────────────────────────────────
  bodies.push(fixedRect(world, 'leftWall', 'wall', wallT / 2, H / 2, wallT, H))
  bodies.push(fixedRect(world, 'rightWallLane', 'wall', W - wallT / 2, H / 2, wallT, H))
  bodies.push(fixedRect(world, 'topWall', 'wall', W / 2, wallT / 2, W, wallT))

  // (Lane left wall removed per user request — lane is now an open right
  // section of the playfield, no divider blocking ball flow.)

  // Lane floor — covers full lane interior so the ball never falls between
  // laneLeftWall and rightWallLane.
  bodies.push(
    fixedRect(
      world,
      'laneFloor',
      'wall',
      LANE_CENTER_X,
      H - 12,
      60,
      16,
    ),
  )

  // Curved exit rail (lane → playfield) — single deflector + 2 follow-on segs.
  // Right end butts against rightWallLane inner face at (LANE_INNER_RIGHT, 70).
  // Slope is steep so a ball can't rest on it.
  {
    const pts: Array<[number, number]> = [
      [LANE_INNER_RIGHT, 70],
      [440, 40],
      [280, 60],
    ]
    for (let i = 0; i < pts.length - 1; i++) {
      const [x0, y0] = pts[i]
      const [x1, y1] = pts[i + 1]
      const ccx = (x0 + x1) / 2, ccy = (y0 + y1) / 2
      const dx = x1 - x0, dy = y1 - y0
      bodies.push(
        fixedRect(world, `gateRail${i}`, 'wall', ccx, ccy, Math.hypot(dx, dy), 4, {
          angle: Math.atan2(dy, dx),
          restitution: 0.2,
        }),
      )
    }
  }

  // Top rollover posts (4 small vertical rects) — moved to y=140 to clear
  // the gate rail area (rail lands at y≈50 → leave a bumper-free zone above).
  for (const [i, x] of [200, 240, 280, 320].entries()) {
    bodies.push(fixedRect(world, `rollPost${i}`, 'post', x, 140, 6, 40))
  }

  // Top rollover sensor zones (3) — sit between the posts at y=140.
  const rolloverById = new Map<string, TableBody>()
  for (const [i, x] of [220, 260, 300].entries()) {
    const id = `roll${i}`
    const tb = fixedRect(world, id, 'rollover', x, 140, 28, 30, { sensor: true })
    bodies.push(tb)
    rolloverById.set(id, tb)
  }

  // Bumpers (quincunx)
  bodies.push(fixedCircle(world, 'b0', 'bumper', 200, 220, 24, { restitution: 1.5 }))
  bodies.push(fixedCircle(world, 'b1', 'bumper', 320, 220, 24, { restitution: 1.5 }))
  bodies.push(fixedCircle(world, 'b2', 'bumper', 260, 290, 24, { restitution: 1.5 }))
  bodies.push(fixedCircle(world, 'b3', 'bumper', 200, 360, 24, { restitution: 1.5 }))
  bodies.push(fixedCircle(world, 'b4', 'bumper', 320, 360, 24, { restitution: 1.5 }))

  // Arc rails (frame bumpers)
  {
    const left: Array<[number, number]> = [
      [110, 180],
      [95, 240],
      [88, 300],
      [90, 360],
      [105, 410],
      [130, 460],
    ]
    // Mirror across the new playfield center (x ≈ 250), not full canvas (W=600),
    // so the right arc stays inside the playfield right wall (x=480 inner face).
    const PF_CENTER_X = 250
    const right: Array<[number, number]> = left.map(([x, y]) => [2 * PF_CENTER_X - x, y])
    for (const [side, pts] of [
      ['L', left] as const,
      ['R', right] as const,
    ]) {
      for (let i = 0; i < pts.length - 1; i++) {
        const [x0, y0] = pts[i]
        const [x1, y1] = pts[i + 1]
        const ccx = (x0 + x1) / 2, ccy = (y0 + y1) / 2
        const dx = x1 - x0, dy = y1 - y0
        bodies.push(
          fixedRect(world, `arc${side}${i}`, 'arcRail', ccx, ccy, Math.hypot(dx, dy), 6, {
            angle: Math.atan2(dy, dx),
            restitution: 0.6,
          }),
        )
      }
    }
  }

  // Chevron pegs
  const pegPts: Array<[number, number]> = [
    [140, 500],
    [180, 540],
    [240, 560],
    [280, 560],
    [340, 540],
    [380, 500],
  ]
  for (const [i, [x, y]] of pegPts.entries()) {
    bodies.push(fixedCircle(world, `peg${i}`, 'peg', x, y, 6, { restitution: 0.8 }))
  }

  // Slingshots
  bodies.push(
    fixedRect(world, 'sL', 'slingshot', 110, 700, 90, 18, { angle: 0.6, restitution: 1.3 }),
  )
  bodies.push(
    fixedRect(world, 'sR', 'slingshot', 410, 700, 90, 18, { angle: -0.6, restitution: 1.3 }),
  )

  // Kicker posts
  const kickerPts: Array<[number, number]> = [
    [60, 720],
    [160, 740],
    [360, 740],
    [460, 720],
  ]
  for (const [i, [x, y]] of kickerPts.entries()) {
    bodies.push(fixedCircle(world, `kp${i}`, 'post', x, y, 8, { restitution: 0.8 }))
  }

  // Inlane / outlane guides — pulled far clear of plunger lane (divider x=520).
  // Right guide right-end x ≈ 430 + 40*cos(0.54) ≈ 464, well clear of divider.
  bodies.push(fixedRect(world, 'guideL', 'wall', 170, 800, 80, 6, { angle: 0.54 }))
  bodies.push(fixedRect(world, 'guideR', 'wall', 430, 800, 80, 6, { angle: -0.54 }))

  // Drain sensor
  const leftPivotX = 180,
    rightPivotX = 380
  const drainCenterX = (leftPivotX + rightPivotX) / 2
  const drainWidth = 80
  const drain = fixedRect(world, 'drain', 'drain', drainCenterX, H - 4, drainWidth, 8, {
    sensor: true,
  })
  bodies.push(drain)

  // Bottom walls flanking drain — gently angled so a stationary ball slides
  // toward the drain instead of resting in the corners.
  {
    const x0 = wallT, x1 = drainCenterX - drainWidth / 2
    const y0 = 880, y1 = 890 // left side: outer up, drain side down
    const cx = (x0 + x1) / 2, cy = (y0 + y1) / 2
    const len = Math.hypot(x1 - x0, y1 - y0)
    const ang = Math.atan2(y1 - y0, x1 - x0)
    bodies.push(fixedRect(world, 'bottomL', 'wall', cx, cy, len, 20, { angle: ang }))
  }
  {
    // Right bottom wall extends to lane outer right wall (lane is open now).
    const x0 = drainCenterX + drainWidth / 2, x1 = W - wallT
    const y0 = 890, y1 = 880 // right side: drain side down, outer up
    const cx = (x0 + x1) / 2, cy = (y0 + y1) / 2
    const len = Math.hypot(x1 - x0, y1 - y0)
    const ang = Math.atan2(y1 - y0, x1 - x0)
    bodies.push(fixedRect(world, 'bottomR', 'wall', cx, cy, len, 20, { angle: ang }))
  }

  // Flippers
  const flipperY = H - 100
  const leftPivot = { x: leftPivotX, y: flipperY }
  const rightPivot = { x: rightPivotX, y: flipperY }
  const flipperLeft = kinematicFlipper(world, 'flipperL', 'flipperLeft', leftPivot, 'left')
  const flipperRight = kinematicFlipper(world, 'flipperR', 'flipperRight', rightPivot, 'right')
  bodies.push(flipperLeft, flipperRight)

  return {
    bodies,
    flipperLeft,
    flipperRight,
    drain,
    rolloverById,
    leftPivot,
    rightPivot,
    // Plunger top sits at lane-floor top (y=880). Ball at rest center y=868
    // with radius 12 → ball bottom y=880, tangent to plunger top (no overlap).
    plungerVisual: { x: LANE_CENTER_X, y: 880, w: 28, h: 14 },
  }
}
