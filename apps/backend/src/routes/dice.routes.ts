import { Hono } from 'hono'
import { zValidator } from '@hono/zod-validator'
import { getDb } from '../db/client.js'
import { createDiceSchema, updateDiceSchema } from '../middleware/schemas.js'
import {
  listDice,
  getDiceById,
  createDice,
  updateDice,
  deleteDice,
} from '../services/dice.service.js'

const diceRouter = new Hono()

diceRouter.get('/', async (c) => {
  const db = getDb()
  const data = await listDice(db)
  return c.json({ data, total: data.length })
})

diceRouter.get('/:dice_id', async (c) => {
  const db = getDb()
  const dice = await getDiceById(db, c.req.param('dice_id'))
  if (!dice) return c.json({ error: 'Xúc xắc không tồn tại' }, 404)
  return c.json({ data: dice })
})

diceRouter.post('/', zValidator('json', createDiceSchema), async (c) => {
  const db = getDb()
  const input = c.req.valid('json')
  const dice = await createDice(db, input)
  return c.json({ data: dice }, 201)
})

diceRouter.patch('/:dice_id', zValidator('json', updateDiceSchema), async (c) => {
  const db = getDb()
  const input = c.req.valid('json')
  const result = await updateDice(db, c.req.param('dice_id'), input)

  if (!result.success) {
    if (result.error === 'NOT_FOUND') return c.json({ error: 'Xúc xắc không tồn tại' }, 404)
    if (result.error === 'FACES_LOCKED') {
      return c.json(
        {
          error: 'Không thể sửa số mặt khi đã có phần thưởng được gán. Hãy xóa tất cả phần thưởng trước.',
        },
        409
      )
    }
  }

  return c.json({ data: result.dice })
})

diceRouter.delete('/:dice_id', async (c) => {
  const db = getDb()
  const result = await deleteDice(db, c.req.param('dice_id'))
  if (!result.success) return c.json({ error: 'Xúc xắc không tồn tại' }, 404)
  return c.json({ success: true })
})

export { diceRouter }
