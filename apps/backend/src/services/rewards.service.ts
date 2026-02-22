import { v4 as uuidv4 } from 'uuid'
import type { Client } from '../db/client.js'
import type { Reward, UpsertRewardInput } from '../types/design.js'

function now(): string {
  return new Date().toISOString()
}

function asRow<T>(row: Record<string, unknown>): T {
  return row as unknown as T
}

export async function listRewards(db: Client, dice_id: string): Promise<Reward[]> {
  const result = await db.execute({
    sql: `SELECT * FROM rewards WHERE dice_id = ? AND deleted_at IS NULL ORDER BY face_value ASC`,
    args: [dice_id],
  })
  return result.rows.map((r) => asRow<Reward>(r as Record<string, unknown>))
}

export async function getActiveRewardByFace(db: Client, dice_id: string, face_value: number): Promise<Reward | null> {
  const result = await db.execute({
    sql: `SELECT * FROM rewards WHERE dice_id = ? AND face_value = ? AND deleted_at IS NULL`,
    args: [dice_id, face_value],
  })
  return result.rows[0] ? asRow<Reward>(result.rows[0] as Record<string, unknown>) : null
}

export async function upsertReward(db: Client, dice_id: string, input: UpsertRewardInput): Promise<Reward> {
  const existing = await getActiveRewardByFace(db, dice_id, input.face_value)

  if (existing) {
    const updated: Reward = {
      ...existing,
      reward_title: input.reward_title.trim(),
      reward_description: input.reward_description?.trim() ?? null,
      weight: input.weight ?? existing.weight,
      updated_at: now(),
    }
    await db.execute({
      sql: `UPDATE rewards SET reward_title = ?, reward_description = ?, weight = ?, updated_at = ? WHERE reward_id = ?`,
      args: [updated.reward_title, updated.reward_description, updated.weight, updated.updated_at, updated.reward_id],
    })
    return updated
  }

  const reward: Reward = {
    reward_id: uuidv4(),
    dice_id,
    face_value: input.face_value,
    reward_title: input.reward_title.trim(),
    reward_description: input.reward_description?.trim() ?? null,
    weight: input.weight ?? 1.0,
    created_at: now(),
    updated_at: now(),
    deleted_at: null,
  }

  await db.execute({
    sql: `INSERT INTO rewards (reward_id, dice_id, face_value, reward_title, reward_description, weight, created_at, updated_at, deleted_at)
          VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    args: [reward.reward_id, reward.dice_id, reward.face_value, reward.reward_title, reward.reward_description, reward.weight, reward.created_at, reward.updated_at, reward.deleted_at],
  })

  return reward
}

export async function bulkUpsertRewards(db: Client, dice_id: string, inputs: UpsertRewardInput[]): Promise<Reward[]> {
  const results: Reward[] = []
  for (const item of inputs) {
    results.push(await upsertReward(db, dice_id, item))
  }
  return results
}

export interface DeleteRewardResult {
  success: boolean
  error?: 'NOT_FOUND'
}

export async function deleteReward(db: Client, dice_id: string, reward_id: string): Promise<DeleteRewardResult> {
  const result = await db.execute({
    sql: `SELECT * FROM rewards WHERE reward_id = ? AND dice_id = ? AND deleted_at IS NULL`,
    args: [reward_id, dice_id],
  })
  if (!result.rows[0]) return { success: false, error: 'NOT_FOUND' }

  await db.execute({ sql: `UPDATE rewards SET deleted_at = ? WHERE reward_id = ?`, args: [now(), reward_id] })
  return { success: true }
}

export async function updateReward(
  db: Client,
  dice_id: string,
  reward_id: string,
  input: Partial<UpsertRewardInput>
): Promise<{ success: boolean; error?: 'NOT_FOUND'; reward?: Reward }> {
  const result = await db.execute({
    sql: `SELECT * FROM rewards WHERE reward_id = ? AND dice_id = ? AND deleted_at IS NULL`,
    args: [reward_id, dice_id],
  })
  const existing = result.rows[0] ? asRow<Reward>(result.rows[0] as Record<string, unknown>) : undefined

  if (!existing) return { success: false, error: 'NOT_FOUND' }

  const updated: Reward = {
    ...existing,
    reward_title: input.reward_title?.trim() ?? existing.reward_title,
    reward_description: input.reward_description?.trim() ?? existing.reward_description,
    weight: input.weight ?? existing.weight,
    updated_at: now(),
  }

  await db.execute({
    sql: `UPDATE rewards SET reward_title = ?, reward_description = ?, weight = ?, updated_at = ? WHERE reward_id = ?`,
    args: [updated.reward_title, updated.reward_description, updated.weight, updated.updated_at, updated.reward_id],
  })

  return { success: true, reward: updated }
}
