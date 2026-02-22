// ============================================================
// SINGLE SOURCE OF TRUTH — App contract types
// ============================================================

export interface Dice {
  dice_id: string
  name: string
  number_of_faces: number
  created_at: string // ISO 8601
  updated_at: string
  deleted_at: string | null
}

export interface Reward {
  reward_id: string
  dice_id: string
  face_value: number
  reward_title: string
  reward_description: string | null
  weight: number
  created_at: string
  updated_at: string
  deleted_at: string | null
}

export interface RollHistory {
  history_id: string
  dice_id: string
  dice_name: string             // snapshot
  rolled_value: number
  reward_title: string          // snapshot
  reward_description: string | null // snapshot
  rolled_at: string
  used: boolean
  used_at: string | null
}

// ---- History list / pagination ----
export interface RollHistoryListResponse {
  data: RollHistory[]
  total: number
  page: number
  page_size: number
}

// ---- Mark used input ----
export interface MarkRewardUsedInput {
  used: boolean // true = đã dùng, false = hoàn tác
}

// ---- Request shapes ----

export interface CreateDiceInput {
  name: string
  number_of_faces: number
}

export interface UpdateDiceInput {
  name?: string
  number_of_faces?: number
}

export interface UpsertRewardInput {
  face_value: number
  reward_title: string
  reward_description?: string | null
  weight?: number
}

export interface BulkUpsertRewardsInput {
  rewards: UpsertRewardInput[]
}

// ---- Response shapes ----

export interface RollResult {
  roll: number
  reward: {
    reward_id: string
    title: string
    description: string | null
  }
  rolled_at: string
}

export interface RollError {
  error: 'INCOMPLETE_REWARDS'
  message: string
  missing_faces: number[]
}

export interface DiceWithRewardCount extends Dice {
  reward_count: number
}
