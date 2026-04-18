import { Application, Container, Graphics } from 'pixi.js'
import type { PhysicsWorld } from './PhysicsWorld'
import type { GameBody } from './bodies'
import { BALL_RADIUS, PLAYFIELD_HEIGHT, PLAYFIELD_WIDTH } from './constants'
import { COLORS, colorFor } from './palette'
import { Starfield } from './Starfield'
import { VFX } from './VFX'

/**
 * PixiJS renderer. Reads GameBody snapshots from PhysicsWorld and draws one
 * pooled Graphics per body. Also owns starfield, ball trail, and VFX layers.
 */
export class Renderer {
  app!: Application
  playfield!: Container
  starfield!: Starfield
  vfx!: VFX
  private trailLayer!: Container
  private bodyLayer!: Container
  private fxLayer!: Container
  private gfxFor = new Map<string, Graphics>()
  private trailGfx = new Graphics()
  private trailBuf: { x: number; y: number }[] = new Array(10)
  private trailHead = 0
  private trailLen = 0
  private plungerGfx = new Graphics()
  private chargeRef = { charge: 0 }
  private initialized = false

  async init(canvas: HTMLCanvasElement): Promise<void> {
    this.app = new Application()
    await this.app.init({
      canvas,
      width: PLAYFIELD_WIDTH,
      height: PLAYFIELD_HEIGHT,
      background: '#05050d',
      antialias: true,
      resolution: window.devicePixelRatio || 1,
      autoDensity: true,
    })

    this.playfield = new Container()
    this.app.stage.addChild(this.playfield)

    // Deepest background
    const bg = new Graphics()
    bg.rect(0, 0, PLAYFIELD_WIDTH, PLAYFIELD_HEIGHT).fill({ color: 0x05050d })
    this.playfield.addChild(bg)

    // Starfield
    this.starfield = new Starfield(PLAYFIELD_WIDTH, PLAYFIELD_HEIGHT)
    this.playfield.addChild(this.starfield.container)

    // Glow strip at top
    const glow = new Graphics()
    glow.rect(0, 0, PLAYFIELD_WIDTH, 4).fill({ color: COLORS.accent, alpha: 0.6 })
    this.playfield.addChild(glow)

    // Trail layer (below bodies)
    this.trailLayer = new Container()
    this.trailLayer.addChild(this.trailGfx)
    this.playfield.addChild(this.trailLayer)

    // Body layer
    this.bodyLayer = new Container()
    this.playfield.addChild(this.bodyLayer)

    // Plunger visual (above bodies, below FX)
    this.bodyLayer.addChild(this.plungerGfx)

    // VFX (particles + popups) on top
    this.fxLayer = new Container()
    this.vfx = new VFX(this.fxLayer)
    this.playfield.addChild(this.fxLayer)

    this.initialized = true
  }

  syncFromPhysics(physics: PhysicsWorld): void {
    const seen = new Set<string>()
    let ball: GameBody | undefined
    for (const b of physics.bodies) {
      seen.add(b.id)
      if (b.id === 'ball') ball = b
      let g = this.gfxFor.get(b.id)
      if (!g) {
        g = this.buildGfx(b)
        this.gfxFor.set(b.id, g)
        this.bodyLayer.addChild(g)
      }
      g.position.set(b.x, b.y)
      g.rotation = b.angle
      g.visible = b.visible
    }
    for (const [id, g] of this.gfxFor) {
      if (!seen.has(id)) g.visible = false
    }

    // Rollover lit-state — re-tint when state flips
    for (const [id, tb] of physics.table.rolloverById) {
      const g = this.gfxFor.get(id)
      if (!g) continue
      const lit = physics.litRollovers.has(id)
      const tagged = g as Graphics & { __lit?: boolean }
      if (tagged.__lit === lit) continue
      tagged.__lit = lit
      if (tb.shape.type !== 'rect') continue
      g.clear()
        .rect(-tb.shape.w / 2, -tb.shape.h / 2, tb.shape.w, tb.shape.h)
        .fill({ color: lit ? COLORS.rolloverLit : COLORS.rolloverUnlit })
    }

    // Ball trail — ring buffer, no per-frame alloc.
    if (ball) {
      const cap = this.trailBuf.length
      this.trailBuf[this.trailHead] = { x: ball.x, y: ball.y }
      this.trailHead = (this.trailHead + 1) % cap
      if (this.trailLen < cap) this.trailLen++
      this.trailGfx.clear()
      for (let i = 0; i < this.trailLen - 1; i++) {
        const idx = (this.trailHead - this.trailLen + i + cap) % cap
        const p = this.trailBuf[idx]
        const t = (i + 1) / this.trailLen
        this.trailGfx
          .circle(p.x, p.y, BALL_RADIUS * t)
          .fill({ color: COLORS.accent, alpha: t * 0.35 })
      }
    }

    // Plunger visual
    const pv = physics.table.plungerVisual
    const charge = this.chargeRef.charge
    const drop = Math.min(12 * charge, 10)
    this.plungerGfx
      .clear()
      .rect(pv.x - pv.w / 2, pv.y + drop, pv.w, pv.h)
      .fill({ color: COLORS.ball })
      .rect(pv.x - pv.w / 2 - 2, pv.y + drop, 2, pv.h)
      .fill({ color: COLORS.accent })
  }

  setCharge(charge: number): void {
    this.chargeRef.charge = charge
  }

  tick(dtMs: number): void {
    this.starfield?.update(dtMs)
    this.vfx?.update(dtMs)
  }

  private buildGfx(b: GameBody): Graphics {
    const g = new Graphics()
    const fill = colorFor(b.kind)
    if (b.shape.type === 'circle') {
      g.circle(0, 0, b.shape.r).fill({ color: fill })
      if (b.kind === 'bumper') {
        g.circle(0, 0, b.shape.r * 0.55).fill({ color: 0xffffff, alpha: 0.3 })
      }
      if (b.kind === 'post') {
        g.circle(0, 0, b.shape.r * 0.5).fill({ color: 0xffffff, alpha: 0.4 })
      }
      if (b.kind === 'ball') {
        g.circle(-3, -3, b.shape.r * 0.4).fill({ color: 0xffffff, alpha: 0.6 })
      }
    } else {
      const w = b.shape.w
      const h = b.shape.h
      if (b.kind === 'flipperLeft') {
        g.roundRect(0, -h / 2, w, h, h / 2).fill({ color: fill })
      } else if (b.kind === 'flipperRight') {
        g.roundRect(-w, -h / 2, w, h, h / 2).fill({ color: fill })
      } else {
        g.rect(-w / 2, -h / 2, w, h).fill({ color: fill })
      }
    }
    return g
  }

  fit(containerWidth: number, containerHeight: number): void {
    if (!this.initialized) return
    const aspect = PLAYFIELD_WIDTH / PLAYFIELD_HEIGHT
    let w = containerWidth
    let h = containerWidth / aspect
    if (h > containerHeight) {
      h = containerHeight
      w = containerHeight * aspect
    }
    const canvas = this.app.canvas
    canvas.style.width = `${w}px`
    canvas.style.height = `${h}px`
  }

  destroy(): void {
    if (this.initialized) {
      this.app.destroy(false, { children: true })
      this.initialized = false
    }
    this.gfxFor.clear()
    this.trailHead = 0
    this.trailLen = 0
  }
}
