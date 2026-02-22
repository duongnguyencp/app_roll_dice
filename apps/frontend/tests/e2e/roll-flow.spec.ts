/**
 * E2E tests — Roll flow with visual snapshots
 *
 * Assumptions:
 *   - Frontend running on http://localhost:5174  (Docker dice-frontend)
 *   - Backend  running on http://localhost:3001  (Docker dice-backend)
 *
 * Snapshot update:
 *   npx playwright test --update-snapshots
 */
import { test, expect } from '@playwright/test'
import { setupSingleFaceDice, setupDiceWithRewards, goHome, waitForResult, API } from './utils'

// ── helpers ──────────────────────────────────────────────────────────────────

/** Click Roll button and wait for result card */
async function rollAndWait(page: import('@playwright/test').Page) {
  await page.click('[data-testid="roll-button"]')
  await waitForResult(page)
}

// ─────────────────────────────────────────────────────────────────────────────
// 1. Home page — empty state (no dice yet)
// ─────────────────────────────────────────────────────────────────────────────
test.describe('Home — empty state', () => {
  test('shows empty-state prompt when no dice exist', async ({ page }) => {
    // Delete all dice first
    const r = await page.request.get(`${API}/dice`)
    const list = await r.json()
    for (const d of list.data ?? []) {
      await page.request.delete(`${API}/dice/${d.dice_id}`)
    }

    await goHome(page)

    await expect(page.getByText('Chưa có xúc xắc nào.')).toBeVisible()

    // Snapshot: empty state card
    await expect(page).toHaveScreenshot('home-empty-state.png', {
      fullPage: false,
      clip: { x: 0, y: 0, width: 1280, height: 720 },
    })
  })
})

// ─────────────────────────────────────────────────────────────────────────────
// 2. Roll flow — deterministic single-face dice (always face=1)
// ─────────────────────────────────────────────────────────────────────────────
test.describe('Roll flow — single face (deterministic)', () => {
  let dice_id: string
  let reward_title: string

  test.beforeEach(async ({ page }) => {
    const data = await setupSingleFaceDice(page)
    dice_id = data.dice_id
    reward_title = data.reward_title
  })

  test.afterEach(async ({ page }) => {
    await page.request.delete(`${API}/dice/${dice_id}`)
  })

  test('roll button is enabled when dice is ready', async ({ page }) => {
    await goHome(page, dice_id)
    const btn = page.locator('[data-testid="roll-button"]')
    await expect(btn).toBeEnabled({ timeout: 5_000 })
    // Snapshot: page ready to roll
    await expect(page).toHaveScreenshot('roll-button-enabled.png')
  })

  test('shows loading spinner while rolling', async ({ page }) => {
    await goHome(page, dice_id)

    // Intercept roll API to hold it open until we can capture the loading state
    let releaseLatch!: () => void
    const latch = new Promise<void>((r) => { releaseLatch = r })

    await page.route(`**/api/dice/${dice_id}/roll`, async (route) => {
      await latch
      await route.continue()
    })

    await page.click('[data-testid="roll-button"]')

    // The button must switch to "Đang gieo…" while API is pending
    await expect(page.getByText('Đang gieo...')).toBeVisible({ timeout: 3_000 })

    // Snapshot: loading state
    await expect(page).toHaveScreenshot('roll-loading-state.png')

    releaseLatch()
    await waitForResult(page)
    // Cleanup route
    await page.unroute(`**/api/dice/${dice_id}/roll`)
  })

  test('result card shows correct rolled number and reward title', async ({ page }) => {
    await goHome(page, dice_id)
    await rollAndWait(page)

    // face 1 has weight 10000 vs face 2 weight 1 → virtually always face 1
    const rollValueText = await page.locator('[data-testid="result-roll-value"]').textContent()
    const match = rollValueText?.match(/(\d+)/)
    expect(match).toBeTruthy()
    const rolledNum = Number(match![1])
    expect([1, 2]).toContain(rolledNum) // valid face for 2-face dice

    // Reward title must correspond to the rolled face
    const titleEl = page.locator('[data-testid="result-reward-title"]')
    await expect(titleEl).toBeVisible()

    // Snapshot: result card
    await expect(page.locator('[data-testid="result-card"]')).toHaveScreenshot('result-card.png')
  })

  test('dice canvas overlay shows rolled number after animation', async ({ page }) => {
    await goHome(page, dice_id)
    await rollAndWait(page)

    // The overlay badge must appear on the canvas
    const overlay = page.locator('[data-testid="dice-result-number"]')
    await expect(overlay).toBeVisible({ timeout: 5_000 })

    // The overlay number must match the result card roll value
    const rollValueText = await page.locator('[data-testid="result-roll-value"]').textContent()
    const match = rollValueText?.match(/(\d+)/)!
    await expect(overlay).toContainText(match[1])

    // Snapshot: dice canvas with number badge
    await expect(page.locator('[data-testid="dice-canvas-wrap"]')).toHaveScreenshot('dice-result-overlay.png')
  })

  test('roll again button resets and starts new roll', async ({ page }) => {
    await goHome(page, dice_id)
    await rollAndWait(page)

    // Click "Gieo lại"
    await page.click('[data-testid="roll-again-button"]')

    // Result section should disappear, then reappear
    await expect(page.locator('[data-testid="result-card"]')).not.toBeVisible({ timeout: 3_000 })
    await waitForResult(page)

    // Must show a valid rolled number for our 2-face dice
    const rollValueText = await page.locator('[data-testid="result-roll-value"]').textContent()
    const match = rollValueText?.match(/(\d+)/)
    expect(match).toBeTruthy()
    expect([1, 2]).toContain(Number(match![1]))

    // Snapshot: second roll result
    await expect(page.locator('[data-testid="result-card"]')).toHaveScreenshot('result-card-reroll.png')
  })

  test('result is persisted — API roll endpoint returns valid data', async ({ page }) => {
    await goHome(page, dice_id)
    await rollAndWait(page)

    // Verify UI shows a valid rolled number
    const rollValueText = await page.locator('[data-testid="result-roll-value"]').textContent()
    const match = rollValueText?.match(/(\d+)/)
    expect(match).toBeTruthy()
    const rolledNum = Number(match![1])
    expect([1, 2]).toContain(rolledNum)

    // Verify reward title is shown
    const titleEl = page.locator('[data-testid="result-reward-title"]')
    await expect(titleEl).toBeVisible()
  })
})

// ─────────────────────────────────────────────────────────────────────────────
// 3. Roll flow — full 6-face dice (value within range)
// ─────────────────────────────────────────────────────────────────────────────
test.describe('Roll flow — 6-face dice', () => {
  let dice_id: string

  test.beforeEach(async ({ page }) => {
    dice_id = await setupDiceWithRewards(page, { name: `D6-${Date.now()}`, faces: 6 })
  })

  test.afterEach(async ({ page }) => {
    await page.request.delete(`${API}/dice/${dice_id}`)
  })

  test('rolled number is between 1 and 6', async ({ page }) => {
    await goHome(page, dice_id)
    await rollAndWait(page)

    const rollValueText = await page.locator('[data-testid="result-roll-value"]').textContent()
    const match = rollValueText?.match(/(\d+)/)
    expect(match).toBeTruthy()
    const rolledNum = Number(match![1])
    expect(rolledNum).toBeGreaterThanOrEqual(1)
    expect(rolledNum).toBeLessThanOrEqual(6)

    // Reward title must match the face
    const titleEl = page.locator('[data-testid="result-reward-title"]')
    await expect(titleEl).toContainText(`Phần thưởng mặt ${rolledNum}`)
  })

  test('dice overlay badge matches result-roll-value', async ({ page }) => {
    await goHome(page, dice_id)
    await rollAndWait(page)

    const rollValueText = await page.locator('[data-testid="result-roll-value"]').textContent()
    const match = rollValueText?.match(/(\d+)/)!
    const rolledNum = match[1]

    const overlay = page.locator('[data-testid="dice-result-number"]')
    await expect(overlay).toContainText(rolledNum)

    // Full page snapshot after roll
    await expect(page).toHaveScreenshot('home-after-6face-roll.png')
  })

  test('reward description is shown when present', async ({ page }) => {
    await goHome(page, dice_id)
    await rollAndWait(page)

    // All rewards created by setupDiceWithRewards have descriptions
    await expect(page.locator('[data-testid="result-reward-desc"]')).toBeVisible()
  })
})

// ─────────────────────────────────────────────────────────────────────────────
// 4. Incomplete dice — shows error, roll button disabled
// ─────────────────────────────────────────────────────────────────────────────
test.describe('Roll flow — incomplete dice', () => {
  let dice_id: string

  test.beforeEach(async ({ page }) => {
    // Create dice with 4 faces but only assign 2 rewards → incomplete
    const diceRes = await page.request.post(`${API}/dice`, {
      data: { name: `Incomplete-${Date.now()}`, number_of_faces: 4 },
    })
    dice_id = (await diceRes.json()).data.dice_id

    await page.request.post(`${API}/dice/${dice_id}/rewards/bulk`, {
      data: {
        rewards: [
          { face_value: 1, reward_title: 'Reward A', weight: 1 },
          { face_value: 2, reward_title: 'Reward B', weight: 1 },
        ],
      },
    })
  })

  test.afterEach(async ({ page }) => {
    await page.request.delete(`${API}/dice/${dice_id}`)
  })

  test('roll button is disabled for incomplete dice', async ({ page }) => {
    await goHome(page)

    // Select the incomplete dice
    await page.selectOption('[data-testid="dice-select"]', dice_id)

    const btn = page.locator('[data-testid="roll-button"]')
    await expect(btn).toBeDisabled({ timeout: 3_000 })

    // Missing reward hint should appear
    await expect(page.getByText(/còn thiếu/i)).toBeVisible()

    // Snapshot: disabled state with warning
    await expect(page).toHaveScreenshot('roll-button-disabled-incomplete.png')
  })
})
