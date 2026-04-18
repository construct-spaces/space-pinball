import { COMBO_MAX, COMBO_WINDOW_MS } from './constants'
import type { EventBus } from './events'

/**
 * Tracks score + combo. Successive scoring hits within COMBO_WINDOW_MS bump
 * combo count up to COMBO_MAX; inactivity resets to 0.
 * multiplier = 1 + (combo - 1) * 0.5 when combo >= 1, else 1.
 */
export class Scoring {
  score = 0
  combo = 0
  multiplier = 1
  private lastScoreAt = 0
  private disposers: (() => void)[] = []
  private decayTimer: ReturnType<typeof setTimeout> | null = null

  constructor(private bus: EventBus) {}

  attach(): void {
    this.disposers.push(
      this.bus.on('score', ({ points }) => {
        const now = performance.now()
        if (now - this.lastScoreAt <= COMBO_WINDOW_MS && this.combo > 0) {
          this.combo = Math.min(COMBO_MAX, this.combo + 1)
        } else {
          this.combo = 1
        }
        this.multiplier = 1 + (this.combo - 1) * 0.5
        this.lastScoreAt = now
        this.score += Math.round(points * this.multiplier)
        this.bus.emit('scoreChanged', { score: this.score, multiplier: this.multiplier })
        this.bus.emit('comboChanged', { combo: this.combo, multiplier: this.multiplier })
        this.scheduleDecay()
      }),
    )
  }

  private scheduleDecay(): void {
    if (this.decayTimer) clearTimeout(this.decayTimer)
    this.decayTimer = setTimeout(() => {
      this.combo = 0
      this.multiplier = 1
      this.bus.emit('comboChanged', { combo: 0, multiplier: 1 })
      this.bus.emit('scoreChanged', { score: this.score, multiplier: 1 })
    }, COMBO_WINDOW_MS)
  }

  reset(): void {
    this.score = 0
    this.combo = 0
    this.multiplier = 1
    this.lastScoreAt = 0
    if (this.decayTimer) {
      clearTimeout(this.decayTimer)
      this.decayTimer = null
    }
    this.bus.emit('scoreChanged', { score: 0, multiplier: 1 })
    this.bus.emit('comboChanged', { combo: 0, multiplier: 1 })
  }

  destroy(): void {
    for (const d of this.disposers) d()
    this.disposers = []
    if (this.decayTimer) {
      clearTimeout(this.decayTimer)
      this.decayTimer = null
    }
  }
}
