import { v4 as uuidv4 } from 'uuid'
import type { Client } from '../db/client.js'
import type { Dice, DiceWithRewardCount, CreateDiceInput, UpdateDiceInput } from '../types/design.js'

function now(): string {
  return new Date().toISOString()
}

function asRow<T>(row: Record<string, unknown>): T {
  return row as unknown as T
}

export async function listDice(db: Client): Promise<DiceWithRewardCount[]> {
  const result = await db.execute(`
    SELECT d.*,
           COUNT(r.reward_id) as reward_count
    FROM dice d
    LEFT JOIN rewards r ON r.dice_id = d.dice_id AND r.deleted_at IS NULL
    WHERE d.deleted_at IS NULL
    GROUP BY d.dice_id
    ORDER BY d.created_at DESC
  `)
  return result.rows.map((r) => asRow<DiceWithRewardCount>(r as Record<string, unknown>))
}

export async function getDiceById(db: Client, dice_id: string): Promise<Dice | null> {
  const result = await db.execute({
    sql: `SELECT * FROM dice WHERE dice_id = ? AND deleted_at IS NULL`,
    args: [dice_id],
  })
  return result.rows[0] ? asRow<Dice>(result.rows[0] as Record<string, unknown>) : null
}

export async function createDice(db: Client, input: CreateDiceInput): Promise<Dice> {
  const dice: Dice = {
    dice_id: uuidv4(),
    name: input.name.trim(),
    number_of_faces: input.number_of_faces,
    created_at: now(),
    updated_at: now(),
    deleted_at: null,
  }

  await db.execute({
    sql: `INSERT INTO dice (dice_id, name, number_of_faces, created_at, updated_at, deleted_at)
          VALUES (?, ?, ?, ?, ?, ?)`,
    args: [dice.dice_id, dice.name, dice.number_of_faces, dice.created_at, dice.updated_at, dice.deleted_at],
  })

  return dice
}

export interface UpdateDiceResult {
  success: boolean
  error?: 'NOT_FOUND' | 'FACES_LOCKED'
  dice?: Dice
}

export async function updateDice(
  db: Client,
  dice_id: string,
  input: UpdateDiceInput
): Promise<UpdateDiceResult> {
  const existing = await getDiceById(db, dice_id)
  if (!existing) return { success: false, error: 'NOT_FOUND' }

  if (input.number_of_faces !== undefined && input.number_of_faces !== existing.number_of_faces) {
    const countResult = await db.execute({
      sql: `SELECT COUNT(*) as cnt FROM rewards WHERE dice_id = ? AND deleted_at IS NULL`,
      args: [dice_id],
    })
    const cnt = Number((countResult.rows[0] as Record<string, unknown>)['cnt'] ?? 0)
    if (cnt > 0) return { success: false, error: 'FACES_LOCKED' }
  }

  const updated: Dice = {
    ...existing,
    name: input.name !== undefined ? input.name.trim() : existing.name,
    number_of_faces: input.number_of_faces ?? existing.number_of_faces,
    updated_at: now(),
  }

  await db.execute({
    sql: `UPDATE dice SET name = ?, number_of_faces = ?, updated_at = ? WHERE dice_id = ?`,
    args: [updated.name, updated.number_of_faces, updated.updated_at, dice_id],
  })

  return { success: true, dice: updated }
}

export interface DeleteDiceResult {
  success: boolean
  error?: 'NOT_FOUND'
}

export async function deleteDice(db: Client, dice_id: string): Promise<DeleteDiceResult> {
  const existing = await getDiceById(db, dice_id)
  if (!existing) return { success: false, error: 'NOT_FOUND' }

  const ts = now()

  await db.batch([
    { sql: `UPDATE rewards SET deleted_at = ? WHERE dice_id = ? AND deleted_at IS NULL`, args: [ts, dice_id] },
    { sql: `UPDATE dice SET deleted_at = ? WHERE dice_id = ?`, args: [ts, dice_id] },
  ], 'write')

  return { success: true }
}
