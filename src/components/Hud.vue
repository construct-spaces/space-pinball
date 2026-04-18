<script setup lang="ts">
defineProps<{
  score: number
  multiplier: number
  combo: number
  balls: number
  charge: number
  paused?: boolean
}>()
defineEmits<{ (e: 'pause'): void; (e: 'restart'): void }>()
</script>

<template>
  <div class="pinball-hud">
    <div class="hud-group">
      <div class="hud-label">Score</div>
      <div class="hud-value score">{{ score.toLocaleString() }}</div>
    </div>
    <div class="hud-group">
      <div class="hud-label">Multi</div>
      <div class="hud-value" :class="{ active: multiplier > 1 }">×{{ multiplier.toFixed(1) }}</div>
    </div>
    <div v-if="combo > 1" class="combo-pill">
      <span class="combo-label">COMBO</span>
      <span class="combo-count">×{{ combo }}</span>
    </div>
    <div class="hud-group">
      <div class="hud-label">Balls</div>
      <div class="hud-value">
        <span v-for="n in balls" :key="n" class="ball-dot" />
        <span v-if="balls === 0" class="hud-muted">—</span>
      </div>
    </div>
    <div class="hud-group charge-group">
      <div class="hud-label">Plunger</div>
      <div class="charge-bar">
        <div class="charge-fill" :style="{ width: `${Math.round(charge * 100)}%` }" />
      </div>
    </div>
    <div class="hud-actions">
      <button class="hud-btn" @click="$emit('pause')">
        {{ paused ? 'Resume (P)' : 'Pause (P)' }}
      </button>
      <button class="hud-btn" @click="$emit('restart')">Restart (R)</button>
    </div>
  </div>
</template>

<style scoped>
.pinball-hud {
  display: flex;
  align-items: center;
  gap: 18px;
  padding: 10px 16px;
  width: 100%;
  background: linear-gradient(180deg, rgba(28, 28, 42, 0.92) 0%, rgba(19, 19, 31, 0.92) 100%);
  border: 1px solid rgba(108, 92, 231, 0.3);
  border-radius: 12px;
  color: #eaeaf0;
  font-family: ui-monospace, 'SF Mono', Menlo, monospace;
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.4);
}
.hud-group {
  display: flex;
  flex-direction: column;
  gap: 2px;
  min-width: 60px;
}
.hud-label {
  font-size: 9px;
  letter-spacing: 0.2em;
  text-transform: uppercase;
  color: #a0a0bf;
  font-weight: 600;
}
.hud-value {
  font-size: 22px;
  font-weight: 800;
  line-height: 1;
  transition: color 0.2s;
}
.hud-value.score {
  color: #ffd166;
}
.hud-value.active {
  color: #06d6a0;
}
.hud-muted {
  color: #555;
}
.combo-pill {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 6px 12px;
  border-radius: 999px;
  background: linear-gradient(90deg, #ff4d6d, #ffd166);
  color: #1c1c2a;
  font-weight: 800;
  font-size: 13px;
  letter-spacing: 0.08em;
  animation: combo-pulse 0.7s ease-out;
  box-shadow: 0 4px 14px rgba(255, 77, 109, 0.4);
}
.combo-count {
  font-size: 16px;
}
@keyframes combo-pulse {
  0% {
    transform: scale(0.7);
    opacity: 0;
  }
  60% {
    transform: scale(1.08);
  }
  100% {
    transform: scale(1);
    opacity: 1;
  }
}
.ball-dot {
  display: inline-block;
  width: 10px;
  height: 10px;
  border-radius: 50%;
  background: #f5f5fa;
  margin-right: 5px;
  box-shadow: 0 0 6px rgba(245, 245, 250, 0.6);
}
.charge-group {
  min-width: 140px;
  flex: 0 0 auto;
}
.charge-bar {
  position: relative;
  height: 12px;
  width: 140px;
  background: rgba(108, 92, 231, 0.12);
  border: 1px solid rgba(108, 92, 231, 0.4);
  border-radius: 6px;
  overflow: hidden;
  margin-top: 4px;
  box-shadow: inset 0 1px 2px rgba(0, 0, 0, 0.4);
}
.charge-fill {
  height: 100%;
  background: linear-gradient(90deg, #6c5ce7 0%, #ffd166 70%, #ff4d6d 100%);
  transition: width 60ms linear;
  box-shadow: 0 0 10px rgba(255, 209, 102, 0.5);
}
.hud-actions {
  margin-left: auto;
  display: flex;
  gap: 8px;
}
.hud-btn {
  background: rgba(108, 92, 231, 0.15);
  border: 1px solid rgba(108, 92, 231, 0.4);
  color: #c9c4ef;
  padding: 6px 12px;
  border-radius: 6px;
  font-size: 12px;
  cursor: pointer;
  font-family: inherit;
}
.hud-btn:hover {
  background: rgba(108, 92, 231, 0.3);
}
</style>
