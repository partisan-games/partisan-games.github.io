import { test, expect } from '@playwright/test'

const storageKey = 'partisan-games.daily-tokens.v1'
const balance = page => page.evaluate(key => JSON.parse(localStorage.getItem(key))?.remaining ?? 10, storageKey)
const loaded = page => page.waitForFunction(() => document.body.dataset.loadedGame === 'bunker')

async function seedBalance(page, remaining) {
  await page.addInitScript(({ key, remaining }) => {
    const now = new Date()
    const day = [now.getFullYear(), now.getMonth() + 1, now.getDate()]
      .map((n, i) => i ? String(n).padStart(2, '0') : n).join('-')
    localStorage.setItem(key, JSON.stringify({ day, remaining }))
  }, { key: storageKey, remaining })
}

test('the coin slot spends one token and Play again spends another', async({ page }) => {
  await page.goto('/')
  await expect(page.locator('.arcade-balance')).toHaveText('10')
  await page.locator('[data-arcade-game="bunker"]').click()
  await loaded(page)
  expect(await balance(page)).toBe(9)
  await page.evaluate(async() => {
    const { default: SceneManager } = await import('/scenes/SceneManager.js')
    SceneManager.instance.scene.ui.showDefeatScreen('Finished')
  })
  await page.locator('#igraj-opet').click()
  await expect.poll(() => balance(page)).toBe(8)
  await loaded(page)
  await page.reload()
  await expect(page.locator('.arcade-dialog')).toBeVisible()
  expect(await balance(page)).toBe(8)
})

test('a direct game URL requires a coin before loading the game', async({ page }) => {
  await page.goto('/#bunker')
  await expect(page.locator('.arcade-dialog')).toBeVisible()
  await expect(page.locator('#start')).toHaveCount(0)
  expect(await balance(page)).toBe(10)
  await page.locator('.arcade-dialog-insert').click()
  await loaded(page)
  expect(await balance(page)).toBe(9)
})

test('no tokens leaves the cabinet locked and explains the daily refill', async({ page }) => {
  await seedBalance(page, 0)
  await page.goto('/')
  await page.locator('[data-arcade-game="bunker"]').click()
  await expect(page.locator('.arcade-dialog h2')).toHaveText('OUT OF COINS')
  await expect(page.locator('.arcade-dialog-message')).toContainText('midnight')
  expect(await balance(page)).toBe(0)
  await expect(page).toHaveURL(/\/$/)
})

test('a failed scene import refunds the inserted token', async({ page }) => {
  await page.route('**/scenes/bunker/Main.js', route => route.abort())
  await page.goto('/#bunker')
  await page.locator('.arcade-dialog-insert').click()
  await expect(page.locator('#modal')).toContainText('could not be loaded')
  expect(await balance(page)).toBe(10)
})

test('two tabs cannot both spend the final token', async({ page, context }) => {
  await seedBalance(page, 1)
  await page.goto('/#bunker')
  const other = await context.newPage()
  await other.goto('/#bunker')
  await Promise.all([
    page.locator('.arcade-dialog-insert').click(),
    other.locator('.arcade-dialog-insert').click(),
  ])
  await expect.poll(async() => {
    const statuses = await Promise.all([page, other].map(tab => tab.evaluate(() => ({
      loaded: document.body.dataset.loadedGame === 'bunker',
      empty: document.querySelector('.arcade-dialog h2')?.textContent === 'OUT OF COINS',
    }))))
    return statuses.filter(status => status.loaded).length === 1 && statuses.filter(status => status.empty).length === 1
  }).toBe(true)
  expect(await balance(page)).toBe(0)
})

test('the cabinet and token counter fit a narrow screen', async({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 })
  await page.goto('/')
  await expect(page.locator('.arcade-wallet')).toBeVisible()
  await expect(page.locator('[data-arcade-game="bunker"]')).toBeVisible()
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true)
})
