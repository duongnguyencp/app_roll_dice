import { serve } from '@hono/node-server'
import app from './app.js'
import { runMigrations } from './db/migrate.js'

async function main() {
  await runMigrations()
  console.log('[DB] Migrations applied')

  const PORT = Number(process.env.PORT ?? 3000)

  serve({ fetch: app.fetch, port: PORT }, () => {
    console.log(`[Server] Running on http://localhost:${PORT}`)
  })
}

main().catch((err) => {
  console.error('[Fatal]', err)
  process.exit(1)
})
