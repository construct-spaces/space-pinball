// Minimal typed event bus for game events (score, ball lost, game over, etc.)

import type { BodyKind } from './bodies'

export type GameEventMap = {
  score: { points: number; reason: string; x?: number; y?: number }
  hit: { kind: BodyKind; x: number; y: number }
  ballLost: void
  ballLaunched: void
  gameStarted: void
  gameOver: { finalScore: number; ballsUsed: number; durationMs: number }
  scoreChanged: { score: number; multiplier: number }
  ballsChanged: { balls: number }
  comboChanged: { combo: number; multiplier: number }
  chargeChanged: { charge: number }
  rolloverLit: { id: string }
  teleport: { fromX: number; fromY: number; toX: number; toY: number }
}

type Handler<T> = (payload: T) => void

export class EventBus {
  private listeners = new Map<keyof GameEventMap, Set<Handler<unknown>>>()

  on<K extends keyof GameEventMap>(event: K, handler: Handler<GameEventMap[K]>): () => void {
    let set = this.listeners.get(event)
    if (!set) {
      set = new Set()
      this.listeners.set(event, set)
    }
    set.add(handler as Handler<unknown>)
    return () => set!.delete(handler as Handler<unknown>)
  }

  emit<K extends keyof GameEventMap>(event: K, payload: GameEventMap[K]): void {
    const set = this.listeners.get(event)
    if (!set) return
    for (const h of set) {
      try {
        ;(h as Handler<GameEventMap[K]>)(payload)
      } catch (err) {
        console.error('[EventBus] handler error', event, err)
      }
    }
  }

  clear(): void {
    this.listeners.clear()
  }
}
