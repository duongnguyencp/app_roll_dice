<template>
  <div class="page">
    <!-- Header -->
    <div style="display:flex; align-items:center; gap:1rem; margin-bottom:1.5rem; flex-wrap:wrap;">
      <h1 class="page-title" style="margin:0; flex:1;">📋 Lịch sử phần thưởng</h1>
      <button class="btn-secondary" @click="historyStore.fetch()" :disabled="historyStore.loading">
        🔄 Làm mới
      </button>
    </div>

    <!-- Summary cards -->
    <div style="display:grid; grid-template-columns:repeat(auto-fit, minmax(140px,1fr)); gap:0.8rem; margin-bottom:1.2rem;">
      <div class="card" style="text-align:center; padding:1rem;">
        <div style="font-size:1.8rem; font-weight:800; color:var(--accent2);">{{ historyStore.total }}</div>
        <div style="font-size:0.8rem; color:var(--text-muted); margin-top:0.2rem;">Tổng phần thưởng</div>
      </div>
      <div class="card" style="text-align:center; padding:1rem; cursor:pointer;" @click="setFilter('false')">
        <div style="font-size:1.8rem; font-weight:800; color:var(--warning, #f59e0b);">{{ unusedTotal }}</div>
        <div style="font-size:0.8rem; color:var(--text-muted); margin-top:0.2rem;">Chưa dùng</div>
      </div>
      <div class="card" style="text-align:center; padding:1rem; cursor:pointer;" @click="setFilter('true')">
        <div style="font-size:1.8rem; font-weight:800; color:var(--success, #10b981);">{{ usedTotal }}</div>
        <div style="font-size:0.8rem; color:var(--text-muted); margin-top:0.2rem;">Đã dùng</div>
      </div>
    </div>

    <!-- Filters -->
    <div class="card" style="padding:0.8rem 1rem; margin-bottom:1rem; display:flex; gap:0.8rem; align-items:center; flex-wrap:wrap;">
      <span style="font-size:0.85rem; color:var(--text-muted); font-weight:600;">Lọc:</span>

      <!-- Filter by used status -->
      <div style="display:flex; gap:0.4rem;">
        <button
          v-for="opt in usedFilterOpts"
          :key="opt.value"
          :class="['btn-secondary', activeUsedFilter === opt.value ? 'btn-active' : '']"
          style="font-size:0.8rem; padding:0.3rem 0.8rem;"
          @click="setFilter(opt.value)"
        >
          {{ opt.label }}
        </button>
      </div>

      <!-- Filter by dice -->
      <select
        v-model="selectedDiceId"
        style="margin-left:auto; max-width:180px; font-size:0.85rem;"
        @change="onDiceChange"
      >
        <option value="">Tất cả xúc xắc</option>
        <option v-for="d in diceStore.list" :key="d.dice_id" :value="d.dice_id">
          {{ d.name }}
        </option>
      </select>
    </div>

    <!-- Error -->
    <p v-if="historyStore.error" class="error-msg" style="margin-bottom:0.8rem;">
      ⚠️ {{ historyStore.error }}
    </p>

    <!-- Loading -->
    <div v-if="historyStore.loading" style="text-align:center; padding:3rem; color:var(--text-muted);">
      <span class="spinner" style="width:32px;height:32px;"></span>
    </div>

    <!-- Empty state -->
    <div v-else-if="historyStore.list.length === 0" class="card empty-state">
      <div class="empty-state-icon">📋</div>
      <p>Chưa có lịch sử nào{{ activeUsedFilter === 'true' ? ' đã dùng' : activeUsedFilter === 'false' ? ' chưa dùng' : '' }}.</p>
      <RouterLink v-if="historyStore.total === 0" to="/">
        <button class="btn-primary" style="margin-top:0.8rem;">🎲 Gieo xúc xắc ngay →</button>
      </RouterLink>
    </div>

    <!-- History list -->
    <template v-else>
      <div style="display:grid; gap:0.5rem;">
        <div
          v-for="item in historyStore.list"
          :key="item.history_id"
          class="card history-row"
          :class="{ 'history-row--used': item.used }"
          style="padding:0.9rem 1rem; display:grid; grid-template-columns:1fr auto; gap:0.8rem; align-items:center;"
        >
          <!-- Left: info -->
          <div>
            <div style="display:flex; align-items:center; gap:0.6rem; flex-wrap:wrap;">
              <!-- Dice face badge -->
              <span
                style="background:var(--accent2); color:white; border-radius:6px; padding:0.15rem 0.5rem; font-weight:700; font-size:0.9rem; min-width:28px; text-align:center;"
              >
                {{ item.rolled_value }}
              </span>
              <!-- Reward title -->
              <span style="font-weight:600; font-size:0.95rem;" :style="{ textDecoration: item.used ? 'line-through' : 'none', opacity: item.used ? 0.6 : 1 }">
                {{ item.reward_title }}
              </span>
              <!-- Used badge -->
              <span
                v-if="item.used"
                style="font-size:0.72rem; background:var(--success,#10b981); color:white; border-radius:4px; padding:0.1rem 0.4rem;"
              >
                ✓ Đã dùng
              </span>
            </div>
            <div style="margin-top:0.3rem; font-size:0.8rem; color:var(--text-muted); display:flex; gap:1rem; flex-wrap:wrap;">
              <span>🎲 {{ item.dice_name }}</span>
              <span>🕐 {{ formatDate(item.rolled_at) }}</span>
              <span v-if="item.used && item.used_at">✅ Dùng lúc {{ formatDate(item.used_at) }}</span>
            </div>
            <div v-if="item.reward_description" style="margin-top:0.3rem; font-size:0.8rem; color:var(--text-muted); font-style:italic;">
              {{ item.reward_description }}
            </div>
          </div>

          <!-- Right: action button -->
          <div>
            <button
              v-if="!item.used"
              class="btn-primary"
              style="font-size:0.8rem; padding:0.4rem 0.9rem; white-space:nowrap;"
              @click="markUsed(item.history_id, true)"
            >
              ✅ Đánh dấu đã dùng
            </button>
            <button
              v-else
              class="btn-secondary"
              style="font-size:0.8rem; padding:0.4rem 0.9rem; white-space:nowrap; opacity:0.7;"
              @click="markUsed(item.history_id, false)"
            >
              ↩ Hoàn tác
            </button>
          </div>
        </div>
      </div>

      <!-- Pagination -->
      <div v-if="historyStore.totalPages > 1" style="display:flex; justify-content:center; align-items:center; gap:0.5rem; margin-top:1.2rem;">
        <button
          class="btn-secondary"
          style="padding:0.3rem 0.7rem;"
          :disabled="historyStore.page <= 1"
          @click="historyStore.setPage(historyStore.page - 1)"
        >
          ‹
        </button>
        <span style="font-size:0.85rem; color:var(--text-muted);">
          Trang {{ historyStore.page }} / {{ historyStore.totalPages }}
        </span>
        <button
          class="btn-secondary"
          style="padding:0.3rem 0.7rem;"
          :disabled="historyStore.page >= historyStore.totalPages"
          @click="historyStore.setPage(historyStore.page + 1)"
        >
          ›
        </button>
      </div>
    </template>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useHistoryStore } from '@/stores/history.store'
import { useDiceStore } from '@/stores/dice.store'

const historyStore = useHistoryStore()
const diceStore = useDiceStore()

const selectedDiceId = ref('')
const activeUsedFilter = ref<string>('') // '' | 'true' | 'false'

const usedFilterOpts = [
  { label: 'Tất cả', value: '' },
  { label: '⏳ Chưa dùng', value: 'false' },
  { label: '✅ Đã dùng', value: 'true' },
]

// Summary totals from current page (rough) — load separate counts via all filter
const unusedTotal = computed(() => {
  if (activeUsedFilter.value === 'false') return historyStore.total
  if (activeUsedFilter.value === 'true') return 0
  return historyStore.unusedCount
})
const usedTotal = computed(() => {
  if (activeUsedFilter.value === 'true') return historyStore.total
  if (activeUsedFilter.value === 'false') return 0
  return historyStore.usedCount
})

function setFilter(val: string) {
  activeUsedFilter.value = val
  historyStore.setFilter({
    dice_id: selectedDiceId.value || undefined,
    used: val === '' ? undefined : val === 'true',
  })
}

function onDiceChange() {
  historyStore.setFilter({
    dice_id: selectedDiceId.value || undefined,
    used: activeUsedFilter.value === '' ? undefined : activeUsedFilter.value === 'true',
  })
}

async function markUsed(history_id: string, used: boolean) {
  await historyStore.markUsed(history_id, used)
}

function formatDate(iso: string) {
  const d = new Date(iso)
  return d.toLocaleString('vi-VN', {
    day: '2-digit', month: '2-digit', year: 'numeric',
    hour: '2-digit', minute: '2-digit',
  })
}

onMounted(async () => {
  await Promise.all([historyStore.fetch(), diceStore.list.length === 0 ? diceStore.fetchAll?.() : Promise.resolve()])
})
</script>

<style scoped>
.history-row {
  transition: opacity 0.2s;
}
.history-row--used {
  background: var(--surface1, #1e1e2e);
}
.btn-active {
  background: var(--accent2);
  color: white;
  border-color: var(--accent2);
}
.empty-state {
  text-align: center;
  padding: 3rem 1rem;
  color: var(--text-muted);
}
.empty-state-icon {
  font-size: 3rem;
  margin-bottom: 0.8rem;
}
</style>
