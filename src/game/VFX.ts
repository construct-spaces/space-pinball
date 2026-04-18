import { Container, Graphics, Text, TextStyle } from 'pixi.js'

interface Particle {
  g: Graphics
  x: number
  y: number
  vx: number
  vy: number
  life: number
  maxLife: number
  size: number
  color: number
}

interface Popup {
  t: Text
  x: number
  y: number
  life: number
  maxLife: number
}

const POPUP_STYLE = new TextStyle({
  fontFamily: 'ui-monospace, Menlo, monospace',
  fontSize: 18,
  fontWeight: '700',
  fill: 0xffd166,
  stroke: { color: 0x000000, width: 3 },
})

/**
 * Tiny effects module: short-lived particle sparks + floating score popups.
 * Owns its own Container; caller adds it to the scene.
 */
export class VFX {
  private particles: Particle[] = []
  private popups: Popup[] = []

  constructor(private container: Container) {}

  burst(x: number, y: number, color: number, count = 8): void {
    for (let i = 0; i < count; i++) {
      const a = (Math.PI * 2 * i) / count + Math.random() * 0.4
      const speed = 80 + Math.random() * 80
      const g = new Graphics()
      const size = 2 + Math.random() * 2
      g.circle(0, 0, size).fill({ color })
      g.position.set(x, y)
      this.container.addChild(g)
      this.particles.push({
        g,
        x,
        y,
        vx: Math.cos(a) * speed,
        vy: Math.sin(a) * speed,
        life: 0,
        maxLife: 400 + Math.random() * 120,
        size,
        color,
      })
    }
  }

  popup(x: number, y: number, text: string): void {
    const t = new Text({ text, style: POPUP_STYLE })
    t.anchor.set(0.5, 0.5)
    t.position.set(x, y)
    this.container.addChild(t)
    this.popups.push({ t, x, y, life: 0, maxLife: 700 })
  }

  update(dtMs: number): void {
    const dt = dtMs / 1000
    // particles
    for (let i = this.particles.length - 1; i >= 0; i--) {
      const p = this.particles[i]
      p.life += dtMs
      if (p.life >= p.maxLife) {
        p.g.destroy()
        this.particles.splice(i, 1)
        continue
      }
      p.x += p.vx * dt
      p.y += p.vy * dt
      p.vy += 120 * dt
      p.g.position.set(p.x, p.y)
      p.g.alpha = 1 - p.life / p.maxLife
    }
    // popups
    for (let i = this.popups.length - 1; i >= 0; i--) {
      const u = this.popups[i]
      u.life += dtMs
      if (u.life >= u.maxLife) {
        u.t.destroy()
        this.popups.splice(i, 1)
        continue
      }
      const t = u.life / u.maxLife
      u.t.position.set(u.x, u.y - 40 * t)
      u.t.alpha = 1 - t
    }
  }

  clear(): void {
    for (const p of this.particles) p.g.destroy()
    for (const u of this.popups) u.t.destroy()
    this.particles.length = 0
    this.popups.length = 0
  }
}
