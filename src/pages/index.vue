<script setup lang="ts">
import { computed } from 'vue'
import { navigateToSpace } from '@construct-space/sdk'
import { useHighScores } from '../composables/useHighScores'
import LeaderboardTable from '../components/LeaderboardTable.vue'

const { topScores, isLoading, error } = useHighScores('classic', 5)

const personalBest = computed(() => topScores.value[0]?.score ?? 0)

function startGame() {
  void navigateToSpace({ spaceId: 'pinball', page: 'play' })
}
function viewAll() {
  void navigateToSpace({ spaceId: 'pinball', page: 'leaderboard' })
}
</script>

<template>
  <div class="arcade-page">
    <div class="hero">
      <div class="title-row">
        <h1 class="game-title">PINBALL</h1>
        <span class="subtitle">Classic Arcade</span>
      </div>
      <p class="desc">
        Real physics. Three balls. Flippers on arrow keys, launch on space.
        Rack up a score and claim the leaderboard.
      </p>
      <button class="start-btn" @click="startGame">
        <span class="start-icon">▶</span>
        Start Game
      </button>
    </div>

    <div class="grid">
      <section class="card">
        <header>
          <h2>Top Scores</h2>
          <button class="link" @click="viewAll">View all →</button>
        </header>
        <div v-if="isLoading" class="loading">Loading…</div>
        <div v-else-if="error" class="err">
          Leaderboard unavailable.
          <div class="err-detail">{{ error.message }}</div>
        </div>
        <LeaderboardTable v-else :scores="topScores" :limit="5" />
      </section>

      <section class="card">
        <header>
          <h2>Personal Best</h2>
        </header>
        <div class="pb-display">
          <div class="pb-value">{{ personalBest.toLocaleString() }}</div>
          <div class="pb-label">points</div>
        </div>
        <div class="controls-help">
          <h3>Controls</h3>
          <ul>
            <li><kbd>←</kbd> <kbd>→</kbd> / <kbd>A</kbd> <kbd>D</kbd> — Flippers</li>
            <li><kbd>Space</kbd> — Launch ball</li>
            <li><kbd>P</kbd> — Pause</li>
            <li><kbd>R</kbd> — Restart</li>
          </ul>
        </div>
      </section>
    </div>
  </div>
</template>

<style scoped>
.arcade-page {
  min-height: 100%;
  padding: 40px;
  background: radial-gradient(ellipse at top, #1a1a2e 0%, #0b0b12 70%);
  color: #eaeaf0;
  font-family: ui-sans-serif, system-ui, sans-serif;
}
.hero {
  text-align: center;
  margin-bottom: 40px;
}
.title-row {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 4px;
  margin-bottom: 16px;
}
.game-title {
  font-size: 64px;
  font-weight: 900;
  letter-spacing: 0.2em;
  margin: 0;
  background: linear-gradient(180deg, #ffd166 0%, #ff4d6d 100%);
  -webkit-background-clip: text;
  background-clip: text;
  color: transparent;
  text-shadow: 0 0 40px rgba(255, 77, 109, 0.3);
}
.subtitle {
  font-size: 14px;
  letter-spacing: 0.3em;
  color: #8888a0;
  text-transform: uppercase;
}
.desc {
  max-width: 540px;
  margin: 0 auto 24px;
  color: #aaaabb;
  line-height: 1.6;
}
.start-btn {
  background: linear-gradient(135deg, #6c5ce7 0%, #ff4d6d 100%);
  border: none;
  color: white;
  padding: 14px 36px;
  border-radius: 8px;
  font-size: 18px;
  font-weight: 700;
  letter-spacing: 0.05em;
  cursor: pointer;
  display: inline-flex;
  align-items: center;
  gap: 10px;
  box-shadow: 0 8px 24px rgba(108, 92, 231, 0.4);
  transition: transform 0.1s, box-shadow 0.2s;
}
.start-btn:hover {
  transform: translateY(-2px);
  box-shadow: 0 12px 32px rgba(108, 92, 231, 0.5);
}
.start-icon {
  font-size: 14px;
}
.grid {
  display: grid;
  grid-template-columns: 2fr 1fr;
  gap: 20px;
  max-width: 960px;
  margin: 0 auto;
}
@media (max-width: 768px) {
  .grid {
    grid-template-columns: 1fr;
  }
  .game-title {
    font-size: 40px;
  }
}
.card {
  background: rgba(19, 19, 31, 0.7);
  border: 1px solid rgba(108, 92, 231, 0.2);
  border-radius: 12px;
  padding: 20px;
}
.card header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 12px;
}
.card h2 {
  margin: 0;
  font-size: 14px;
  letter-spacing: 0.15em;
  text-transform: uppercase;
  color: #8888a0;
  font-weight: 600;
}
.link {
  background: none;
  border: none;
  color: #6c5ce7;
  cursor: pointer;
  font-size: 12px;
  font-weight: 600;
}
.link:hover {
  color: #8a7af0;
}
.loading,
.err {
  padding: 20px;
  text-align: center;
  color: #8888a0;
  font-size: 13px;
}
.err {
  color: #ff4d6d;
}
.err-detail {
  font-size: 11px;
  color: #8888a0;
  margin-top: 4px;
  font-family: ui-monospace, monospace;
}
.pb-display {
  text-align: center;
  padding: 20px 0;
  border-bottom: 1px solid rgba(255, 255, 255, 0.05);
  margin-bottom: 16px;
}
.pb-value {
  font-family: ui-monospace, 'SF Mono', Menlo, monospace;
  font-size: 36px;
  font-weight: 700;
  color: #06d6a0;
}
.pb-label {
  font-size: 10px;
  letter-spacing: 0.2em;
  color: #8888a0;
  text-transform: uppercase;
}
.controls-help h3 {
  font-size: 11px;
  letter-spacing: 0.15em;
  text-transform: uppercase;
  color: #8888a0;
  margin: 0 0 8px;
}
.controls-help ul {
  list-style: none;
  padding: 0;
  margin: 0;
  font-size: 13px;
  color: #c9c9d6;
}
.controls-help li {
  padding: 4px 0;
}
kbd {
  display: inline-block;
  padding: 2px 6px;
  background: rgba(108, 92, 231, 0.15);
  border: 1px solid rgba(108, 92, 231, 0.3);
  border-radius: 4px;
  font-family: ui-monospace, monospace;
  font-size: 11px;
  margin: 0 2px;
}
</style>
