import { getDb } from './client.js'

export async function runMigrations(): Promise<void> {
  const db = getDb()

  await db.executeMultiple(`
    CREATE TABLE IF NOT EXISTS dice (
      dice_id       TEXT PRIMARY KEY,
      name          TEXT NOT NULL,
      number_of_faces INTEGER NOT NULL,
      created_at    TEXT NOT NULL,
      updated_at    TEXT NOT NULL,
      deleted_at    TEXT DEFAULT NULL
    );

    CREATE TABLE IF NOT EXISTS rewards (
      reward_id     TEXT PRIMARY KEY,
      dice_id       TEXT NOT NULL,
      face_value    INTEGER NOT NULL,
      reward_title  TEXT NOT NULL,
      reward_description TEXT DEFAULT NULL,
      weight        REAL NOT NULL DEFAULT 1.0,
      created_at    TEXT NOT NULL,
      updated_at    TEXT NOT NULL,
      deleted_at    TEXT DEFAULT NULL,
      FOREIGN KEY (dice_id) REFERENCES dice(dice_id)
    );

    CREATE TABLE IF NOT EXISTS roll_history (
      history_id    TEXT PRIMARY KEY,
      dice_id       TEXT NOT NULL,
      dice_name     TEXT NOT NULL,
      rolled_value  INTEGER NOT NULL,
      reward_title  TEXT NOT NULL,
      reward_description TEXT DEFAULT NULL,
      rolled_at     TEXT NOT NULL,
      used          INTEGER NOT NULL DEFAULT 0,
      used_at       TEXT DEFAULT NULL,
      FOREIGN KEY (dice_id) REFERENCES dice(dice_id)
    );

    CREATE INDEX IF NOT EXISTS idx_dice_deleted ON dice(deleted_at);
    CREATE INDEX IF NOT EXISTS idx_rewards_dice ON rewards(dice_id, deleted_at);
    CREATE INDEX IF NOT EXISTS idx_history_dice ON roll_history(dice_id, rolled_at);
    CREATE INDEX IF NOT EXISTS idx_history_used  ON roll_history(used, rolled_at);
  `)

  // Incremental migrations — safe to run on existing DB
  const alterStatements = [
    `ALTER TABLE roll_history ADD COLUMN used    INTEGER NOT NULL DEFAULT 0`,
    `ALTER TABLE roll_history ADD COLUMN used_at TEXT DEFAULT NULL`,
  ]
  for (const sql of alterStatements) {
    try {
      await db.execute(sql)
    } catch {
      // Column already exists — ignore
    }
  }
}
