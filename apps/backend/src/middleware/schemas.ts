import { z } from 'zod'

export const createDiceSchema = z.object({
  name: z
    .string({ required_error: 'Tên xúc xắc không được để trống' })
    .trim()
    .min(1, 'Tên xúc xắc không được để trống')
    .max(100, 'Tên xúc xắc tối đa 100 ký tự'),
  number_of_faces: z
    .number({ required_error: 'Số mặt là bắt buộc' })
    .int('Số mặt phải là số nguyên')
    .min(2, 'Xúc xắc phải có ít nhất 2 mặt')
    .max(1000, 'Số mặt tối đa là 1000'),
})

export const updateDiceSchema = z.object({
  name: z
    .string()
    .trim()
    .min(1, 'Tên xúc xắc không được để trống')
    .max(100, 'Tên xúc xắc tối đa 100 ký tự')
    .optional(),
  number_of_faces: z
    .number()
    .int('Số mặt phải là số nguyên')
    .min(2, 'Xúc xắc phải có ít nhất 2 mặt')
    .max(1000, 'Số mặt tối đa là 1000')
    .optional(),
})

export const upsertRewardSchema = z.object({
  face_value: z.number().int().min(1),
  reward_title: z
    .string()
    .trim()
    .min(1, 'Tên phần thưởng không được để trống')
    .max(200, 'Tên phần thưởng tối đa 200 ký tự'),
  reward_description: z
    .string()
    .trim()
    .max(500, 'Mô tả tối đa 500 ký tự')
    .optional()
    .nullable(),
  weight: z
    .number()
    .min(0.1, 'Weight tối thiểu là 0.1')
    .max(100, 'Weight tối đa là 100')
    .default(1.0),
})

export const bulkUpsertRewardsSchema = z.object({
  rewards: z.array(upsertRewardSchema).min(1, 'Cần ít nhất 1 reward'),
})
