import { defineStore } from 'pinia'
import { ref } from 'vue'
import { rollApi } from '@/api/client'
import type { RollResult } from '@/types'

export const useRollStore = defineStore('roll', () => {
  const result = ref<RollResult | null>(null)
  const rolling = ref(false)
  const error = ref<string | null>(null)

  async function roll(dice_id: string) {
    if (rolling.value) return
    rolling.value = true
    error.value = null
    result.value = null

    try {
      result.value = await rollApi.roll(dice_id)
    } catch (e) {
      error.value = (e as Error).message
    } finally {
      rolling.value = false
    }
  }

  function reset() {
    result.value = null
    error.value = null
  }

  return { result, rolling, error, roll, reset }
})
