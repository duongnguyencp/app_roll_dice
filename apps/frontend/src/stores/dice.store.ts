import { defineStore } from 'pinia'
import { ref } from 'vue'
import { diceApi } from '@/api/client'
import type { DiceWithRewardCount, Dice } from '@/types'

export const useDiceStore = defineStore('dice', () => {
  const list = ref<DiceWithRewardCount[]>([])
  const loading = ref(false)
  const error = ref<string | null>(null)

  async function fetchAll() {
    loading.value = true
    error.value = null
    try {
      const res = await diceApi.list()
      list.value = res.data
    } catch (e) {
      error.value = (e as Error).message
    } finally {
      loading.value = false
    }
  }

  async function create(name: string, number_of_faces: number): Promise<Dice | null> {
    try {
      const res = await diceApi.create({ name, number_of_faces })
      await fetchAll()
      return res.data
    } catch (e) {
      throw e
    }
  }

  async function update(dice_id: string, body: { name?: string; number_of_faces?: number }) {
    await diceApi.update(dice_id, body)
    await fetchAll()
  }

  async function remove(dice_id: string) {
    await diceApi.delete(dice_id)
    list.value = list.value.filter((d) => d.dice_id !== dice_id)
  }

  return { list, loading, error, fetchAll, create, update, remove }
})
