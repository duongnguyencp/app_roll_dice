import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { historyApi } from '@/api/client'
import type { RollHistory } from '@/types'

export const useHistoryStore = defineStore('history', () => {
  const list = ref<RollHistory[]>([])
  const total = ref(0)
  const page = ref(1)
  const page_size = ref(20)
  const loading = ref(false)
  const error = ref<string | null>(null)

  // Filters
  const filterDiceId = ref<string | undefined>(undefined)
  const filterUsed = ref<boolean | undefined>(undefined)

  const totalPages = computed(() => Math.ceil(total.value / page_size.value) || 1)
  const usedCount = computed(() => list.value.filter((h) => h.used).length)
  const unusedCount = computed(() => list.value.filter((h) => !h.used).length)

  async function fetch(opts?: { page?: number; dice_id?: string; used?: boolean }) {
    loading.value = true
    error.value = null
    try {
      if (opts?.dice_id !== undefined) filterDiceId.value = opts.dice_id || undefined
      if (opts?.used !== undefined) filterUsed.value = opts.used
      if (opts?.page) page.value = opts.page

      const res = await historyApi.list({
        dice_id: filterDiceId.value,
        used: filterUsed.value,
        page: page.value,
        page_size: page_size.value,
      })
      list.value = res.data
      total.value = res.total
    } catch (e: unknown) {
      error.value = e instanceof Error ? e.message : 'Lỗi không xác định'
    } finally {
      loading.value = false
    }
  }

  async function markUsed(history_id: string, used: boolean) {
    try {
      const updated = await historyApi.markUsed(history_id, used)
      const idx = list.value.findIndex((h) => h.history_id === history_id)
      if (idx !== -1) list.value[idx] = updated
    } catch (e: unknown) {
      error.value = e instanceof Error ? e.message : 'Lỗi không xác định'
    }
  }

  function setPage(p: number) {
    page.value = p
    fetch()
  }

  function setFilter(opts: { dice_id?: string; used?: boolean }) {
    filterDiceId.value = opts.dice_id
    filterUsed.value = opts.used
    page.value = 1
    fetch()
  }

  function resetFilter() {
    filterDiceId.value = undefined
    filterUsed.value = undefined
    page.value = 1
    fetch()
  }

  return {
    list, total, page, page_size, loading, error,
    filterDiceId, filterUsed, totalPages, usedCount, unusedCount,
    fetch, markUsed, setPage, setFilter, resetFilter,
  }
})
