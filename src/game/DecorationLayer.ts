import { Container, Graphics, Text as PixiText } from 'pixi.js'
import type { Decor, Layout, TriggerEvent } from '../editor/types'
import type { EventBus } from './events'

export interface BusEvent {
  type: string
  sourceId?: string
}

export function matchesTrigger(event: BusEvent, trigger: TriggerEvent): boolean {
  if (event.type !== trigger.type) return false
  if (trigger.type === 'hit') {
    return (trigger as { type: 'hit'; sourceId: string }).sourceId === event.sourceId
  }
  return true
}

interface ActiveAnim {
  decor: Decor
  startMs: number
  durationMs: number
}

interface Particle extends Graphics {
  __life?: number
  __vx?: number
  __vy?: number
  __start?: number
}

const TRIGGERED_DURATION_MS = 600
const PARTICLE_LIFE_MS = 600

export class DecorationLayer {
  readonly container = new Container()
  private gfxFor = new Map<string, Container>()
  private active: ActiveAnim[] = []
  private disposers: Array<() => void> = []
  private layout: Layout | null = null
  private elapsedMs = 0

  init(layout: Layout, bus: EventBus): void {
    this.layout = layout
    this.elapsedMs = 0
    for (const d of layout.decorations ?? []) {
      this.spawn(d)
    }
    this.disposers.push(
      bus.on('hit', ({ kind }) => this.dispatch({ type: kind })),
    )
    this.disposers.push(
      bus.on('score', ({ reason }) => this.dispatch({ type: reason })),
    )
    this.disposers.push(bus.on('ballLost', () => this.dispatch({ type: 'ballLost' })))
    this.disposers.push(bus.on('gameOver', () => this.dispatch({ type: 'gameOver' })))
  }

  private spawn(d: Decor): void {
    const node = new Container()
    node.position.set(d.x, d.y)
    if (d.kind === 'light') {
      const g = new Graphics()
      const color = parseInt(d.color.replace('#', ''), 16)
      g.circle(0, 0, d.r).fill({ color, alpha: d.intensity * 0.4 })
      g.circle(0, 0, d.r * 0.5).fill({ color, alpha: d.intensity })
      node.addChild(g)
    } else if (d.kind === 'text') {
      const t = new PixiText({
        text: d.text,
        style: { fill: d.color, fontSize: d.size, fontFamily: 'monospace' },
      })
      t.anchor.set(0.5)
      node.addChild(t)
      if (d.trigger) node.alpha = 0
    } else if (d.kind === 'emitter') {
      node.alpha = 0
    }
    this.container.addChild(node)
    this.gfxFor.set(d.id, node)
  }

  private dispatch(event: BusEvent): void {
    if (!this.layout) return
    for (const d of this.layout.decorations ?? []) {
      if (d.trigger && matchesTrigger(event, d.trigger)) {
        if (d.kind === 'emitter') {
          this.burst(d)
        } else {
          this.active.push({ decor: d, startMs: this.elapsedMs, durationMs: TRIGGERED_DURATION_MS })
          const node = this.gfxFor.get(d.id)
          if (node) node.alpha = 1
        }
      }
    }
  }

  private burst(d: Extract<Decor, { kind: 'emitter' }>): void {
    const color = parseInt(d.color.replace('#', ''), 16)
    for (let i = 0; i < d.count; i++) {
      const angle = (Math.random() - 0.5) * d.spread
      const speed = d.speed * (0.6 + Math.random() * 0.4)
      const p: Particle = new Graphics()
      p.circle(0, 0, 2).fill({ color })
      p.position.set(d.x, d.y)
      this.container.addChild(p)
      p.__life = PARTICLE_LIFE_MS
      p.__vx = Math.cos(angle) * speed
      p.__vy = Math.sin(angle) * speed
      p.__start = this.elapsedMs
    }
  }

  tick(dtMs: number): void {
    this.elapsedMs += dtMs
    for (const d of this.layout?.decorations ?? []) {
      if (d.trigger) continue
      if (d.kind !== 'light') continue
      const node = this.gfxFor.get(d.id)
      if (!node) continue
      node.alpha = 0.7 + Math.sin(this.elapsedMs * 0.003) * 0.3
    }
    this.active = this.active.filter((a) => {
      const t = (this.elapsedMs - a.startMs) / a.durationMs
      const node = this.gfxFor.get(a.decor.id)
      if (t >= 1) {
        if (node) node.alpha = a.decor.trigger ? 0 : 1
        return false
      }
      if (node) node.alpha = 1 - t
      return true
    })
    for (const child of [...this.container.children]) {
      const p = child as Particle
      if (p.__life === undefined) continue
      const age = this.elapsedMs - (p.__start ?? 0)
      if (age >= p.__life) {
        this.container.removeChild(p)
        continue
      }
      const dt = dtMs / 1000
      p.x += (p.__vx ?? 0) * dt
      p.y += (p.__vy ?? 0) * dt
      p.alpha = 1 - age / p.__life
    }
  }

  destroy(): void {
    for (const d of this.disposers) d()
    this.disposers = []
    this.container.removeChildren()
    this.gfxFor.clear()
    this.active = []
    this.layout = null
  }
}
