import { MAX_ACCUMULATED_MS, PHYSICS_STEP_MS } from './constants'

export type StepFn = (deltaMs: number) => void
export type RenderFn = () => void
export type TickFn = (deltaMs: number) => void

/**
 * Fixed-step game loop with requestAnimationFrame. Clamps accumulated time to
 * avoid huge jumps when the tab is inactive.
 */
export class GameLoop {
  private rafId = 0
  private running = false
  private paused = false
  private lastTime = 0
  private accumulator = 0

  constructor(
    private step: StepFn,
    private render: RenderFn,
    private onTick: TickFn = () => {},
  ) {}

  start(): void {
    if (this.running) return
    this.running = true
    this.paused = false
    this.lastTime = performance.now()
    this.accumulator = 0
    this.tick()
  }

  stop(): void {
    this.running = false
    cancelAnimationFrame(this.rafId)
  }

  pause(): void {
    this.paused = true
  }

  resume(): void {
    if (!this.paused) return
    this.paused = false
    this.lastTime = performance.now()
    this.accumulator = 0
  }

  get isRunning() {
    return this.running
  }
  get isPaused() {
    return this.paused
  }

  private tick = (): void => {
    if (!this.running) return
    this.rafId = requestAnimationFrame(this.tick)
    const now = performance.now()
    let frame = now - this.lastTime
    this.lastTime = now
    if (this.paused) return
    if (frame > MAX_ACCUMULATED_MS) frame = MAX_ACCUMULATED_MS
    this.accumulator += frame

    let safety = 10
    while (this.accumulator >= PHYSICS_STEP_MS && safety-- > 0) {
      this.step(PHYSICS_STEP_MS)
      this.accumulator -= PHYSICS_STEP_MS
    }
    this.onTick(frame)
    this.render()
  }
}
