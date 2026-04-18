<script setup lang="ts">
defineProps<{
  finalScore: number
  durationMs: number
  submitting?: boolean
  submitted?: boolean
  submitError?: string | null
}>()
defineEmits<{
  (e: 'submit', payload: { name: string }): void
  (e: 'restart'): void
  (e: 'close'): void
}>()

import { ref } from 'vue'
const name = ref('')
</script>

<template>
  <div class="modal-backdrop">
    <div class="modal">
      <h2>Game Over</h2>
      <div class="score-display">
        <div class="final-score">{{ finalScore.toLocaleString() }}</div>
        <div class="duration">{{ Math.floor(durationMs / 1000) }}s</div>
      </div>

      <div v-if="!submitted" class="submit-area">
        <input
          v-model="name"
          class="name-input"
          placeholder="Your name (optional)"
          maxlength="24"
          :disabled="submitting"
        />
        <button
          class="btn-primary"
          :disabled="submitting"
          @click="$emit('submit', { name: name.trim() || 'Anonymous' })"
        >
          {{ submitting ? 'Submitting…' : 'Submit score' }}
        </button>
      </div>

      <div v-else class="submitted-msg">Score saved to leaderboard ✓</div>

      <div v-if="submitError" class="error-msg">{{ submitError }}</div>

      <div class="actions">
        <button class="btn-secondary" @click="$emit('restart')">Play again</button>
        <button class="btn-secondary" @click="$emit('close')">Close</button>
      </div>
    </div>
  </div>
</template>

<style scoped>
.modal-backdrop {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.7);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 100;
  backdrop-filter: blur(4px);
}
.modal {
  background: #13131f;
  border: 1px solid rgba(108, 92, 231, 0.4);
  border-radius: 12px;
  padding: 32px;
  min-width: 360px;
  color: #eaeaf0;
  font-family: ui-sans-serif, system-ui, sans-serif;
  box-shadow: 0 10px 40px rgba(0, 0, 0, 0.5);
}
.modal h2 {
  margin: 0 0 20px;
  font-size: 24px;
  text-align: center;
  color: #ffd166;
  letter-spacing: 0.05em;
}
.score-display {
  text-align: center;
  margin-bottom: 24px;
}
.final-score {
  font-family: ui-monospace, 'SF Mono', Menlo, monospace;
  font-size: 48px;
  font-weight: 700;
  color: #06d6a0;
}
.duration {
  font-size: 12px;
  color: #8888a0;
  letter-spacing: 0.1em;
  text-transform: uppercase;
}
.submit-area {
  display: flex;
  gap: 8px;
  margin-bottom: 16px;
}
.name-input {
  flex: 1;
  background: #0b0b12;
  border: 1px solid #333349;
  color: #eaeaf0;
  padding: 8px 12px;
  border-radius: 6px;
  font-size: 14px;
}
.name-input:focus {
  outline: none;
  border-color: rgba(108, 92, 231, 0.6);
}
.btn-primary {
  background: #6c5ce7;
  color: white;
  border: none;
  padding: 8px 16px;
  border-radius: 6px;
  cursor: pointer;
  font-weight: 600;
  font-size: 14px;
}
.btn-primary:hover:not(:disabled) {
  background: #7c6df0;
}
.btn-primary:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}
.btn-secondary {
  background: rgba(108, 92, 231, 0.15);
  border: 1px solid rgba(108, 92, 231, 0.4);
  color: #c9c4ef;
  padding: 8px 16px;
  border-radius: 6px;
  cursor: pointer;
  font-size: 14px;
}
.btn-secondary:hover {
  background: rgba(108, 92, 231, 0.3);
}
.submitted-msg {
  text-align: center;
  color: #06d6a0;
  padding: 12px;
  margin-bottom: 16px;
}
.error-msg {
  color: #ff4d6d;
  font-size: 12px;
  margin-bottom: 12px;
  text-align: center;
}
.actions {
  display: flex;
  gap: 8px;
  justify-content: center;
}
</style>
