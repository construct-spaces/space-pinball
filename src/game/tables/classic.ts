import RAPIER from '@dimforge/rapier2d-compat'
import {
  PLAYFIELD_WIDTH as W,
  PLAYFIELD_HEIGHT as H,
  FLIPPER_LENGTH,
  FLIPPER_THICKNESS,
  FLIPPER_REST_ANGLE,
} from '../constants'
import type { BodyKind, BodyShape } from '../bodies'

export interface TableBody {
  id: string
  kind: BodyKind
  rb: RAPIER.RigidBody
  shape: BodyShape
  /** Collider offset from body origin — only used by flipper (pivot != center). */
  colliderOffset?: { x: number; y: number }
}

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

function fixedRect(
  world: RAPIER.World,
  id: string,
  kind: BodyKind,
  cx: number,
  cy: number,
  w: number,
  h: number,
  opts: { angle?: number; restitution?: number; friction?: number; sensor?: boolean } = {},
): TableBody {
  const rb = world.createRigidBody(
    RAPIER.RigidBodyDesc.fixed().setTranslation(cx, cy).setRotation(opts.angle ?? 0),
  )
  const cd = RAPIER.ColliderDesc.cuboid(w / 2, h / 2)
    .setRestitution(opts.restitution ?? 0.3)
    .setFriction(opts.friction ?? 0.02)
    .setSensor(!!opts.sensor)
    .setActiveEvents(RAPIER.ActiveEvents.COLLISION_EVENTS)
  world.createCollider(cd, rb)
  return { id, kind, rb, shape: { type: 'rect', w, h } }
}

function fixedCircle(
  world: RAPIER.World,
  id: string,
  kind: BodyKind,
  cx: number,
  cy: number,
  r: number,
  opts: { restitution?: number; friction?: number } = {},
): TableBody {
  const rb = world.createRigidBody(RAPIER.RigidBodyDesc.fixed().setTranslation(cx, cy))
  const cd = RAPIER.ColliderDesc.ball(r)
    .setRestitution(opts.restitution ?? 1.4)
    .setFriction(opts.friction ?? 0)
    .setActiveEvents(RAPIER.ActiveEvents.COLLISION_EVENTS)
  world.createCollider(cd, rb)
  return { id, kind, rb, shape: { type: 'circle', r } }
}

function kinematicFlipper(
  world: RAPIER.World,
  id: string,
  kind: BodyKind,
  pivot: { x: number; y: number },
  side: 'left' | 'right',
): TableBody {
  const rb = world.createRigidBody(
    RAPIER.RigidBodyDesc.kinematicPositionBased()
      .setTranslation(pivot.x, pivot.y)
      .setRotation(side === 'left' ? FLIPPER_REST_ANGLE : -FLIPPER_REST_ANGLE),
  )
  const offsetX = side === 'left' ? FLIPPER_LENGTH / 2 : -FLIPPER_LENGTH / 2
  const cd = RAPIER.ColliderDesc.cuboid(FLIPPER_LENGTH / 2, FLIPPER_THICKNESS / 2)
    .setTranslation(offsetX, 0)
    .setRestitution(0.1)
    .setFriction(0.05)
    .setDensity(4)
    .setActiveEvents(RAPIER.ActiveEvents.COLLISION_EVENTS)
  world.createCollider(cd, rb)
  return {
    id,
    kind,
    rb,
    shape: { type: 'rect', w: FLIPPER_LENGTH, h: FLIPPER_THICKNESS },
    colliderOffset: { x: offsetX, y: 0 },
  }
}

export function buildClassicTable(world: RAPIER.World): ClassicTable {
  const bodies: TableBody[] = []
  const wallT = 20

  // ── Playfield box (left) ─────────────────────────────────────────────────
  bodies.push(fixedRect(world, 'leftWall', 'wall', wallT / 2, H / 2, wallT, H))
  // Playfield right inner wall — boundary between playfield and the visual
  // separator strip. Top opening (y < 120) lets the gate rail pass through
  // from the lane into the playfield interior.
  bodies.push(fixedRect(world, 'rightWallPF', 'wall', 484, (120 + H) / 2, 8, H - 120))

  // ── Ball lane box (right) ────────────────────────────────────────────────
  // Lane outer right wall.
  bodies.push(fixedRect(world, 'rightWallLane', 'wall', W - wallT / 2, H / 2, wallT, H))
  // Lane left wall — thick, runs from below the gate opening down to bottom.
  // Top opening (y < 120) lets the ball exit lane via the gate rail.
  bodies.push(fixedRect(world, 'laneLeftWall', 'wall', 510, (120 + H) / 2, 20, H - 120))

  // Flat top wall above all boxes — seals top of both playfield + lane.
  bodies.push(fixedRect(world, 'topWall', 'wall', W / 2, wallT / 2, W, wallT))

  // Bottom seal across the visual gap between playfield right wall (x≈488)
  // and lane left wall (x=500). Prevents ball from settling in the strip.
  bodies.push(fixedRect(world, 'gapFloor', 'wall', 494, H - 10, 12, 20))

  // Top seal across the gap strip — keeps ball out of the visible separator
  // (corridor for ball flow only goes left-into-playfield via the gate rail).
  bodies.push(fixedRect(world, 'gapCeiling', 'wall', 494, 60, 12, 80))

  // (Top arch removed — topWall already seals top; arch was clutter.)

  // Lane floor (full width of lane interior x ∈ [520, 580])
  bodies.push(fixedRect(world, 'laneFloor', 'wall', 550, H - 12, 60, 16))

  // Curved exit rail (plunger lane → upper playfield) — 3 segs, simpler arc.
  // Starts above the lane (lane left wall ends at y=120; this rail is above
  // that) and lands inside the upper playfield (well below topWall y=20).
  {
    const pts: Array<[number, number]> = [
      [560, 100],
      [440, 50],
      [280, 50],
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
    const right: Array<[number, number]> = left.map(([x, y]) => [W - x, y])
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

  // Bottom walls flanking drain (right end stops at divider inner edge)
  const leftBottomX0 = wallT
  const leftBottomX1 = drainCenterX - drainWidth / 2
  bodies.push(
    fixedRect(
      world,
      'bottomL',
      'wall',
      (leftBottomX0 + leftBottomX1) / 2,
      H - 10,
      leftBottomX1 - leftBottomX0,
      20,
    ),
  )
  const rightBottomX0 = drainCenterX + drainWidth / 2
  // Bottom-right wall ends at the playfield right inner wall (x=484, half-w 4 → 480).
  const rightBottomX1 = 480
  bodies.push(
    fixedRect(
      world,
      'bottomR',
      'wall',
      (rightBottomX0 + rightBottomX1) / 2,
      H - 10,
      rightBottomX1 - rightBottomX0,
      20,
    ),
  )

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
    plungerVisual: { x: 550, y: 880, w: 28, h: 14 },
  }
}
