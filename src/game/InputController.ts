import type { PhysicsWorld } from './PhysicsWorld'

/**
 * Keyboard → game actions.
 *   ←/A / →/D   flippers (hold)
 *   Space       hold-to-charge plunger; release fires
 *   P           pause
 *   R           restart
 */
export class InputController {
  private leftKeys = new Set(['ArrowLeft', 'KeyA'])
  private rightKeys = new Set(['ArrowRight', 'KeyD'])
  private launchKeys = new Set(['Space'])
  private pauseKeys = new Set(['KeyP'])
  private restartKeys = new Set(['KeyR'])
  private bound = false

  constructor(
    private physics: PhysicsWorld,
    private callbacks: {
      onLaunchDown: () => void
      onLaunchUp: () => void
      onPauseToggle: () => void
      onRestart: () => void
    },
  ) {}

  attach(): void {
    if (this.bound) return
    this.bound = true
    window.addEventListener('keydown', this.onKeyDown)
    window.addEventListener('keyup', this.onKeyUp)
    window.addEventListener('blur', this.onBlur)
  }

  destroy(): void {
    if (!this.bound) return
    this.bound = false
    window.removeEventListener('keydown', this.onKeyDown)
    window.removeEventListener('keyup', this.onKeyUp)
    window.removeEventListener('blur', this.onBlur)
  }

  private onKeyDown = (e: KeyboardEvent): void => {
    if (e.repeat) return
    if (this.leftKeys.has(e.code)) {
      this.physics.setFlipper('left', true)
      e.preventDefault()
    } else if (this.rightKeys.has(e.code)) {
      this.physics.setFlipper('right', true)
      e.preventDefault()
    } else if (this.launchKeys.has(e.code)) {
      this.callbacks.onLaunchDown()
      e.preventDefault()
    } else if (this.pauseKeys.has(e.code)) {
      this.callbacks.onPauseToggle()
      e.preventDefault()
    } else if (this.restartKeys.has(e.code)) {
      this.callbacks.onRestart()
      e.preventDefault()
    }
  }

  private onKeyUp = (e: KeyboardEvent): void => {
    if (this.leftKeys.has(e.code)) {
      this.physics.setFlipper('left', false)
      e.preventDefault()
    } else if (this.rightKeys.has(e.code)) {
      this.physics.setFlipper('right', false)
      e.preventDefault()
    } else if (this.launchKeys.has(e.code)) {
      this.callbacks.onLaunchUp()
      e.preventDefault()
    }
  }

  private onBlur = (): void => {
    this.physics.setFlipper('left', false)
    this.physics.setFlipper('right', false)
  }
}
