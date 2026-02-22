import { Hono } from 'hono'
import { getDb } from '../db/client.js'
import { listHistory, markRewardUsed } from '../services/history.service.js'

const historyRouter = new Hono()

/**
 * GET /api/history
 * Query params: dice_id?, used? (true|false), page?, page_size?
 */
historyRouter.get('/', async (c) => {
  const db = getDb()
  const q = c.req.query()

  const usedParam = q.used
  const used = usedParam === 'true' ? true : usedParam === 'false' ? false : undefined

  const result = await listHistory(db, {
    dice_id: q.dice_id || undefined,
    used,
    page: q.page ? Number(q.page) : undefined,
    page_size: q.page_size ? Number(q.page_size) : undefined,
  })

  return c.json(result)
})

/**
 * PATCH /api/history/:history_id/use
 * Body: { used: boolean }
 */
historyRouter.patch('/:history_id/use', async (c) => {
  const db = getDb()
  const history_id = c.req.param('history_id')
  const body = await c.req.json<{ used: boolean }>()

  if (typeof body.used !== 'boolean') {
    return c.json({ error: 'Field "used" phải là boolean' }, 400)
  }

  const result = await markRewardUsed(db, history_id, body.used)

  if (!result.ok) {
    return c.json({ error: 'Không tìm thấy lịch sử' }, 404)
  }

  return c.json(result.data)
})

export { historyRouter }
