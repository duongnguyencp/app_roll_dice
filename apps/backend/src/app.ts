import { Hono } from 'hono'
import { cors } from 'hono/cors'
import { logger } from 'hono/logger'
import { prettyJSON } from 'hono/pretty-json'
import { diceRouter } from './routes/dice.routes.js'
import { rewardsRouter } from './routes/rewards.routes.js'
import { rollRouter } from './routes/roll.routes.js'

const app = new Hono()

const FRONTEND_ORIGIN = process.env.FRONTEND_ORIGIN ?? 'http://localhost:5173'

app.use('*', logger())
app.use('*', prettyJSON())
app.use(
  '*',
  cors({
    origin: FRONTEND_ORIGIN,
    allowMethods: ['GET', 'POST', 'PATCH', 'DELETE', 'OPTIONS'],
    allowHeaders: ['Content-Type'],
  })
)

app.get('/api/health', (c) => c.json({ ok: true, ts: new Date().toISOString() }))

app.route('/api/dice', diceRouter)
app.route('/api/dice', rewardsRouter)
app.route('/api/dice', rollRouter)

app.onError((err, c) => {
  console.error('[Error]', err)
  return c.json({ error: 'Lỗi máy chủ nội bộ' }, 500)
})

app.notFound((c) => c.json({ error: 'Endpoint không tồn tại' }, 404))

export default app
