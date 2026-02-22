// Mirror backend design.ts for frontend consumption

export interface Dice {
  dice_id: string
  name: string
  number_of_faces: number
  created_at: string
  updated_at: string
  deleted_at: string | null
}

export interface DiceWithRewardCount extends Dice {
  reward_count: number
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

export interface RollResult {
  roll: number
  reward: {
    reward_id: string
    title: string
    description: string | null
  }
  rolled_at: string
}

export interface UpsertRewardInput {
  face_value: number
  reward_title: string
  reward_description?: string | null
  weight?: number
}
