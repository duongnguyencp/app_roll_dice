<template>
  <div class="page">
    <div style="max-width:600px; margin:0 auto;">

      <!-- Header -->
      <div style="text-align:center; margin-bottom:2rem;">
        <h1 style="font-size:2.2rem; font-weight:800; color:var(--accent2);">🎲 Dice Reward</h1>
        <p style="color:var(--text-muted); margin-top:0.5rem;">Gieo xúc xắc, nhận phần thưởng ngẫu nhiên!</p>
      </div>

      <!-- No dice -->
      <div v-if="diceStore.list.length === 0 && !diceStore.loading" class="card empty-state">
        <div class="empty-state-icon">🎲</div>
        <p>Chưa có xúc xắc nào.</p>
        <RouterLink to="/manage" style="margin-top:1rem; display:inline-block;">
          <button class="btn-primary" style="margin-top:0.8rem;">Tạo xúc xắc đầu tiên →</button>
        </RouterLink>
      </div>

      <template v-else>
        <!-- Dice selector -->
        <div class="card" style="margin-bottom:1rem;">
          <label>Chọn xúc xắc</label>
          <select v-model="selectedDiceId" :disabled="rollStore.rolling" data-testid="dice-select" style="margin-top:0.3rem;">
            <option v-for="d in diceStore.list" :key="d.dice_id" :value="d.dice_id">
              {{ d.name }} ({{ d.number_of_faces }} mặt)
            </option>
          </select>
        </div>

        <!-- 3D Canvas (lazy loaded) -->
        <Suspense>
          <DiceCanvas :rolling="rollStore.rolling" :rolled-face="shownFace" @animation-done="onAnimationDone" />
        </Suspense>

        <!-- Roll button -->
        <div v-if="!showResult" style="text-align:center; margin-top:1.5rem;">
          <button
            class="btn-primary btn-lg"
            :disabled="rollStore.rolling || !isReady"
            :title="!isReady ? notReadyMsg : ''"
            @click="startRoll"
            data-testid="roll-button"
            style="min-width:200px;"
          >
            <span v-if="rollStore.rolling">
              <span class="spinner"></span> &nbsp;Đang gieo...
            </span>
            <span v-else>🎲 GIEO</span>
          </button>

          <p v-if="!isReady && selectedDice" class="error-msg" style="margin-top:0.6rem;">
            {{ notReadyMsg }}
          </p>
          <p v-if="rollStore.error" class="error-msg" style="margin-top:0.6rem;">
            ⚠️ {{ rollStore.error }}
          </p>
        </div>

        <!-- Result Card -->
        <div v-if="showResult && rollStore.result" style="margin-top:1.5rem;" data-testid="result-card">
          <ResultCard
            :result="rollStore.result"
            :dice-name="selectedDice?.name ?? ''"
            @roll-again="resetAndRoll"
          />
        </div>
      </template>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, watch, defineAsyncComponent } from 'vue'
import { useDiceStore } from '@/stores/dice.store'
import { useRollStore } from '@/stores/roll.store'
import ResultCard from '@/components/ResultCard/ResultCard.vue'

// Lazy-load Three.js heavy component
const DiceCanvas = defineAsyncComponent(() =>
  import('@/components/DiceRoller/DiceCanvas.vue')
)

const diceStore = useDiceStore()
const rollStore = useRollStore()

const selectedDiceId = ref('')
const showResult = ref(false)
let apiResultReady = false
let animDone = false

// rolledFace shown on dice canvas (only after both API + anim done)
const shownFace = ref<number | null>(null)

onMounted(async () => {
  await diceStore.fetchAll()
  if (diceStore.list.length > 0) {
    selectedDiceId.value = diceStore.list[0]!.dice_id
  }
})

const selectedDice = computed(() =>
  diceStore.list.find((d) => d.dice_id === selectedDiceId.value)
)

const isReady = computed(() =>
  !!selectedDice.value &&
  selectedDice.value.reward_count === selectedDice.value.number_of_faces
)

const notReadyMsg = computed(() => {
  if (!selectedDice.value) return ''
  const missing = selectedDice.value.number_of_faces - selectedDice.value.reward_count
  return `Còn thiếu ${missing} phần thưởng. Vào Quản lý để gán phần thưởng.`
})

async function startRoll() {
  if (!selectedDiceId.value || rollStore.rolling) return
  showResult.value = false
  apiResultReady = false
  animDone = false
  shownFace.value = null

  // Start API call + animation simultaneously
  rollStore.roll(selectedDiceId.value).then(() => {
    apiResultReady = true
    maybeReveal()
  })
}

function onAnimationDone() {
  animDone = true
  maybeReveal()
}

function maybeReveal() {
  if (animDone && apiResultReady) {
    shownFace.value = rollStore.result?.roll ?? null
    showResult.value = true
  }
}

function resetAndRoll() {
  rollStore.reset()
  showResult.value = false
  shownFace.value = null
  startRoll()
}

// Reset result when dice changes
watch(selectedDiceId, () => {
  rollStore.reset()
  showResult.value = false
  shownFace.value = null
})
</script>
