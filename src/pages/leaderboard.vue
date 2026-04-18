<script setup lang="ts">
import { navigateToSpace } from '@construct-space/sdk'
import { useHighScores } from '../composables/useHighScores'
import LeaderboardTable from '../components/LeaderboardTable.vue'

const { topScores, isLoading, error, refetch } = useHighScores('classic', 50)

function goHome() {
  void navigateToSpace({ spaceId: 'pinball', page: '' })
}
</script>

<template>
  <div class="lb-page">
    <header class="page-header">
      <button class="back-btn" @click="goHome">← Back</button>
      <h1>Leaderboard</h1>
      <button class="refresh-btn" @click="refetch()">↻ Refresh</button>
    </header>

    <div class="card">
      <div class="table-label">Classic Table — Top 50</div>
      <div v-if="isLoading" class="status">Loading…</div>
      <div v-else-if="error" class="status err">
        Leaderboard unavailable.
        <div class="err-detail">{{ error.message }}</div>
      </div>
      <LeaderboardTable v-else :scores="topScores" :limit="50" />
    </div>
  </div>
</template>

<style scoped>
.lb-page {
  padding: 40px;
  min-height: 100%;
  background: radial-gradient(ellipse at top, #1a1a2e 0%, #0b0b12 70%);
  color: #eaeaf0;
  font-family: ui-sans-serif, system-ui, sans-serif;
}
.page-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  max-width: 960px;
  margin: 0 auto 24px;
}
.page-header h1 {
  margin: 0;
  font-size: 28px;
  letter-spacing: 0.1em;
  text-transform: uppercase;
  color: #ffd166;
}
.back-btn,
.refresh-btn {
  background: rgba(108, 92, 231, 0.15);
  border: 1px solid rgba(108, 92, 231, 0.4);
  color: #c9c4ef;
  padding: 8px 16px;
  border-radius: 6px;
  cursor: pointer;
  font-size: 13px;
  font-family: inherit;
}
.back-btn:hover,
.refresh-btn:hover {
  background: rgba(108, 92, 231, 0.3);
}
.card {
  max-width: 960px;
  margin: 0 auto;
  background: rgba(19, 19, 31, 0.7);
  border: 1px solid rgba(108, 92, 231, 0.2);
  border-radius: 12px;
  padding: 20px;
}
.table-label {
  font-size: 11px;
  letter-spacing: 0.2em;
  text-transform: uppercase;
  color: #8888a0;
  margin-bottom: 12px;
  padding-bottom: 12px;
  border-bottom: 1px solid rgba(255, 255, 255, 0.05);
}
.status {
  padding: 40px;
  text-align: center;
  color: #8888a0;
}
.status.err {
  color: #ff4d6d;
}
.err-detail {
  font-size: 11px;
  color: #8888a0;
  margin-top: 6px;
  font-family: ui-monospace, monospace;
}
</style>
