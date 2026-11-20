import { expect } from '@playwright/test'
import { test, waitForScene, startGame, onScene, watchProblems } from './helpers.js'

async function openPause(page) {
  await page.keyboard.down('Escape')
  await expect(page.locator('#modal')).toContainText('Game paused')
  await page.keyboard.up('Escape')
}

test('native Tab, Enter and Volume arrows work with the game keyboard present', async({ page }) => {
  const problems = watchProblems(page)
  await page.goto('/#city-colorful')
  await waitForScene(page)
  await startGame(page)
  await openPause(page)
  await expect(page.locator('#menu')).toBeFocused()
  await page.keyboard.press('Shift+Tab')
  await expect(page.locator('#continue')).toBeFocused()
  await page.keyboard.press('Tab')
  await expect(page.locator('#menu')).toBeFocused()
  await page.keyboard.press('Tab')
  await expect(page.locator('#settings')).toBeFocused()
  await page.keyboard.press('Enter')
  const volume = page.locator('#volume')
  await expect(volume).toBeVisible()
  await volume.focus()
  const before = Number(await volume.inputValue())
  const direction = before === 0 ? 'ArrowRight' : 'ArrowLeft'
  await page.keyboard.press(direction)
  expect(Number(await volume.inputValue())).toBe(before + (before === 0 ? 5 : -5))
  await expect(volume).toBeFocused()
  await page.keyboard.press('Tab')
  await expect(page.locator('#settings-back')).toBeFocused()
  await page.keyboard.press('Space')
  await expect(page.locator('#modal')).toContainText('Game paused')
  expect(problems).toEqual([])
})

test('paused OrbitControls ignore wheel and drag on the exposed game canvas', async({ page }) => {
  const problems = watchProblems(page)
  await page.goto('/#city-colorful')
  await waitForScene(page)
  await startGame(page)
  await openPause(page)
  const camera = () => onScene(page, scene => ({
    position: scene.camera.position.toArray(),
    quaternion: scene.camera.quaternion.toArray(),
    target: scene.controls.target.toArray(),
  }))
  const before = await camera()
  await page.mouse.move(20, 20)
  await page.mouse.wheel(0, 500)
  await page.mouse.down()
  await page.mouse.move(160, 80, { steps: 4 })
  await page.mouse.up()
  expect(await camera()).toEqual(before)
  await page.locator('#continue').click()
  await expect.poll(() => onScene(page, scene => document.activeElement === scene.canvas)).toBe(true)
  expect(problems).toEqual([])
})
