import { expect } from '@playwright/test'
import { test, watchProblems, waitForScene, startGame, errorScreen } from './helpers.js'

/** Holds a finger on the element; the touch controls react to pointerdown and pointerup. */
async function hold(page, cdp, locator, ms = 500) {
  const box = await locator.boundingBox()
  const touchPoints = [{ x: box.x + box.width / 2, y: box.y + box.height / 2 }]
  await cdp.send('Input.dispatchTouchEvent', { type: 'touchStart', touchPoints })
  await page.waitForTimeout(ms)
  await cdp.send('Input.dispatchTouchEvent', { type: 'touchEnd', touchPoints: [] })
}

test('warplane starts with a tap and every touch control works without errors', async({ page, context }) => {
  const problems = watchProblems(page)
  const cdp = await context.newCDPSession(page)

  await page.goto('/#warplane')
  await waitForScene(page)
  await page.locator('.game-screen-select input').first().tap()
  await expect(page.locator('.joystick-btn')).toHaveCount(4)
  await expect(page.locator('.game-btn')).toHaveCount(1)

  for (const button of await page.locator('.joystick-btn, .game-btn').all())
    await hold(page, cdp, button)

  await expect(errorScreen(page)).toHaveCount(0)
  expect(problems).toEqual([])
})

test('moon-landing burns fuel while a touch control is held', async({ page, context }) => {
  const problems = watchProblems(page)
  const cdp = await context.newCDPSession(page)
  const fuel = async() => Number((await page.locator('#ui').innerText()).match(/Fuel left:\s*(\d+)/i)[1])

  await page.goto('/#moon-landing')
  await waitForScene(page)
  await startGame(page)
  await expect(page.locator('#ui')).toContainText(/Fuel left/i)
  const before = await fuel()
  await hold(page, cdp, page.locator('.joystick-btn').nth(1), 700)

  expect(await fuel()).toBeLessThan(before)
  await expect(errorScreen(page)).toHaveCount(0)
  expect(problems).toEqual([])
})

test('cannon turns with the arrows and fires a charged shot with a long press', async({ page, context }) => {
  const problems = watchProblems(page)
  const cdp = await context.newCDPSession(page)
  const shots = async() => Number((await page.locator('#ui').innerText()).match(/Shots left:\s*(\d+)/i)[1])
  const power = page.locator('input[type=range]')

  await page.goto('/#cannon')
  await waitForScene(page)
  await startGame(page)
  await expect(page.locator('#ui')).toContainText(/Shots left/i)
  const before = await shots()

  await hold(page, cdp, page.locator('.joystick-btn').nth(2))
  expect(await shots()).toBe(before)

  const { width, height } = page.viewportSize()
  const touchPoints = [{ x: width / 2, y: height / 3 }] // the open sky, away from every control
  await cdp.send('Input.dispatchTouchEvent', { type: 'touchStart', touchPoints })
  await page.waitForTimeout(1000)
  expect(Number(await power.inputValue())).toBeGreaterThan(Number(await power.getAttribute('min')))
  await cdp.send('Input.dispatchTouchEvent', { type: 'touchEnd', touchPoints: [] })

  await expect.poll(shots).toBe(before - 1)
  await expect(errorScreen(page)).toHaveCount(0)
  expect(problems).toEqual([])
})
