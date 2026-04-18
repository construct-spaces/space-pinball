<script setup lang="ts">
interface ScoreRow {
  id?: string
  playerName?: string
  score: number
  balls?: number
  duration?: number
  createdAt?: string | Date
}

defineProps<{
  scores: ScoreRow[]
  limit?: number
  showRank?: boolean
  empty?: string
}>()

function fmtDate(d: string | Date | undefined): string {
  if (!d) return '—'
  const date = typeof d === 'string' ? new Date(d) : d
  if (isNaN(date.getTime())) return '—'
  return date.toLocaleDateString()
}
</script>

<template>
  <div class="lb-wrap">
    <table v-if="scores.length > 0" class="lb-table">
      <thead>
        <tr>
          <th v-if="showRank !== false" class="rank">#</th>
          <th>Player</th>
          <th class="num">Score</th>
          <th class="num">Balls</th>
          <th class="num">Date</th>
        </tr>
      </thead>
      <tbody>
        <tr v-for="(row, i) in scores.slice(0, limit ?? 50)" :key="row.id ?? i">
          <td v-if="showRank !== false" class="rank">{{ i + 1 }}</td>
          <td>{{ row.playerName || 'Anonymous' }}</td>
          <td class="num score">{{ row.score.toLocaleString() }}</td>
          <td class="num">{{ row.balls ?? '—' }}</td>
          <td class="num date">{{ fmtDate(row.createdAt) }}</td>
        </tr>
      </tbody>
    </table>
    <div v-else class="lb-empty">{{ empty ?? 'No scores yet. Be the first!' }}</div>
  </div>
</template>

<style scoped>
.lb-wrap {
  width: 100%;
}
.lb-table {
  width: 100%;
  border-collapse: collapse;
  font-family: ui-monospace, 'SF Mono', Menlo, monospace;
  font-size: 13px;
  color: #eaeaf0;
}
.lb-table th {
  text-align: left;
  padding: 10px 12px;
  font-size: 10px;
  letter-spacing: 0.15em;
  text-transform: uppercase;
  color: #8888a0;
  border-bottom: 1px solid rgba(108, 92, 231, 0.2);
  font-weight: 500;
}
.lb-table td {
  padding: 10px 12px;
  border-bottom: 1px solid rgba(255, 255, 255, 0.04);
}
.lb-table tr:hover td {
  background: rgba(108, 92, 231, 0.06);
}
.num {
  text-align: right;
}
.rank {
  width: 40px;
  color: #8888a0;
}
.score {
  color: #ffd166;
  font-weight: 700;
}
.date {
  color: #8888a0;
  font-size: 11px;
}
.lb-empty {
  padding: 40px 20px;
  text-align: center;
  color: #8888a0;
  font-size: 14px;
}
</style>
