import { Application, Container, Graphics } from 'pixi.js'
import {
  type Element,
  type Layout,
  RECT_KINDS,
  CIRCLE_KINDS,
  FLIPPER_KINDS,
  POLYLINE_KINDS,
} from './types'
import { colorFor } from '../game/palette'
import { BALL_RADIUS, FLIPPER_LENGTH, FLIPPER_THICKNESS } from '../game/constants'
import type { BodyKind } from '../game/bodies'

const BALL_START_ID = '__ballStart__'

const GRID_COLOR = 0x18182a
const SELECT_COLOR = 0x00e5ff

export class EditorRenderer {
  private app!: Application
  private bodyLayer!: Container
  private gridLayer!: Container
  private overlay!: Container
  private selectionGfx = new Graphics()
  private gridSize = 10

  async init(canvas: HTMLCanvasElement, layout: Layout): Promise<void> {
    this.app = new Application()
    await this.app.init({
      canvas,
      width: layout.width,
      height: layout.height,
      background: '#05050d',
      antialias: true,
      resolution: window.devicePixelRatio || 1,
      autoDensity: true,
    })
    this.gridLayer = new Container()
    this.bodyLayer = new Container()
    this.overlay = new Container()
    this.overlay.addChild(this.selectionGfx)
    this.app.stage.addChild(this.gridLayer)
    this.app.stage.addChild(this.bodyLayer)
    this.app.stage.addChild(this.overlay)
    this.drawGrid(layout.width, layout.height)
  }

  private drawGrid(w: number, h: number): void {
    const g = new Graphics()
    for (let x = 0; x <= w; x += this.gridSize) {
      g.moveTo(x, 0).lineTo(x, h)
    }
    for (let y = 0; y <= h; y += this.gridSize) {
      g.moveTo(0, y).lineTo(w, y)
    }
    g.stroke({ color: GRID_COLOR, width: 1, alpha: 0.5 })
    this.gridLayer.addChild(g)
  }

  render(layout: Layout, selectedId?: string): void {
    this.bodyLayer.removeChildren()
    for (const e of layout.elements) {
      const g = new Graphics()
      this.drawElement(g, e)
      this.bodyLayer.addChild(g)
    }
    // Ball-start marker (ghost ball)
    const bs = new Graphics()
    bs.circle(0, 0, BALL_RADIUS)
      .fill({ color: 0xf5f5fa, alpha: 0.25 })
      .circle(0, 0, BALL_RADIUS)
      .stroke({ color: 0xf5f5fa, width: 2, alpha: 0.7 })
    bs.position.set(layout.ballStart.x, layout.ballStart.y)
    this.bodyLayer.addChild(bs)
    this.drawSelection(layout, selectedId)
  }

  private drawElement(g: Graphics, e: Element): void {
    const fill = colorFor(e.kind as BodyKind)
    if (RECT_KINDS.has(e.kind)) {
      const r = e as Extract<Element, { kind: 'wall' | 'slingshot' | 'rollover' | 'drain' }>
      g.rect(-r.w / 2, -r.h / 2, r.w, r.h).fill({ color: fill })
      g.position.set(r.x, r.y)
      g.rotation = r.angle
    } else if (CIRCLE_KINDS.has(e.kind)) {
      const c = e as Extract<Element, { kind: 'bumper' | 'peg' }>
      g.circle(0, 0, c.r).fill({ color: fill })
      g.position.set(c.x, c.y)
    } else if (FLIPPER_KINDS.has(e.kind)) {
      const f = e as Extract<Element, { kind: 'flipperLeft' | 'flipperRight' }>
      const w = FLIPPER_LENGTH
      const h = FLIPPER_THICKNESS
      if (f.kind === 'flipperLeft') {
        g.roundRect(0, -h / 2, w, h, h / 2).fill({ color: fill })
      } else {
        g.roundRect(-w, -h / 2, w, h, h / 2).fill({ color: fill })
      }
      g.position.set(f.x, f.y)
    } else if (POLYLINE_KINDS.has(e.kind)) {
      const p = e as Extract<Element, { kind: 'arcRail' | 'gateRail' }>
      if (p.points.length === 0) return
      g.moveTo(p.points[0].x, p.points[0].y)
      for (let i = 1; i < p.points.length; i++) g.lineTo(p.points[i].x, p.points[i].y)
      g.stroke({ color: fill, width: p.thickness })
    }
  }

  private drawSelection(layout: Layout, selectedId?: string): void {
    this.selectionGfx.clear()
    if (!selectedId) return
    if (selectedId === BALL_START_ID) {
      this.selectionGfx
        .circle(0, 0, BALL_RADIUS + 4)
        .stroke({ color: SELECT_COLOR, width: 2 })
      this.selectionGfx.position.set(layout.ballStart.x, layout.ballStart.y)
      this.selectionGfx.rotation = 0
      return
    }
    const elements = layout.elements
    const e = elements.find((x) => x.id === selectedId)
    if (!e) return
    if (RECT_KINDS.has(e.kind)) {
      const r = e as Extract<Element, { kind: 'wall' | 'slingshot' | 'rollover' | 'drain' }>
      this.selectionGfx
        .rect(-r.w / 2 - 3, -r.h / 2 - 3, r.w + 6, r.h + 6)
        .stroke({ color: SELECT_COLOR, width: 2 })
      this.selectionGfx.position.set(r.x, r.y)
      this.selectionGfx.rotation = r.angle
    } else if (CIRCLE_KINDS.has(e.kind)) {
      const c = e as Extract<Element, { kind: 'bumper' | 'peg' }>
      this.selectionGfx
        .circle(0, 0, c.r + 3)
        .stroke({ color: SELECT_COLOR, width: 2 })
      this.selectionGfx.position.set(c.x, c.y)
      this.selectionGfx.rotation = 0
    } else if (FLIPPER_KINDS.has(e.kind)) {
      const f = e as Extract<Element, { kind: 'flipperLeft' | 'flipperRight' }>
      this.selectionGfx
        .rect(
          -FLIPPER_LENGTH / 2 - 3,
          -FLIPPER_THICKNESS / 2 - 3,
          FLIPPER_LENGTH + 6,
          FLIPPER_THICKNESS + 6,
        )
        .stroke({ color: SELECT_COLOR, width: 2 })
      this.selectionGfx.position.set(f.x, f.y)
      this.selectionGfx.rotation = 0
    } else if (POLYLINE_KINDS.has(e.kind)) {
      const p = e as Extract<Element, { kind: 'arcRail' | 'gateRail' }>
      if (p.points.length === 0) return
      this.selectionGfx.moveTo(p.points[0].x, p.points[0].y)
      for (let i = 1; i < p.points.length; i++) {
        this.selectionGfx.lineTo(p.points[i].x, p.points[i].y)
      }
      this.selectionGfx.stroke({ color: SELECT_COLOR, width: p.thickness + 4, alpha: 0.4 })
      this.selectionGfx.position.set(0, 0)
      this.selectionGfx.rotation = 0
    }
  }

  destroy(): void {
    this.app?.destroy(false, { children: true })
  }
}
