import RAPIER from '@dimforge/rapier2d-compat'
import { buildClassicTable, type ClassicTable, type TableBody } from './tables/classic'
import { buildCustomTable, type CustomTable } from './tables/custom'
import type { Layout } from '../editor/types'
import {
  BALL_RADIUS,
  BALL_START,
  FLIPPER_ACTIVE_ANGLE,
  FLIPPER_REST_ANGLE,
  GRAVITY_Y,
  PHYSICS_STEP_MS,
  PLAYFIELD_HEIGHT,
  PLAYFIELD_WIDTH,
  PLUNGER_CHARGE_MAX_MS,
  PLUNGER_SPEED_MAX,
  PLUNGER_SPEED_MIN,
  POINTS,
} from './constants'
import type { EventBus } from './events'
import type { BodyKind, GameBody } from './bodies'

interface ColliderMeta {
  kind: BodyKind
  id: string
  /** Back-pointer for quick lookups. */
  tb?: TableBody
}

export class PhysicsWorld {
  world!: RAPIER.World
  ball!: RAPIER.RigidBody
  ballCollider!: RAPIER.Collider
  table!: ClassicTable | CustomTable
  private lastLayout?: Layout
  bodies: GameBody[] = []
  chargeLevel = 0
  ready = false

  private eventQueue!: RAPIER.EventQueue
  private metaByHandle = new Map<number, ColliderMeta>()
  private leftFlipperActive = false
  private rightFlipperActive = false
  /** Rollovers lit by the current ball; cleared when bank fires or ball respawns. */
  readonly litRollovers = new Set<string>()
  private hiddenIds = new Set<string>()
  private ballArmed = false
  private charging = false
  private chargeStartAt = 0
  /** Debug tracing — toggle in console: `window.__pinballTrace = false`. */
  private traceEnabled = true
  private traceTick = 0

  constructor(private bus: EventBus) {}

  async init(customLayout?: Layout): Promise<void> {
    this.lastLayout = customLayout
    await RAPIER.init()
    this.world = new RAPIER.World({ x: 0, y: GRAVITY_Y })
    this.world.timestep = PHYSICS_STEP_MS / 1000
    this.eventQueue = new RAPIER.EventQueue(true)

    this.table = customLayout
      ? buildCustomTable(this.world, customLayout)
      : buildClassicTable(this.world)

    for (const tb of this.table.bodies) {
      for (let i = 0; i < tb.rb.numColliders(); i++) {
        const c = tb.rb.collider(i)
        this.metaByHandle.set(c.handle, { kind: tb.kind, id: tb.id, tb })
      }
    }

    const start = customLayout?.ballStart ?? BALL_START
    const ballRbDesc = RAPIER.RigidBodyDesc.dynamic()
      .setTranslation(start.x, start.y)
      .setCcdEnabled(true)
      .setLinearDamping(0.15)
      .setAngularDamping(0.3)
    this.ball = this.world.createRigidBody(ballRbDesc)
    const ballColDesc = RAPIER.ColliderDesc.ball(BALL_RADIUS)
      .setRestitution(0.55)
      .setFriction(0.03)
      .setDensity(1.0)
      .setActiveEvents(RAPIER.ActiveEvents.COLLISION_EVENTS)
    this.ballCollider = this.world.createCollider(ballColDesc, this.ball)
    this.metaByHandle.set(this.ballCollider.handle, { kind: 'ball', id: 'ball' })

    this.refreshSnapshots()
    this.ready = true

    console.log('[pinball] rapier init', {
      ballStart: BALL_START,
      bodyCount: this.table.bodies.length,
    })

    // Tracing setup — list all wall + structural bodies once at startup.
    if (this.isTracing()) {
      const wallIds = this.table.bodies
        .filter((b) => b.kind === 'wall' || b.kind === 'arcRail')
        .map((b) => {
          const p = b.rb.translation()
          const s = b.shape.type === 'rect' ? `${b.shape.w}x${b.shape.h}` : `r=${b.shape.r}`
          return `${b.id}@(${p.x.toFixed(0)},${p.y.toFixed(0)}) ${s}`
        })
      console.log('[pinball][trace] walls:', wallIds.join(' | '))
    }
  }

  private isTracing(): boolean {
    const flag = (globalThis as unknown as { __pinballTrace?: boolean }).__pinballTrace
    return flag !== undefined ? flag : this.traceEnabled
  }

  step(): void {
    if (!this.ready) return
    this.driveFlippers()

    if (this.charging) {
      this.chargeLevel = Math.min(1, (performance.now() - this.chargeStartAt) / PLUNGER_CHARGE_MAX_MS)
      this.bus.emit('chargeChanged', { charge: this.chargeLevel })
    }

    this.world.step(this.eventQueue)

    this.eventQueue.drainCollisionEvents((h1, h2, started) => {
      if (!started) return
      const a = this.metaByHandle.get(h1)
      const b = this.metaByHandle.get(h2)
      if (!a || !b) return
      const ballMeta = a.kind === 'ball' ? a : b.kind === 'ball' ? b : null
      const otherMeta = ballMeta === a ? b : a
      if (!ballMeta) return
      if (this.isTracing()) {
        const bp = this.ball.translation()
        const bv = this.ball.linvel()
        console.log(
          `[pinball][trace] hit ${otherMeta.kind}#${otherMeta.id} ball@(${bp.x.toFixed(0)},${bp.y.toFixed(0)}) v=(${bv.x.toFixed(0)},${bv.y.toFixed(0)})`,
        )
      }
      this.onBallHit(otherMeta)
    })

    const p = this.ball.translation()
    if (this.ballArmed && (p.y > PLAYFIELD_HEIGHT + 200 || p.x < -200 || p.x > PLAYFIELD_WIDTH + 200)) {
      this.ballArmed = false
      this.bus.emit('ballLost', undefined)
    }

    // Periodic ball-state log (every 30 frames ≈ 0.5s).
    if (this.isTracing()) {
      this.traceTick = (this.traceTick + 1) % 30
      if (this.traceTick === 0) {
        const v = this.ball.linvel()
        const speed = Math.hypot(v.x, v.y)
        console.log(
          `[pinball][trace] ball@(${p.x.toFixed(0)},${p.y.toFixed(0)}) v=(${v.x.toFixed(0)},${v.y.toFixed(0)}) speed=${speed.toFixed(0)} armed=${this.ballArmed}`,
        )
      }
    }

    this.refreshSnapshots()
  }

  private onBallHit(other: ColliderMeta): void {
    const p = this.ball.translation()
    this.bus.emit('hit', { kind: other.kind, x: p.x, y: p.y })
    switch (other.kind) {
      case 'bumper': {
        const otherRb = other.tb?.rb
        if (otherRb) {
          const op = otherRb.translation()
          const dx = p.x - op.x
          const dy = p.y - op.y
          const d = Math.hypot(dx, dy) || 1
          const f = 320
          this.ball.applyImpulse({ x: (dx / d) * f, y: (dy / d) * f }, true)
        }
        this.bus.emit('score', { points: POINTS.BUMPER, reason: 'bumper', x: p.x, y: p.y })
        break
      }
      case 'slingshot':
        this.bus.emit('score', { points: POINTS.SLINGSHOT, reason: 'slingshot', x: p.x, y: p.y })
        break
      case 'rollover': {
        const id = other.id
        if (this.litRollovers.has(id)) break
        this.litRollovers.add(id)
        this.bus.emit('score', { points: POINTS.ROLLOVER, reason: 'rollover', x: p.x, y: p.y })
        this.bus.emit('rolloverLit', { id })
        if (this.litRollovers.size === this.table.rolloverById.size) {
          this.bus.emit('score', {
            points: POINTS.ROLLOVER_BANK,
            reason: 'rolloverBank',
            x: PLAYFIELD_WIDTH / 2,
            y: PLAYFIELD_HEIGHT * 0.2,
          })
          this.litRollovers.clear()
        }
        break
      }
      case 'drain': {
        if (this.ballArmed) {
          this.ballArmed = false
          this.bus.emit('ballLost', undefined)
        }
        break
      }
    }
  }

  private driveFlippers(): void {
    const leftTarget = this.leftFlipperActive ? FLIPPER_ACTIVE_ANGLE : FLIPPER_REST_ANGLE
    const rightTarget = this.rightFlipperActive ? -FLIPPER_ACTIVE_ANGLE : -FLIPPER_REST_ANGLE
    this.interpolateFlipper(this.table.flipperLeft.rb, leftTarget)
    this.interpolateFlipper(this.table.flipperRight.rb, rightTarget)
  }

  private interpolateFlipper(rb: RAPIER.RigidBody, target: number): void {
    const cur = rb.rotation()
    const next = cur + (target - cur) * 0.5
    rb.setNextKinematicRotation(next)
  }

  setFlipper(side: 'left' | 'right', active: boolean): void {
    if (side === 'left') this.leftFlipperActive = active
    else this.rightFlipperActive = active
  }

  /** True when the ball is sitting near-stationary inside the plunger lane. */
  isBallInLane(): boolean {
    const p = this.ball.translation()
    const v = this.ball.linvel()
    const speed = Math.hypot(v.x, v.y)
    // Ball radius 12, plunger lane inner x ∈ [528, 572], divider top y=140, floor y≈888.
    return p.x > 530 && p.x < 570 && p.y > 700 && speed < 60
  }

  startCharge(): void {
    if (this.charging) return
    this.charging = true
    this.chargeStartAt = performance.now()
  }

  releaseCharge(): void {
    if (!this.charging) {
      this.launchBall(0.7)
      return
    }
    const level = Math.min(1, (performance.now() - this.chargeStartAt) / PLUNGER_CHARGE_MAX_MS)
    this.charging = false
    this.chargeLevel = 0
    this.bus.emit('chargeChanged', { charge: 0 })
    if (level < 0.05) return
    this.launchBall(level)
  }

  launchBall(power: number): void {
    const clamped = Math.max(0.2, Math.min(1, power))
    const speed = PLUNGER_SPEED_MIN + (PLUNGER_SPEED_MAX - PLUNGER_SPEED_MIN) * clamped
    this.ball.setLinvel({ x: 0, y: -speed }, true)
    this.ball.setAngvel(0, true)
    this.ballArmed = true
    // Reset charge state so a subsequent startCharge() isn't blocked.
    if (this.charging || this.chargeLevel !== 0) {
      this.charging = false
      this.chargeLevel = 0
      this.bus.emit('chargeChanged', { charge: 0 })
    }
    this.bus.emit('ballLaunched', undefined)
  }

  resetBall(): void {
    this.ball.setTranslation({ x: BALL_START.x, y: BALL_START.y }, true)
    this.ball.setLinvel({ x: 0, y: 0 }, true)
    this.ball.setAngvel(0, true)
    this.ballArmed = false
    this.litRollovers.clear()
  }

  async fullReset(): Promise<void> {
    this.ready = false
    this.destroy()
    this.metaByHandle.clear()
    this.litRollovers.clear()
    this.hiddenIds.clear()
    this.bodies.length = 0
    this.charging = false
    this.chargeLevel = 0
    await this.init(this.lastLayout)
  }

  destroy(): void {
    this.ready = false
    const q = this.eventQueue as (RAPIER.EventQueue & { free?: () => void }) | undefined
    q?.free?.()
    const w = this.world as (RAPIER.World & { free?: () => void }) | undefined
    w?.free?.()
  }

  /**
   * Refresh render snapshots in place — one `GameBody` per table body + ball.
   * Reused array avoids 60 Hz × ~30-object alloc churn.
   */
  private refreshSnapshots(): void {
    const out = this.bodies
    const tableN = this.table.bodies.length
    const totalN = tableN + 1
    out.length = totalN
    for (let i = 0; i < tableN; i++) {
      const tb = this.table.bodies[i]
      const p = tb.rb.translation()
      const existing = out[i]
      if (existing && existing.id === tb.id) {
        existing.x = p.x
        existing.y = p.y
        existing.angle = tb.rb.rotation()
        existing.visible = tb.kind !== 'drain' && !this.hiddenIds.has(tb.id)
      } else {
        out[i] = {
          id: tb.id,
          kind: tb.kind,
          shape: tb.shape,
          x: p.x,
          y: p.y,
          angle: tb.rb.rotation(),
          visible: tb.kind !== 'drain' && !this.hiddenIds.has(tb.id),
        }
      }
    }
    const bp = this.ball.translation()
    const ballSlot = out[tableN]
    if (ballSlot && ballSlot.id === 'ball') {
      ballSlot.x = bp.x
      ballSlot.y = bp.y
      ballSlot.angle = this.ball.rotation()
      ballSlot.visible = true
    } else {
      out[tableN] = {
        id: 'ball',
        kind: 'ball',
        shape: { type: 'circle', r: BALL_RADIUS },
        x: bp.x,
        y: bp.y,
        angle: this.ball.rotation(),
        visible: true,
      }
    }
  }
}
