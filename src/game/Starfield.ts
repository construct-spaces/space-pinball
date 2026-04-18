import { Container, Graphics } from 'pixi.js'

interface Star {
  x: number
  y: number
  vy: number
  size: number
  phase: number
  baseAlpha: number
}

/**
 * Animated star background with two parallax layers. Uses a single Graphics
 * per layer, redrawn each tick (cheap at these counts).
 */
export class Starfield {
  container = new Container()
  private gfx = new Graphics()
  private stars: Star[] = []
  private t = 0

  constructor(private w: number, private h: number) {
    this.container.addChild(this.gfx)
    this.generate()
  }

  private generate(): void {
    this.stars.length = 0
    for (let i = 0; i < 120; i++) {
      this.stars.push({
        x: Math.random() * this.w,
        y: Math.random() * this.h,
        vy: 6,
        size: 0.8 + Math.random() * 0.6,
        phase: Math.random() * Math.PI * 2,
        baseAlpha: 0.25 + Math.random() * 0.2,
      })
    }
    for (let i = 0; i < 40; i++) {
      this.stars.push({
        x: Math.random() * this.w,
        y: Math.random() * this.h,
        vy: 18,
        size: 1.2 + Math.random() * 0.8,
        phase: Math.random() * Math.PI * 2,
        baseAlpha: 0.5 + Math.random() * 0.3,
      })
    }
  }

  update(dtMs: number): void {
    const dt = dtMs / 1000
    this.t += dt
    this.gfx.clear()
    for (const s of this.stars) {
      s.y += s.vy * dt
      if (s.y > this.h) {
        s.y = -2
        s.x = Math.random() * this.w
      }
      const twinkle = 0.7 + 0.3 * Math.sin(this.t * 2 + s.phase)
      this.gfx.circle(s.x, s.y, s.size).fill({ color: 0xffffff, alpha: s.baseAlpha * twinkle })
    }
  }
}
