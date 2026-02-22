import { describe, it, expect, beforeEach, afterEach } from 'vitest'
import { createClient, type Client } from '@libsql/client'
import { selectWeightedFace, findMissingFaces, rollDice } from '../src/services/roll.service.js'

// ---- Pure function tests ----

describe('findMissingFaces', () => {
  it('returns empty array when all faces assigned', () => {
    expect(findMissingFaces(4, [1, 2, 3, 4])).toEqual([])
  })

  it('returns missing faces', () => {
    expect(findMissingFaces(4, [1, 3])).toEqual([2, 4])
  })

  it('returns all faces when none assigned', () => {
    expect(findMissingFaces(3, [])).toEqual([1, 2, 3])
  })

  it('handles large dice (n=100)', () => {
    const assigned = Array.from({ length: 95 }, (_, i) => i + 1)
    expect(findMissingFaces(100, assigned)).toEqual([96, 97, 98, 99, 100])
  })
})

describe('selectWeightedFace', () => {
  const faces = [
    { reward_id: 'r1', face_value: 1, reward_title: 'A', reward_description: null, weight: 1 },
    { reward_id: 'r2', face_value: 2, reward_title: 'B', reward_description: null, weight: 3 },
    { reward_id: 'r3', face_value: 3, reward_title: 'C', reward_description: null, weight: 1 },
  ]

  it('throws when faces array is empty', () => {
    expect(() => selectWeightedFace([])).toThrow('No faces to select from')
  })

  it('returns correct face for deterministic rand=0', () => {
    // rand=0 → 0 * 5 = 0 → cumulative: face1=1 → 0 < 1 → face1
    const result = selectWeightedFace(faces, 0)
    expect(result.face_value).toBe(1)
  })

  it('returns face 2 when rand hits its weight range', () => {
    // totalWeight=5, rand=0.21 → 0.21*5=1.05 → cumulative: 1 → 1+3=4 → 1.05 < 4 → face2
    const result = selectWeightedFace(faces, 0.21)
    expect(result.face_value).toBe(2)
  })

  it('returns face 3 when rand hits last range', () => {
    // rand=0.99 → 4.95 → cumulative: 1,4 → 4.95 >= 4 → face3
    const result = selectWeightedFace(faces, 0.99)
    expect(result.face_value).toBe(3)
  })

  it('handles edge case: floating point fallback to last face', () => {
    const single = [{ reward_id: 'r1', face_value: 1, reward_title: 'A', reward_description: null, weight: 1 }]
    expect(selectWeightedFace(single, 0.9999999)).toBeDefined()
  })

  it('statistical distribution is correct within 5% error over 10000 rolls', () => {
    // face1: weight=5, face2:1, face3:1 → 71.4%, 14.3%, 14.3%
    const weighted = [
      { reward_id: 'r1', face_value: 1, reward_title: 'A', reward_description: null, weight: 5 },
      { reward_id: 'r2', face_value: 2, reward_title: 'B', reward_description: null, weight: 1 },
      { reward_id: 'r3', face_value: 3, reward_title: 'C', reward_description: null, weight: 1 },
    ]
    const counts: Record<number, number> = { 1: 0, 2: 0, 3: 0 }
    const N = 10_000

    for (let i = 0; i < N; i++) {
      const f = selectWeightedFace(weighted)
      counts[f.face_value]++
    }

    const pct1 = counts[1]! / N
    const pct2 = counts[2]! / N
    const pct3 = counts[3]! / N

    expect(pct1).toBeGreaterThan(0.664) // 71.4% - 5%
    expect(pct1).toBeLessThan(0.764)   // 71.4% + 5%
    expect(pct2).toBeGreaterThan(0.093)
    expect(pct2).toBeLessThan(0.193)
    expect(pct3).toBeGreaterThan(0.093)
    expect(pct3).toBeLessThan(0.193)
  })

  it('works with extreme weight imbalance (1 vs 99)', () => {
    const extremes = [
      { reward_id: 'r1', face_value: 1, reward_title: 'Rare', reward_description: null, weight: 1 },
      { reward_id: 'r2', face_value: 2, reward_title: 'Common', reward_description: null, weight: 99 },
    ]
    const counts = { 1: 0, 2: 0 }
    for (let i = 0; i < 1000; i++) {
      const f = selectWeightedFace(extremes)
      counts[f.face_value as 1 | 2]++
    }
    // face2 should appear ~99% of the time
    expect(counts[2] / 1000).toBeGreaterThan(0.93)
  })
})

// ---- Integration tests using in-memory libsql ----

const DDL = `
  CREATE TABLE IF NOT EXISTS dice (
    dice_id TEXT PRIMARY KEY, name TEXT NOT NULL,
    number_of_faces INTEGER NOT NULL, created_at TEXT NOT NULL,
    updated_at TEXT NOT NULL, deleted_at TEXT DEFAULT NULL
  );
  CREATE TABLE IF NOT EXISTS rewards (
    reward_id TEXT PRIMARY KEY, dice_id TEXT NOT NULL,
    face_value INTEGER NOT NULL, reward_title TEXT NOT NULL,
    reward_description TEXT DEFAULT NULL, weight REAL NOT NULL DEFAULT 1.0,
    created_at TEXT NOT NULL, updated_at TEXT NOT NULL, deleted_at TEXT DEFAULT NULL
  );
  CREATE TABLE IF NOT EXISTS roll_history (
    history_id TEXT PRIMARY KEY, dice_id TEXT NOT NULL,
    dice_name TEXT NOT NULL, rolled_value INTEGER NOT NULL,
    reward_title TEXT NOT NULL, reward_description TEXT DEFAULT NULL,
    rolled_at TEXT NOT NULL
  );
`

async function createTestDb(): Promise<Client> {
  const client = createClient({ url: ':memory:' })
  await client.executeMultiple(DDL)
  return client
}

let counter = 0
async function insertDice(db: Client, faces: number): Promise<string> {
  const id = `dice-test-${++counter}`
  await db.execute({
    sql: `INSERT INTO dice VALUES (?, 'Test Dice', ?, datetime('now'), datetime('now'), NULL)`,
    args: [id, faces],
  })
  return id
}

async function insertReward(db: Client, dice_id: string, face_value: number, weight = 1) {
  await db.execute({
    sql: `INSERT INTO rewards VALUES (?, ?, ?, ?, NULL, ?, datetime('now'), datetime('now'), NULL)`,
    args: [`reward-${dice_id}-${face_value}`, dice_id, face_value, `Reward ${face_value}`, weight],
  })
}

describe('rollDice (integration)', () => {
  let db: Client

  beforeEach(async () => { db = await createTestDb() })
  afterEach(() => { db.close() })

  it('returns NOT_FOUND for non-existent dice', async () => {
    const result = await rollDice(db, 'no-such-id')
    expect(result.ok).toBe(false)
    if (!result.ok) expect(result.error).toBe('NOT_FOUND')
  })

  it('returns INCOMPLETE_REWARDS with missing faces listed', async () => {
    const dice_id = await insertDice(db, 4)
    await insertReward(db, dice_id, 1)
    await insertReward(db, dice_id, 2)

    const result = await rollDice(db, dice_id)
    expect(result.ok).toBe(false)
    if (!result.ok && result.error === 'INCOMPLETE_REWARDS') {
      expect(result.missing_faces).toEqual([3, 4])
    }
  })

  it('returns valid roll result when all faces have rewards', async () => {
    const dice_id = await insertDice(db, 3)
    await insertReward(db, dice_id, 1)
    await insertReward(db, dice_id, 2)
    await insertReward(db, dice_id, 3)

    const result = await rollDice(db, dice_id)
    expect(result.ok).toBe(true)

    if (result.ok) {
      expect(result.data.roll).toBeGreaterThanOrEqual(1)
      expect(result.data.roll).toBeLessThanOrEqual(3)
      expect(result.data.reward.title).toBeDefined()
      expect(result.data.rolled_at).toBeDefined()
    }
  })

  it('writes snapshot to roll_history', async () => {
    const dice_id = await insertDice(db, 2)
    await insertReward(db, dice_id, 1)
    await insertReward(db, dice_id, 2)

    await rollDice(db, dice_id)

    const history = await db.execute({
      sql: 'SELECT * FROM roll_history WHERE dice_id = ?',
      args: [dice_id],
    })
    expect(history.rows.length).toBe(1)
  })

  it('does not break when rolled-against deleted dice face', async () => {
    const dice_id = await insertDice(db, 2)
    await insertReward(db, dice_id, 1)
    await insertReward(db, dice_id, 2)
    // Soft-delete face 2
    await db.execute({
      sql: `UPDATE rewards SET deleted_at = datetime('now') WHERE dice_id = ? AND face_value = 2`,
      args: [dice_id],
    })

    const result = await rollDice(db, dice_id)
    expect(result.ok).toBe(false)
    if (!result.ok && result.error === 'INCOMPLETE_REWARDS') {
      expect(result.missing_faces).toContain(2)
    }
  })
})
