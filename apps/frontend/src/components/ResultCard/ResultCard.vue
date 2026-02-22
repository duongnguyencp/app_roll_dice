<template>
  <div class="result-card card fade-in-up" data-testid="result-card-content">
    <div class="result-value" data-testid="result-roll-value">🎲 Kết quả: {{ result.roll }}</div>
    <div class="result-title" data-testid="result-reward-title">🎁 {{ result.reward.title }}</div>
    <div v-if="result.reward.description" class="result-desc" data-testid="result-reward-desc">
      📝 {{ result.reward.description }}
    </div>
    <div class="result-actions">
      <button class="btn-primary btn-lg" data-testid="roll-again-button" @click="$emit('rollAgain')">🎲 Gieo lại</button>
      <button class="btn-secondary" @click="copyResult" style="padding:0.6rem 1rem;">
        {{ copied ? '✅ Đã copy' : '📋 Copy' }}
      </button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import type { RollResult } from '@/types'

const props = defineProps<{ result: RollResult; diceName: string }>()
defineEmits<{ rollAgain: [] }>()

const copied = ref(false)

async function copyResult() {
  const text = `Tôi vừa gieo "${props.diceName}" và được: ${props.result.reward.title}! 🎲`
  await navigator.clipboard.writeText(text)
  copied.value = true
  setTimeout(() => (copied.value = false), 2000)
}
</script>

<style scoped>
.result-card {
  text-align: center;
  padding: 2rem;
}
.result-value {
  font-size: 1.1rem;
  color: var(--text-muted);
  margin-bottom: 1rem;
}
.result-title {
  font-size: 2rem;
  font-weight: 800;
  color: var(--accent2);
  margin-bottom: 0.7rem;
  line-height: 1.3;
}
.result-desc {
  color: var(--text-muted);
  font-size: 1rem;
  margin-bottom: 1.5rem;
}
.result-actions {
  display: flex;
  gap: 0.7rem;
  justify-content: center;
  flex-wrap: wrap;
  margin-top: 1.5rem;
}
</style>
