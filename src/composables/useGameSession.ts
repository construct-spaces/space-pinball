import { ref } from 'vue'

/**
 * Reactive game session state bridge. A Vue-friendly mirror of PinballGame's
 * mutable state — the page writes into these refs via PinballGame callbacks.
 */
export function useGameSession() {
  const score = ref(0)
  const multiplier = ref(1)
  const combo = ref(0)
  const charge = ref(0)
  const balls = ref(3)
  const gameOver = ref(false)
  const finalScore = ref(0)
  const durationMs = ref(0)
  const ballsUsed = ref(0)

  function reset() {
    score.value = 0
    multiplier.value = 1
    combo.value = 0
    charge.value = 0
    balls.value = 3
    gameOver.value = false
    finalScore.value = 0
    durationMs.value = 0
    ballsUsed.value = 0
  }

  return {
    score,
    multiplier,
    combo,
    charge,
    balls,
    gameOver,
    finalScore,
    durationMs,
    ballsUsed,
    reset,
  }
}
