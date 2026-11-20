import { test, expect } from '@playwright/test'
import { coinStorageKey as storageKey } from '../../ui/DailyCoins.js'
import { developmentCoinStorageKey } from '../../ui/DevelopmentCoins.js'

// Run daily-limit cases on a non-local origin while serving every byte from the local test server.
const productionOrigin = 'https://coins.test'
test.beforeEach(async({ context, baseURL }) => {
  await context.route(`${productionOrigin}/**`, async route => {
    const url = new URL(route.request().url())
    const response = await route.fetch({ url: new URL(url.pathname + url.search, baseURL).href })
    await route.fulfill({ response })
  })
})

const balance = (page, key = storageKey) => page.evaluate(key => JSON.parse(localStorage.getItem(key))?.remaining ?? 10, key)
const loaded = page => page.waitForFunction(() => document.body.dataset.loadedGame === 'bunker')
/** The Start button of Bunker, which takes the token. */
const start = page => page.locator('#modal #start')

async function seedBalance(page, remaining) {
  await page.addInitScript(({ key, remaining }) => {
    const now = new Date()
    const day = [now.getFullYear(), now.getMonth() + 1, now.getDate()]
      .map((n, i) => i ? String(n).padStart(2, '0') : n).join('-')
    localStorage.setItem(key, JSON.stringify({ day, remaining }))
  }, { key: storageKey, remaining })
}

test('the card opens the game for free, Start spends one token and Play again spends another', async({ page }) => {
  await page.goto(`${productionOrigin}/`)
  await expect(page.locator('.arcade-balance')).toHaveText('10')
  await page.locator('.menu-item[data-path="bunker"] .arcade-slot').click()
  await loaded(page)
  expect(await balance(page)).toBe(10)
  await expect(page.locator('.arcade-wallet'), 'the pocket shows while a screen asks for a token').toBeVisible()
  await start(page).click()
  await expect.poll(() => balance(page)).toBe(9)
  await page.evaluate(async() => {
    const { default: SceneManager } = await import('/scenes/SceneManager.js')
    SceneManager.instance.scene.defeat('Finished')
  })
  await page.locator('#igraj-opet').click()
  await expect.poll(() => balance(page)).toBe(8)
  await expect(start(page), 'Play again starts without the start screen').toHaveCount(0)
})

test('a direct game URL opens the game and takes the token only at Start', async({ page }) => {
  await page.goto(`${productionOrigin}/#bunker`)
  await loaded(page)
  expect(await balance(page)).toBe(10)
  await start(page).click()
  await expect.poll(() => balance(page)).toBe(9)
})

test('with no tokens left the Start button is disabled', async({ page }) => {
  await seedBalance(page, 0)
  await page.goto(`${productionOrigin}/#bunker`)
  await loaded(page)
  await expect(start(page)).toBeDisabled()
  await expect(page.locator('.arcade-balance')).toHaveText('0')
  expect(await balance(page)).toBe(0)
})

test('a failed scene import costs nothing', async({ page }) => {
  await page.route('**/scenes/bunker/Main.js', route => route.abort())
  await page.goto(`${productionOrigin}/#bunker`)
  await expect(page.locator('#modal')).toContainText('could not be loaded')
  expect(await balance(page)).toBe(10)
})

test('two tabs cannot both spend the final token', async({ page, context }) => {
  await seedBalance(page, 1)
  await page.goto(`${productionOrigin}/#bunker`)
  const other = await context.newPage()
  await other.goto(`${productionOrigin}/#bunker`)
  await Promise.all([loaded(page), loaded(other)])
  await Promise.all([start(page).click(), start(other).click()])
  await expect.poll(async() => {
    const running = await Promise.all([page, other].map(tab => tab.evaluate(async() => {
      const { default: SceneManager } = await import('/scenes/SceneManager.js')
      return SceneManager.instance.scene.session.state === 'running'
    })))
    return running.filter(Boolean).length
  }).toBe(1)
  expect(await balance(page)).toBe(0)
})

test('the cabinet and token counter fit a narrow screen', async({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 })
  await page.goto(`${productionOrigin}/`)
  await expect(page.locator('.arcade-wallet')).toBeVisible()
  await expect(page.locator('.menu-item[data-path="bunker"] .arcade-slot')).toBeVisible()
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true)
})

test('local development spends from 1000 tokens and preserves its balance on reload', async({ page }) => {
  await seedBalance(page, 0)
  await page.goto('/')
  await expect(page.locator('.arcade-balance')).toHaveText('1000')
  await expect(page.locator('.arcade-wallet')).toContainText('LOCAL DEVELOPMENT')
  await page.locator('.menu-item[data-path="bunker"] .arcade-slot').click()
  await loaded(page)
  await start(page).click()
  await expect(page.locator('.arcade-balance')).toHaveText('999')
  expect(await balance(page)).toBe(0)
  expect(await balance(page, developmentCoinStorageKey)).toBe(999)
  await page.reload()
  await expect(page.locator('.arcade-balance')).toHaveText('999')
})
