import { ref, onMounted } from 'vue'
import { useGraph } from '@construct-space/graph'
import { HighScore } from '../models/HighScore'

export interface HighScoreRow {
  id: string
  table: string
  score: number
  balls: number
  duration?: number
  playerName?: string
  created_at: string
  updated_at: string
  createdAt?: string | Date
  local?: boolean
  [key: string]: unknown
}

const STORAGE_KEY = 'pinball:highscores'
const STORAGE_LIMIT = 20

function readLocal(table: string): HighScoreRow[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return []
    const all = JSON.parse(raw) as HighScoreRow[]
    return all.filter((r) => r.table === table)
  } catch {
    return []
  }
}

function writeLocal(table: string, row: HighScoreRow): void {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    const all = raw ? (JSON.parse(raw) as HighScoreRow[]) : []
    all.push(row)
    // Keep only top N per table
    const byTable = new Map<string, HighScoreRow[]>()
    for (const r of all) {
      const list = byTable.get(r.table) ?? []
      list.push(r)
      byTable.set(r.table, list)
    }
    const trimmed: HighScoreRow[] = []
    for (const [, list] of byTable) {
      list.sort((a, b) => b.score - a.score)
      trimmed.push(...list.slice(0, STORAGE_LIMIT))
    }
    localStorage.setItem(STORAGE_KEY, JSON.stringify(trimmed))
    void table
  } catch (err) {
    console.warn('[pinball] localStorage write failed', err)
  }
}

/**
 * Reactive high-scores composable. Graph-backed; on graph failure (CORS,
 * offline, etc.) falls back to localStorage so the UI remains usable.
 */
export function useHighScores(table: string, limit = 50) {
  const graph = useGraph<HighScoreRow>(HighScore)

  const topScores = ref<HighScoreRow[]>([])
  const isLoading = ref(false)
  const error = ref<Error | null>(null)
  const usingLocal = ref(false)

  const submitting = ref(false)
  const submitError = ref<Error | null>(null)

  async function refetch(): Promise<void> {
    isLoading.value = true
    error.value = null
    try {
      const rows = await graph.find({
        where: { table },
        orderBy: { score: 'desc' },
        limit,
      })
      topScores.value = rows ?? []
      usingLocal.value = false
    } catch (err) {
      console.warn('[pinball] graph unavailable, falling back to local', err)
      error.value = err as Error
      topScores.value = readLocal(table)
        .sort((a, b) => b.score - a.score)
        .slice(0, limit)
      usingLocal.value = true
    } finally {
      isLoading.value = false
    }
  }

  async function submit(payload: {
    score: number
    balls: number
    duration: number
    playerName?: string
  }): Promise<boolean> {
    submitting.value = true
    submitError.value = null
    try {
      await graph.create({
        table,
        score: payload.score,
        balls: payload.balls,
        duration: payload.duration,
        playerName: payload.playerName ?? 'Anonymous',
      })
      await refetch()
      return true
    } catch (err) {
      console.warn('[pinball] graph submit failed; saving locally', err)
      const now = new Date().toISOString()
      const row: HighScoreRow = {
        id: `local-${Date.now()}`,
        table,
        score: payload.score,
        balls: payload.balls,
        duration: payload.duration,
        playerName: payload.playerName ?? 'Anonymous',
        created_at: now,
        updated_at: now,
        local: true,
      }
      writeLocal(table, row)
      submitError.value = err as Error
      topScores.value = readLocal(table)
        .sort((a, b) => b.score - a.score)
        .slice(0, limit)
      usingLocal.value = true
      return true
    } finally {
      submitting.value = false
    }
  }

  onMounted(() => {
    void refetch()
  })

  return {
    topScores,
    isLoading,
    error,
    submit,
    submitting,
    submitError,
    refetch,
    usingLocal,
  }
}
