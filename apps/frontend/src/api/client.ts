import type { DiceWithRewardCount, Dice, Reward, RollResult, UpsertRewardInput, RollHistory, RollHistoryListResponse } from '@/types'

const BASE = import.meta.env.VITE_API_BASE_URL ? `${import.meta.env.VITE_API_BASE_URL}/api` : '/api'

async function request<T>(path: string, options?: RequestInit): Promise<T> {
  const res = await fetch(`${BASE}${path}`, {
    headers: { 'Content-Type': 'application/json' },
    ...options,
  })
  const data = await res.json()
  if (!res.ok) throw new Error(data.error ?? data.message ?? 'Lỗi không xác định')
  return data as T
}

// ---- Dice ----

export const diceApi = {
  list: () => request<{ data: DiceWithRewardCount[]; total: number }>('/dice'),

  get: (dice_id: string) => request<{ data: Dice }>(`/dice/${dice_id}`),

  create: (body: { name: string; number_of_faces: number }) =>
    request<{ data: Dice }>('/dice', {
      method: 'POST',
      body: JSON.stringify(body),
    }),

  update: (dice_id: string, body: { name?: string; number_of_faces?: number }) =>
    request<{ data: Dice }>(`/dice/${dice_id}`, {
      method: 'PATCH',
      body: JSON.stringify(body),
    }),

  delete: (dice_id: string) =>
    request<{ success: boolean }>(`/dice/${dice_id}`, { method: 'DELETE' }),
}

// ---- Rewards ----

export const rewardsApi = {
  list: (dice_id: string) =>
    request<{ data: Reward[] }>(`/dice/${dice_id}/rewards`),

  upsert: (dice_id: string, input: UpsertRewardInput) =>
    request<{ data: Reward }>(`/dice/${dice_id}/rewards`, {
      method: 'POST',
      body: JSON.stringify(input),
    }),

  bulkUpsert: (dice_id: string, rewards: UpsertRewardInput[]) =>
    request<{ data: Reward[] }>(`/dice/${dice_id}/rewards/bulk`, {
      method: 'POST',
      body: JSON.stringify({ rewards }),
    }),

  update: (dice_id: string, reward_id: string, input: Partial<UpsertRewardInput>) =>
    request<{ data: Reward }>(`/dice/${dice_id}/rewards/${reward_id}`, {
      method: 'PATCH',
      body: JSON.stringify(input),
    }),

  delete: (dice_id: string, reward_id: string) =>
    request<{ success: boolean }>(`/dice/${dice_id}/rewards/${reward_id}`, {
      method: 'DELETE',
    }),
}

// ---- Roll ----

export const rollApi = {
  roll: (dice_id: string) =>
    request<RollResult>(`/dice/${dice_id}/roll`, { method: 'POST' }),
}

// ---- History ----

export const historyApi = {
  list: (params?: { dice_id?: string; used?: boolean; page?: number; page_size?: number }) => {
    const q = new URLSearchParams()
    if (params?.dice_id) q.set('dice_id', params.dice_id)
    if (params?.used !== undefined) q.set('used', String(params.used))
    if (params?.page) q.set('page', String(params.page))
    if (params?.page_size) q.set('page_size', String(params.page_size))
    const qs = q.toString()
    return request<RollHistoryListResponse>(`/history${qs ? `?${qs}` : ''}`)
  },

  markUsed: (history_id: string, used: boolean) =>
    request<RollHistory>(`/history/${history_id}/use`, {
      method: 'PATCH',
      body: JSON.stringify({ used }),
    }),
}
