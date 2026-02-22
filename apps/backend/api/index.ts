import { handle } from 'hono/vercel'
import app from '../src/app.js'
import { runMigrations } from '../src/db/migrate.js'

// Run migrations on cold start (safe to call multiple times — idempotent)
await runMigrations()

export default handle(app)
