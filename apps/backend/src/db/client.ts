import { createClient } from '@libsql/client'
import type { Client } from '@libsql/client'

let client: Client | null = null

/**
 * Returns a libsql Client (async interface).
 *
 * Connection priority:
 *  1. TURSO_DATABASE_URL / TURSO_AUTH_TOKEN  → Turso cloud  (Vercel production)
 *  2. DB_PATH env                            → local file   (Docker: /data/data.db)
 *  3. default                                → ./data.db    (local dev)
 */
export function getDb(): Client {
  if (!client) {
    const url =
      process.env.TURSO_DATABASE_URL ??
      `file:${process.env.DB_PATH ?? './data.db'}`

    const authToken = process.env.TURSO_AUTH_TOKEN ?? undefined
    client = createClient({ url, authToken })
  }
  return client
}

export function closeDb(): void {
  client?.close()
  client = null
}

export type { Client }
