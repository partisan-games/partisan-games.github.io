import { expect } from '@playwright/test'
import { test, watchProblems, waitForScene, errorScreen, countFullScreenButtons } from './helpers.js'

test('the menu loads with its background scene', async({ page }) => {
  const problems = watchProblems(page)
  await page.goto('/')
  await expect(page.locator('.js-start').first()).toBeVisible()
  await page.waitForTimeout(3000)
  expect(problems).toEqual([])
})

test('switching games through the address leaves nothing of the previous game behind', async({ page }) => {
  const problems = watchProblems(page)
  for (const scene of ['dark-city', 'bunker', 'fps-base', 'avatar', 'cannon', 'moon-landing']) {
    await page.goto(`/#${scene}`)
    await waitForScene(page)
  }

  expect(await countFullScreenButtons(page)).toBeLessThanOrEqual(1)
  await expect(page.locator('progress.top-right')).toHaveCount(0) // the cannon power meter
  expect(problems).toEqual([])
})

test('back and forward show the matching game', async({ page }) => {
  await page.goto('/#bunker')
  await waitForScene(page)
  await page.evaluate(() => {
    location.hash = 'vis'
  })
  await waitForScene(page)
  await page.goBack()
  await waitForScene(page)
  await expect(page.locator('#modal')).toContainText('Žikica')
  await page.goForward()
  await waitForScene(page)
  await expect(page.locator('#modal')).toContainText('Vis')
})

test('an unknown game shows an error with a way back to the menu', async({ page }) => {
  await page.goto('/#ne-postoji')
  await expect(errorScreen(page)).toContainText('could not be loaded')
  await page.locator('#menu').click()
  await expect(page.locator('.js-start').first()).toBeVisible()
})

test('an error during play stops the game and shows a message', async({ page }) => {
  await page.goto('/#bunker')
  await waitForScene(page)
  await page.evaluate(() => setTimeout(() => {
    throw new Error('test error')
  }))
  await expect(errorScreen(page)).toContainText('stopped because of an error')
})
