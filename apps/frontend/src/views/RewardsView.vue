<template>
  <div class="page">
    <div style="display:flex; align-items:center; gap:1rem; margin-bottom:1.5rem; flex-wrap:wrap;">
      <RouterLink to="/manage" style="color:var(--text-muted); font-size:0.9rem;">← Quay lại</RouterLink>
      <h1 class="page-title" style="margin:0; flex:1;">
        🎁 Phần thưởng: {{ dice?.name ?? '...' }}
      </h1>
      <button class="btn-primary" :disabled="saving" @click="saveAll">
        <span v-if="saving" class="spinner"></span>
        <span v-else>💾 Lưu tất cả</span>
      </button>
    </div>

    <div v-if="!dice" style="text-align:center; padding:3rem; color:var(--text-muted)">
      <span class="spinner" style="width:32px;height:32px;"></span>
    </div>

    <template v-else>
      <!-- Progress bar -->
      <div class="card" style="margin-bottom:1rem; padding:1rem;">
        <div style="display:flex; justify-content:space-between; margin-bottom:0.4rem;">
          <span style="font-size:0.85rem; color:var(--text-muted);">Phần thưởng đã gán</span>
          <span style="font-size:0.85rem; font-weight:600;">{{ filledCount }}/{{ dice.number_of_faces }}</span>
        </div>
        <div style="background:var(--surface2); border-radius:4px; height:6px; overflow:hidden;">
          <div
            :style="{ width: progressPct + '%', background: 'var(--accent2)', height: '100%', transition: 'width 0.3s' }"
          ></div>
        </div>
      </div>

      <p v-if="saveError" class="error-msg" style="margin-bottom:0.8rem;">{{ saveError }}</p>
      <p v-if="saveSuccess" style="color:var(--success); font-size:0.9rem; margin-bottom:0.8rem;">✅ Đã lưu thành công!</p>

      <!-- Reward rows -->
      <div style="display:grid; gap:0.6rem;">
        <div
          v-for="row in rows"
          :key="row.face_value"
          class="card"
          style="padding:0.8rem 1rem; display:grid; grid-template-columns:40px 1fr 1fr 80px; gap:0.8rem; align-items:center;"
        >
          <div style="font-weight:700; font-size:1.1rem; color:var(--accent2); text-align:center;">
            {{ row.face_value }}
          </div>
          <input
            v-model="row.reward_title"
            :placeholder="`Phần thưởng mặt ${row.face_value}`"
            maxlength="200"
            @input="saveSuccess = false"
          />
          <input
            v-model="row.reward_description"
            placeholder="Mô tả (tùy chọn)"
            maxlength="500"
            @input="saveSuccess = false"
          />
          <div style="display:flex; align-items:center; gap:0.3rem;">
            <span style="font-size:0.75rem; color:var(--text-muted);">w</span>
            <input
              v-model.number="row.weight"
              type="number"
              min="0.1"
              max="100"
              step="0.1"
              style="padding:0.4rem 0.5rem; font-size:0.85rem;"
              @input="saveSuccess = false"
            />
          </div>
        </div>
      </div>
    </template>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, reactive } from 'vue'
import { useRoute } from 'vue-router'
import { diceApi, rewardsApi } from '@/api/client'
import type { Dice, Reward } from '@/types'

interface RewardRow {
  face_value: number
  reward_title: string
  reward_description: string
  weight: number
}

const route = useRoute()
const dice_id = route.params.dice_id as string

const dice = ref<Dice | null>(null)
const rows = ref<RewardRow[]>([])
const saving = ref(false)
const saveError = ref('')
const saveSuccess = ref(false)

const filledCount = computed(() => rows.value.filter((r) => r.reward_title.trim()).length)
const progressPct = computed(() =>
  dice.value ? Math.round((filledCount.value / dice.value.number_of_faces) * 100) : 0
)

onMounted(async () => {
  const [diceRes, rewardsRes] = await Promise.all([
    diceApi.get(dice_id),
    rewardsApi.list(dice_id),
  ])
  dice.value = diceRes.data

  const rewardMap: Record<number, Reward> = {}
  for (const r of rewardsRes.data) rewardMap[r.face_value] = r

  rows.value = Array.from({ length: dice.value.number_of_faces }, (_, i) => {
    const fv = i + 1
    return {
      face_value: fv,
      reward_title: rewardMap[fv]?.reward_title ?? '',
      reward_description: rewardMap[fv]?.reward_description ?? '',
      weight: rewardMap[fv]?.weight ?? 1.0,
    }
  })
})

async function saveAll() {
  if (!dice.value) return
  saveError.value = ''
  saveSuccess.value = false

  const toSave = rows.value.filter((r) => r.reward_title.trim())
  if (toSave.length === 0) {
    saveError.value = 'Cần điền ít nhất 1 phần thưởng'
    return
  }

  saving.value = true
  try {
    await rewardsApi.bulkUpsert(
      dice_id,
      toSave.map((r) => ({
        face_value: r.face_value,
        reward_title: r.reward_title.trim(),
        reward_description: r.reward_description.trim() || undefined,
        weight: r.weight,
      }))
    )
    saveSuccess.value = true
  } catch (e) {
    saveError.value = (e as Error).message
  } finally {
    saving.value = false
  }
}
</script>
