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
  dropTargetById: Map<string, TableBody>
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
  // Collider extends from pivot toward tip.
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

  // Outer walls
  bodies.push(fixedRect(world, 'leftWall', 'wall', wallT / 2, H / 2, wallT, H))
  bodies.push(fixedRect(world, 'rightWall', 'wall', W - wallT / 2, H / 2, wallT, H))
  bodies.push(fixedRect(world, 'topWall', 'wall', W / 2, wallT / 2, W, wallT))

  // Plunger lane divider. laneTop pulled down to 120 so the vertical gap
  // between the divider top and the launch rail (seg2 lands at y≈58) is
  // ~62 px — comfortably larger than a 24 px ball diameter.
  const laneDividerX = 438
  const laneDividerThickness = 6
  const laneTop = 120
  const laneBottom = H - 16
  bodies.push(
    fixedRect(
      world,
      'laneDivider',
      'wall',
      laneDividerX,
      (laneTop + laneBottom) / 2,
      laneDividerThickness,
      laneBottom - laneTop,
    ),
  )
  // Plunger lane floor
  bodies.push(fixedRect(world, 'laneFloor', 'wall', 460, H - 10, 44, 12))

  // Launch rail — a curved "wire" approximated by short rect segments. Ball
  // exiting the lane bounces along the rail, progressively redirected from
  // vertical motion into a down-left trajectory into the upper playfield.
  // Points go from the lane mouth (upper-right) around to the top-center.
  const railPoints: Array<[number, number]> = [
    [470, 78],
    [462, 60],
    [445, 40],
    [420, 25],
    [380, 18],
    [280, 14],
  ]
  for (let i = 0; i < railPoints.length - 1; i++) {
    const [x1, y1] = railPoints[i]
    const [x2, y2] = railPoints[i + 1]
    const cx = (x1 + x2) / 2
    const cy = (y1 + y2) / 2
    const dx = x2 - x1
    const dy = y2 - y1
    const len = Math.hypot(dx, dy)
    const angle = Math.atan2(dy, dx)
    bodies.push(
      fixedRect(world, `rail${i}`, 'wall', cx, cy, len, 6, { angle, restitution: 0.2 }),
    )
  }

  // Funnel walls above flippers. Length kept short enough that neither funnel
  // intrudes into the plunger lane (right-end x must stay < laneDividerX=438).
  // halfLen*cos(0.6)=halfLen*0.825 < 48 → halfLen < ~58 → length ≤ 116.
  const funnelY = H - 140
  const funnelLen = 115
  bodies.push(fixedRect(world, 'funnelL', 'wall', 70, funnelY, funnelLen, wallT, { angle: 0.6 }))
  bodies.push(fixedRect(world, 'funnelR', 'wall', W - 120, funnelY, funnelLen, wallT, { angle: -0.6 }))

  // Bumpers — tight triangle in upper-right, pointing down-left
  bodies.push(fixedCircle(world, 'b1', 'bumper', 325, 255, 23, { restitution: 1.5 }))
  bodies.push(fixedCircle(world, 'b2', 'bumper', 395, 330, 23, { restitution: 1.5 }))
  bodies.push(fixedCircle(world, 'b3', 'bumper', 325, 405, 23, { restitution: 1.5 }))

  // Decorative posts — small bright circles that add ball chaos without scoring
  bodies.push(fixedCircle(world, 'post1', 'post', 130, 420, 8, { restitution: 0.8 }))
  bodies.push(fixedCircle(world, 'post2', 'post', 175, 495, 8, { restitution: 0.8 }))
  bodies.push(fixedCircle(world, 'post3', 'post', 255, 560, 8, { restitution: 0.8 }))

  // Slingshots (unchanged position, tuned restitution)
  bodies.push(
    fixedRect(world, 's1', 'slingshot', 100, H - 220, 80, 18, { angle: 0.6, restitution: 1.3 }),
  )
  bodies.push(
    fixedRect(world, 's2', 'slingshot', W - 150, H - 220, 80, 18, {
      angle: -0.6,
      restitution: 1.3,
    }),
  )

  // Drop target bank — 4 targets, angled diagonal on upper-left
  const dropTargetById = new Map<string, TableBody>()
  const dropCount = 4
  const dropSpacing = 48
  const dropAngle = -0.35
  const dropStartX = 90
  const dropStartY = 220
  for (let i = 0; i < dropCount; i++) {
    const id = `d${i}`
    const cx = dropStartX + i * dropSpacing * Math.cos(dropAngle)
    const cy = dropStartY + i * dropSpacing * Math.sin(dropAngle)
    const tb = fixedRect(world, id, 'dropTarget', cx, cy, 42, 14, {
      angle: dropAngle,
      restitution: 0.5,
    })
    bodies.push(tb)
    dropTargetById.set(id, tb)
  }

  // Upper rollover chevron — two short walls near the top forming a gentle
  // arrow pointing down at the bumpers. Inner ends meet at (262, 122) so there
  // is no ball-sized gap between them.
  // With angle ±0.35 and halfLen=35: tip offset from center is (±32.9, +12).
  bodies.push(fixedRect(world, 'chevL', 'wall', 229, 110, 70, 8, { angle: 0.35 }))
  bodies.push(fixedRect(world, 'chevR', 'wall', 295, 110, 70, 8, { angle: -0.35 }))

  // Drain sensor — center between flippers
  const leftPivotX = 153
  const rightPivotX = 347
  const drainCenterX = (leftPivotX + rightPivotX) / 2
  const drainWidth = 80
  const drain = fixedRect(world, 'drain', 'drain', drainCenterX, H - 4, drainWidth, 8, {
    sensor: true,
  })
  bodies.push(drain)

  // Bottom walls flanking the drain
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
      16,
    ),
  )
  const rightBottomX0 = drainCenterX + drainWidth / 2
  const rightBottomX1 = laneDividerX - laneDividerThickness / 2
  bodies.push(
    fixedRect(
      world,
      'bottomR',
      'wall',
      (rightBottomX0 + rightBottomX1) / 2,
      H - 10,
      rightBottomX1 - rightBottomX0,
      16,
    ),
  )

  // Flippers (kinematic)
  const flipperY = H - 90
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
    dropTargetById,
    leftPivot,
    rightPivot,
    plungerVisual: { x: 460, y: H - 24, w: 28, h: 14 },
  }
}
