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

  // Outer left/right walls
  bodies.push(fixedRect(world, 'leftWall', 'wall', wallT / 2, H / 2, wallT, H))
  bodies.push(fixedRect(world, 'rightWall', 'wall', W - wallT / 2, H / 2, wallT, H))

  // Flat top wall ABOVE the arch — guarantees no escape past arch endpoints,
  // since the arc (r=270 from (290,290)) cannot reach playfield corners.
  bodies.push(fixedRect(world, 'topWall', 'wall', W / 2, wallT / 2, W, wallT))

  // Top arch — 8 segs along an arc (visual + deflective).
  {
    const cx = 290, cy = 290, r = 270
    const startDeg = 200, endDeg = 340
    const segs = 8
    for (let i = 0; i < segs; i++) {
      const a0 = ((startDeg + (i * (endDeg - startDeg)) / segs) * Math.PI) / 180
      const a1 = ((startDeg + ((i + 1) * (endDeg - startDeg)) / segs) * Math.PI) / 180
      const x0 = cx + r * Math.cos(a0), y0 = cy + r * Math.sin(a0)
      const x1 = cx + r * Math.cos(a1), y1 = cy + r * Math.sin(a1)
      const mx = (x0 + x1) / 2, my = (y0 + y1) / 2
      const dx = x1 - x0, dy = y1 - y0
      const len = Math.hypot(dx, dy)
      const ang = Math.atan2(dy, dx)
      bodies.push(fixedRect(world, `arch${i}`, 'wall', mx, my, len, 8, { angle: ang }))
    }
  }

  // Plunger lane divider
  const dividerX = 520
  const dividerThickness = 6
  const laneTop = 140
  const laneBottom = H - 20
  bodies.push(
    fixedRect(
      world,
      'laneDivider',
      'wall',
      dividerX,
      (laneTop + laneBottom) / 2,
      dividerThickness,
      laneBottom - laneTop,
    ),
  )
  // Lane floor
  bodies.push(fixedRect(world, 'laneFloor', 'wall', 550, H - 12, 44, 16))
  // One-way lip on inner side of divider top — short, hugs the divider so it
  // blocks return-into-lane without intruding far into the upper playfield.
  bodies.push(
    fixedRect(world, 'laneLip', 'wall', 513, 140, 20, 4, { angle: -1.0, restitution: 0.2 }),
  )

  // Curved exit rail (plunger lane → upper playfield)
  {
    const pts: Array<[number, number]> = [
      [560, 130],
      [540, 90],
      [480, 60],
      [380, 40],
      [280, 30],
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

  // Top rollover posts (4 small vertical rects)
  for (const [i, x] of [200, 240, 280, 320].entries()) {
    bodies.push(fixedRect(world, `rollPost${i}`, 'post', x, 90, 6, 40))
  }

  // Top rollover sensor zones (3)
  const rolloverById = new Map<string, TableBody>()
  for (const [i, x] of [220, 260, 300].entries()) {
    const id = `roll${i}`
    const tb = fixedRect(world, id, 'rollover', x, 90, 28, 30, { sensor: true })
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

  // Inlane / outlane guides — kept clear of plunger lane divider (x=520).
  // Right guide right-end x ≈ 470 + 50*cos(0.54) ≈ 513, safely left of 517.
  bodies.push(fixedRect(world, 'guideL', 'wall', 130, 790, 100, 6, { angle: 0.54 }))
  bodies.push(fixedRect(world, 'guideR', 'wall', 470, 790, 100, 6, { angle: -0.54 }))

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
  const rightBottomX1 = dividerX - dividerThickness / 2
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
    plungerVisual: { x: 550, y: 874, w: 28, h: 14 },
  }
}
