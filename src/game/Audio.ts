import type { EventBus } from './events'

/**
 * Web Audio synth: short envelope-shaped blips + chord stacks.
 */
export class Audio {
  private ctx: AudioContext | null = null
  private enabled = true
  private dispose: (() => void)[] = []

  constructor(private bus: EventBus) {}

  attach(): void {
    this.dispose.push(
      this.bus.on('score', ({ reason }) => {
        switch (reason) {
          case 'bumper':
            this.blip(440, 0.09, 'triangle')
            break
          case 'slingshot':
            this.blip(660, 0.06, 'triangle')
            break
          case 'dropTarget':
            this.blip(880, 0.05, 'sine')
            break
          case 'dropTargetBank':
            this.chord([523, 659, 784], 0.28)
            break
        }
      }),
    )
    this.dispose.push(this.bus.on('ballLost', () => this.blip(120, 0.35, 'sawtooth')))
    this.dispose.push(this.bus.on('ballLaunched', () => this.blip(320, 0.15, 'square')))
    this.dispose.push(this.bus.on('gameOver', () => this.chord([220, 196, 165], 0.6)))
  }

  setEnabled(on: boolean): void {
    this.enabled = on
  }

  private ensureCtx(): AudioContext | null {
    if (!this.enabled) return null
    if (!this.ctx) {
      try {
        const Ctor =
          window.AudioContext ||
          (window as unknown as { webkitAudioContext?: typeof AudioContext })
            .webkitAudioContext
        if (!Ctor) return null
        this.ctx = new Ctor()
      } catch {
        return null
      }
    }
    // Resume from suspended (browser autoplay policy)
    if (this.ctx.state === 'suspended') {
      void this.ctx.resume()
    }
    return this.ctx
  }

  private blip(
    freq: number,
    dur: number,
    type: OscillatorType = 'sine',
    peak = 0.28,
    masterGain?: GainNode,
  ): void {
    const ctx = this.ensureCtx()
    if (!ctx) return
    const osc = ctx.createOscillator()
    const gain = ctx.createGain()
    osc.type = type
    osc.frequency.value = freq
    const now = ctx.currentTime
    // 5ms attack, exponential decay to near-zero
    gain.gain.setValueAtTime(0.0001, now)
    gain.gain.exponentialRampToValueAtTime(peak, now + 0.005)
    gain.gain.exponentialRampToValueAtTime(0.0001, now + dur)
    osc.connect(gain).connect(masterGain ?? ctx.destination)
    osc.start(now)
    osc.stop(now + dur + 0.02)
  }

  private chord(freqs: number[], dur: number): void {
    const ctx = this.ensureCtx()
    if (!ctx) return
    const master = ctx.createGain()
    master.gain.value = 0.3
    master.connect(ctx.destination)
    freqs.forEach((f, i) => {
      setTimeout(() => this.blip(f, dur * 0.8, 'triangle', 0.3, master), i * 70)
    })
    setTimeout(() => master.disconnect(), (freqs.length * 70 + dur * 1000 + 100) | 0)
  }

  destroy(): void {
    for (const d of this.dispose) d()
    this.dispose = []
    if (this.ctx) {
      this.ctx.close().catch(() => {})
      this.ctx = null
    }
  }
}
