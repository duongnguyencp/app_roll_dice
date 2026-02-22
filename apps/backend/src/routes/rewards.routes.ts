import { Hono } from 'hono'
import { zValidator } from '@hono/zod-validator'
import { getDb } from '../db/client.js'
import { upsertRewardSchema, bulkUpsertRewardsSchema } from '../middleware/schemas.js'
import {
  listRewards,
  upsertReward,
  bulkUpsertRewards,
  deleteReward,
  updateReward,
} from '../services/rewards.service.js'
import { getDiceById } from '../services/dice.service.js'

const rewardsRouter = new Hono<{ Variables: Record<string, never> }>()

// Verify dice exists for all sub-routes
rewardsRouter.use('/:dice_id/*', async (c, next) => {
  const db = getDb()
  const dice = await getDiceById(db, c.req.param('dice_id'))
  if (!dice) return c.json({ error: 'Xúc xắc không tồn tại' }, 404)
  await next()
})

rewardsRouter.get('/:dice_id/rewards', async (c) => {
  const db = getDb()
  const data = await listRewards(db, c.req.param('dice_id'))
  return c.json({ data })
})

rewardsRouter.post('/:dice_id/rewards', zValidator('json', upsertRewardSchema), async (c) => {
  const db = getDb()
  const dice_id = c.req.param('dice_id')
  const input = c.req.valid('json')

  const dice = (await getDiceById(db, dice_id))!
  if (input.face_value < 1 || input.face_value > dice.number_of_faces) {
    return c.json(
      { error: `face_value phải từ 1 đến ${dice.number_of_faces}` },
      400
    )
  }

  const reward = await upsertReward(db, dice_id, input)
  return c.json({ data: reward }, 201)
})

rewardsRouter.post(
  '/:dice_id/rewards/bulk',
  zValidator('json', bulkUpsertRewardsSchema),
  async (c) => {
    const db = getDb()
    const dice_id = c.req.param('dice_id')
    const { rewards: inputs } = c.req.valid('json')

    const dice = (await getDiceById(db, dice_id))!
    const invalid = inputs.filter(
      (r) => r.face_value < 1 || r.face_value > dice.number_of_faces
    )
    if (invalid.length > 0) {
      return c.json(
        {
          error: `face_value phải từ 1 đến ${dice.number_of_faces}. Giá trị không hợp lệ: ${invalid.map((r) => r.face_value).join(', ')}`,
        },
        400
      )
    }

    const rewards = await bulkUpsertRewards(db, dice_id, inputs)
    return c.json({ data: rewards })
  }
)

rewardsRouter.patch(
  '/:dice_id/rewards/:reward_id',
  zValidator('json', upsertRewardSchema.partial()),
  async (c) => {
    const db = getDb()
    const result = await updateReward(
      db,
      c.req.param('dice_id'),
      c.req.param('reward_id'),
      c.req.valid('json')
    )
    if (!result.success) return c.json({ error: 'Phần thưởng không tồn tại' }, 404)
    return c.json({ data: result.reward })
  }
)

rewardsRouter.delete('/:dice_id/rewards/:reward_id', async (c) => {
  const db = getDb()
  const result = await deleteReward(db, c.req.param('dice_id'), c.req.param('reward_id'))
  if (!result.success) return c.json({ error: 'Phần thưởng không tồn tại' }, 404)
  return c.json({ success: true })
})

export { rewardsRouter }
