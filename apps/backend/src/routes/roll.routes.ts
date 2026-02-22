import { Hono } from 'hono'
import { getDb } from '../db/client.js'
import { rollDice } from '../services/roll.service.js'

const rollRouter = new Hono()

rollRouter.post('/:dice_id/roll', async (c) => {
  const db = getDb()
  const result = await rollDice(db, c.req.param('dice_id'))

  if (!result.ok) {
    if (result.error === 'NOT_FOUND') {
      return c.json({ error: 'Xúc xắc không tồn tại' }, 404)
    }
    if (result.error === 'INCOMPLETE_REWARDS') {
      return c.json(
        {
          error: 'INCOMPLETE_REWARDS',
          message: `Dice chưa đủ phần thưởng. Mặt còn thiếu: [${result.missing_faces.join(', ')}]`,
          missing_faces: result.missing_faces,
        },
        400
      )
    }
  }

  return c.json(result.data)
})

export { rollRouter }
