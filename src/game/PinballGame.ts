import { PhysicsWorld } from './PhysicsWorld'
import { Renderer } from './Renderer'
import type { Layout } from '../editor/types'
import { GameLoop } from './GameLoop'
import { InputController } from './InputController'
import { Scoring } from './Scoring'
import { Audio } from './Audio'
import { EventBus } from './events'
import { COLORS } from './palette'
import { STARTING_BALLS } from './constants'

export interface GameCallbacks {
  onScoreChanged?: (score: number, multiplier: number) => void
  onBallsChanged?: (balls: number) => void
  onComboChanged?: (combo: number, multiplier: number) => void
  onChargeChanged?: (charge: number) => void
  onGameOver?: (finalScore: number, ballsUsed: number, durationMs: number) => void
  onReady?: () => void
}

export type GameState = 'idle' | 'ready' | 'playing' | 'paused' | 'gameover'

/**
 * Top-level orchestrator. Owns physics, renderer, loop, input, scoring, audio.
 */
export class PinballGame {
  bus = new EventBus()
  physics: PhysicsWorld
  renderer: Renderer
  loop: GameLoop
  input: InputController
  scoring: Scoring
  audio: Audio

  state: GameState = 'idle'
  ballsRemaining = STARTING_BALLS
  private startedAt = 0
  private ballInPlay = false

  constructor(private callbacks: GameCallbacks = {}) {
    this.physics = new PhysicsWorld(this.bus)
    this.renderer = new Renderer()
    this.scoring = new Scoring(this.bus)
    this.audio = new Audio(this.bus)
    this.loop = new GameLoop(
      () => this.physics.step(),
      () => {
        this.renderer.syncFromPhysics(this.physics)
        this.renderer.setCharge(this.physics.chargeLevel)
      },
      (dt) => this.renderer.tick(dt),
    )
    this.input = new InputController(this.physics, {
      onLaunchDown: () => this.onLaunchDown(),
      onLaunchUp: () => this.onLaunchUp(),
      onPauseToggle: () => this.togglePause(),
      onRestart: () => this.restart(),
    })
  }

  async mount(canvas: HTMLCanvasElement, customLayout?: Layout): Promise<void> {
    await this.physics.init(customLayout)
    await this.renderer.init(canvas)
    this.scoring.attach()
    this.audio.attach()
    this.input.attach()

    this.bus.on('scoreChanged', ({ score, multiplier }) => {
      this.callbacks.onScoreChanged?.(score, multiplier)
    })
    this.bus.on('comboChanged', ({ combo, multiplier }) => {
      this.callbacks.onComboChanged?.(combo, multiplier)
    })
    this.bus.on('chargeChanged', ({ charge }) => {
      this.callbacks.onChargeChanged?.(charge)
    })
    this.bus.on('ballLost', () => this.onBallLost())

    // Wire VFX particle bursts and score popups.
    this.bus.on('hit', ({ kind, x, y }) => {
      if (kind === 'bumper') this.renderer.vfx.burst(x, y, COLORS.bumper, 10)
      else if (kind === 'slingshot') this.renderer.vfx.burst(x, y, COLORS.slingshot, 8)
      else if (kind === 'rollover') this.renderer.vfx.burst(x, y, COLORS.rolloverLit, 6)
    })
    this.bus.on('score', ({ points, x, y, reason }) => {
      if (x == null || y == null) return
      const shown = Math.round(points * this.scoring.multiplier)
      const label = reason === 'rolloverBank' ? `BANK +${shown}` : `+${shown}`
      this.renderer.vfx.popup(x, y, label)
    })

    this.state = 'ready'
    this.startedAt = performance.now()
    this.ballsRemaining = STARTING_BALLS
    this.callbacks.onBallsChanged?.(this.ballsRemaining)
    this.callbacks.onReady?.()

    this.loop.start()
  }

  private canLaunch(): boolean {
    if (this.state === 'gameover' || this.state === 'paused') return false
    // Ready to launch, OR ball has rolled back into the lane and is resting there.
    return !this.ballInPlay || this.physics.isBallInLane()
  }

  private onLaunchDown(): void {
    if (!this.canLaunch()) return
    this.physics.startCharge()
  }

  private onLaunchUp(): void {
    if (!this.canLaunch()) return
    this.physics.releaseCharge()
    this.ballInPlay = true
    this.state = 'playing'
  }

  /** Public launch (Start button or external click). Fires at fixed power. */
  launch(): void {
    if (!this.canLaunch()) return
    this.physics.launchBall(0.75)
    this.ballInPlay = true
    this.state = 'playing'
  }

  private onBallLost(): void {
    if (!this.ballInPlay) return
    this.ballInPlay = false
    this.ballsRemaining -= 1
    this.callbacks.onBallsChanged?.(this.ballsRemaining)
    if (this.ballsRemaining <= 0) {
      this.gameOver()
    } else {
      this.physics.resetBall()
      this.state = 'ready'
    }
  }

  private gameOver(): void {
    this.state = 'gameover'
    const duration = performance.now() - this.startedAt
    this.bus.emit('gameOver', {
      finalScore: this.scoring.score,
      ballsUsed: STARTING_BALLS,
      durationMs: duration,
    })
    this.callbacks.onGameOver?.(this.scoring.score, STARTING_BALLS, duration)
  }

  togglePause(): void {
    if (this.state === 'gameover') return
    if (this.loop.isPaused) {
      this.loop.resume()
      this.state = this.ballInPlay ? 'playing' : 'ready'
    } else {
      this.loop.pause()
      this.state = 'paused'
    }
  }

  async restart(): Promise<void> {
    // Pause the RAF loop so `physics.step()` doesn't run against a freed world
    // while `fullReset()` awaits Rapier re-init.
    const wasPaused = this.loop.isPaused
    if (!wasPaused) this.loop.pause()
    try {
      await this.physics.fullReset()
      this.renderer.vfx.clear()
      this.scoring.reset()
      this.ballsRemaining = STARTING_BALLS
      this.ballInPlay = false
      this.startedAt = performance.now()
      this.state = 'ready'
      this.callbacks.onBallsChanged?.(this.ballsRemaining)
    } finally {
      if (!wasPaused) this.loop.resume()
    }
  }

  fit(w: number, h: number): void {
    this.renderer.fit(w, h)
  }

  destroy(): void {
    this.loop.stop()
    this.input.destroy()
    this.scoring.destroy()
    this.audio.destroy()
    this.renderer.destroy()
    this.physics.destroy()
    this.bus.clear()
  }
}
