import type { Page } from '@playwright/test'

export const API = 'http://localhost:3001/api'

/** Create a dice with N faces and N rewards via API. Returns dice_id. */
export async function setupDiceWithRewards(
  page: Page,
  opts: { name?: string; faces?: number } = {}
): Promise<string> {
  const name = opts.name ?? `TestDice-${Date.now()}`
  const faces = opts.faces ?? 6

  // Create dice
  const diceRes = await page.request.post(`${API}/dice`, {
    data: { name, number_of_faces: faces },
    headers: { 'Content-Type': 'application/json' },
  })
  if (!diceRes.ok()) throw new Error(`Create dice failed: ${await diceRes.text()}`)
  const diceJson = await diceRes.json()
  const dice_id: string = diceJson.data.dice_id

  // Create one reward per face (weight max is 100)
  const rewards = Array.from({ length: faces }, (_, i) => ({
    face_value: i + 1,
    reward_title: `Phần thưởng mặt ${i + 1}`,
    reward_description: `Mô tả cho mặt ${i + 1}`,
    weight: 1,
  }))

  const bulkRes = await page.request.post(`${API}/dice/${dice_id}/rewards/bulk`, {
    data: { rewards },
    headers: { 'Content-Type': 'application/json' },
  })
  if (!bulkRes.ok()) throw new Error(`Create rewards failed: ${await bulkRes.text()}`)

  return dice_id
}

/**
 * Setup a "near-deterministic" dice:
 *  - 2 faces (minimum allowed by the API)
 *  - face 1: weight 100 (highest allowed; ~99% win rate)
 *  - face 2: weight 1
 * So in practice the result is almost always face 1.
 */
export async function setupSingleFaceDice(page: Page): Promise<{ dice_id: string; reward_title: string }> {
  const name = `SingleFace-${Date.now()}`
  const diceRes = await page.request.post(`${API}/dice`, {
    data: { name, number_of_faces: 2 },
    headers: { 'Content-Type': 'application/json' },
  })
  if (!diceRes.ok()) throw new Error(`Create dice failed: ${await diceRes.text()}`)
  const diceJson = await diceRes.json()
  const dice_id: string = diceJson.data.dice_id
  const reward_title = 'Jackpot! Bạn thắng 100k'

  const bulkRes = await page.request.post(`${API}/dice/${dice_id}/rewards/bulk`, {
    data: {
      rewards: [
        { face_value: 1, reward_title, reward_description: 'Nhận 100k tiền mặt', weight: 100 },
        { face_value: 2, reward_title: 'Không trúng', reward_description: null, weight: 1 },
      ],
    },
    headers: { 'Content-Type': 'application/json' },
  })
  if (!bulkRes.ok()) throw new Error(`Create rewards failed: ${await bulkRes.text()}`)

  return { dice_id, reward_title }
}

/** Navigate home and wait for the given dice_id to be selected & ready.
 *  If dice_id is provided, explicitly selects it in the dropdown. */
export async function goHome(page: Page, dice_id?: string) {
  await page.goto('/')
  await page.waitForLoadState('networkidle')

  if (dice_id) {
    // Explicitly select the target dice (in case it's not the first in the list)
    await page.selectOption('[data-testid="dice-select"]', dice_id)
  }
}

/** Wait for roll animation + result card to appear (15s timeout to cover 2.2s anim) */
export async function waitForResult(page: Page) {
  await page.waitForSelector('[data-testid="result-card"]', { timeout: 15_000 })
}
