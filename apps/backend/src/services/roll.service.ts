import { v4 as uuidv4 } from 'uuid'
import type { Client } from '../db/client.js'
import type { RollResult } from '../types/design.js'

interface FaceWithWeight {
  reward_id: string
  face_value: number
  reward_title: string
  reward_description: string | null
  weight: number
}

// ----------------------------------------------------------------
// Pure business logic — no framework dependency
// ----------------------------------------------------------------

/**
 * Weighted random selection.
 * Given faces with weights, returns the selected face index.
 * Deterministic when rand is provided (for testing).
 */
export function selectWeightedFace(
  faces: FaceWithWeight[],
  rand?: number // inject for testing; defaults to Math.random()
): FaceWithWeight {
  if (faces.length === 0) throw new Error('No faces to select from')

  const totalWeight = faces.reduce((sum, f) => sum + f.weight, 0)
  const r = (rand ?? Math.random()) * totalWeight

  let cumulative = 0
  for (const face of faces) {
    cumulative += face.weight
    if (r < cumulative) return face
  }

  // Fallback (floating point edge case)
  return faces[faces.length - 1]!
}

/**
 * Find which face_values (1..N) have no active reward.
 * Pure function used for pre-roll validation.
 */
export function findMissingFaces(
  numberOfFaces: number,
  assignedFaceValues: number[]
): number[] {
  const assigned = new Set(assignedFaceValues)
  const missing: number[] = []
  for (let i = 1; i <= numberOfFaces; i++) {
    if (!assigned.has(i)) missing.push(i)
  }
  return missing
}

// ----------------------------------------------------------------
// Roll use case — orchestrates DB + pure logic
// ----------------------------------------------------------------

export type RollDiceResult =
  | { ok: true; data: RollResult }
  | { ok: false; error: 'NOT_FOUND' }
  | { ok: false; error: 'INCOMPLETE_REWARDS'; missing_faces: number[] }

export async function rollDice(db: Client, dice_id: string): Promise<RollDiceResult> {
  // 1. Fetch dice
  const diceResult = await db.execute({
    sql: `SELECT * FROM dice WHERE dice_id = ? AND deleted_at IS NULL`,
    args: [dice_id],
  })
  const dice = diceResult.rows[0] as unknown as { dice_id: string; name: string; number_of_faces: number } | undefined

  if (!dice) return { ok: false, error: 'NOT_FOUND' }

  // 2. Fetch active faces
  const facesResult = await db.execute({
    sql: `SELECT reward_id, face_value, reward_title, reward_description, weight
          FROM rewards WHERE dice_id = ? AND deleted_at IS NULL ORDER BY face_value ASC`,
    args: [dice_id],
  })
  const faces = facesResult.rows as unknown as FaceWithWeight[]

  // 3. Validate completeness
  const missing = findMissingFaces(dice.number_of_faces, faces.map((f) => f.face_value))
  if (missing.length > 0) {
    return { ok: false, error: 'INCOMPLETE_REWARDS', missing_faces: missing }
  }

  // 4. Weighted random selection
  const selected = selectWeightedFace(faces)

  // 5. Persist history (snapshot)
  const rolled_at = new Date().toISOString()
  await db.execute({
    sql: `INSERT INTO roll_history (history_id, dice_id, dice_name, rolled_value, reward_title, reward_description, rolled_at)
          VALUES (?, ?, ?, ?, ?, ?, ?)`,
    args: [uuidv4(), dice_id, dice.name, selected.face_value, selected.reward_title, selected.reward_description, rolled_at],
  })

  return {
    ok: true,
    data: {
      roll: selected.face_value,
      reward: {
        reward_id: selected.reward_id,
        title: selected.reward_title,
        description: selected.reward_description,
      },
      rolled_at,
    },
  }
}
