import type { Client } from '../db/client.js'
import type { RollHistory, RollHistoryListResponse } from '../types/design.js'

interface RawHistoryRow {
  history_id: string
  dice_id: string
  dice_name: string
  rolled_value: number
  reward_title: string
  reward_description: string | null
  rolled_at: string
  used: number   // SQLite stores booleans as 0/1
  used_at: string | null
}

function toRollHistory(row: RawHistoryRow): RollHistory {
  return {
    ...row,
    used: row.used === 1,
  }
}

// ─── List history (paginated, optional filter by dice_id / used) ────────────

export interface ListHistoryOptions {
  dice_id?: string
  used?: boolean        // undefined = all
  page?: number
  page_size?: number
}

export async function listHistory(
  db: Client,
  opts: ListHistoryOptions = {}
): Promise<RollHistoryListResponse> {
  const page = Math.max(1, opts.page ?? 1)
  const page_size = Math.min(100, Math.max(1, opts.page_size ?? 20))
  const offset = (page - 1) * page_size

  const conditions: string[] = []
  const args: (string | number)[] = []

  if (opts.dice_id) {
    conditions.push('dice_id = ?')
    args.push(opts.dice_id)
  }
  if (opts.used !== undefined) {
    conditions.push('used = ?')
    args.push(opts.used ? 1 : 0)
  }

  const where = conditions.length ? `WHERE ${conditions.join(' AND ')}` : ''

  const countResult = await db.execute({
    sql: `SELECT COUNT(*) as cnt FROM roll_history ${where}`,
    args,
  })
  const total = Number((countResult.rows[0] as unknown as { cnt: number }).cnt)

  const dataResult = await db.execute({
    sql: `SELECT * FROM roll_history ${where} ORDER BY rolled_at DESC LIMIT ? OFFSET ?`,
    args: [...args, page_size, offset],
  })

  return {
    data: (dataResult.rows as unknown as RawHistoryRow[]).map(toRollHistory),
    total,
    page,
    page_size,
  }
}

// ─── Mark used / unuse ────────────────────────────────────────────────────────

export type MarkUsedResult =
  | { ok: true; data: RollHistory }
  | { ok: false; error: 'NOT_FOUND' }

export async function markRewardUsed(
  db: Client,
  history_id: string,
  used: boolean
): Promise<MarkUsedResult> {
  const used_at = used ? new Date().toISOString() : null

  const existing = await db.execute({
    sql: `SELECT * FROM roll_history WHERE history_id = ?`,
    args: [history_id],
  })
  if (!existing.rows.length) return { ok: false, error: 'NOT_FOUND' }

  await db.execute({
    sql: `UPDATE roll_history SET used = ?, used_at = ? WHERE history_id = ?`,
    args: [used ? 1 : 0, used_at, history_id],
  })

  const updated = await db.execute({
    sql: `SELECT * FROM roll_history WHERE history_id = ?`,
    args: [history_id],
  })

  return {
    ok: true,
    data: toRollHistory(updated.rows[0] as unknown as RawHistoryRow),
  }
}
