import RAPIER from '@dimforge/rapier2d-compat'
import {
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

export function fixedRect(
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

export function fixedCircle(
  world: RAPIER.World,
  id: string,
  kind: BodyKind,
  cx: number,
  cy: number,
  r: number,
  opts: { restitution?: number; friction?: number; sensor?: boolean } = {},
): TableBody {
  const rb = world.createRigidBody(RAPIER.RigidBodyDesc.fixed().setTranslation(cx, cy))
  const cd = RAPIER.ColliderDesc.ball(r)
    .setRestitution(opts.restitution ?? 1.4)
    .setFriction(opts.friction ?? 0)
    .setSensor(!!opts.sensor)
    .setActiveEvents(RAPIER.ActiveEvents.COLLISION_EVENTS)
  world.createCollider(cd, rb)
  return { id, kind, rb, shape: { type: 'circle', r } }
}

export function kinematicFlipper(
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
