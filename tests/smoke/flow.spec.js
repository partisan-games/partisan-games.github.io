import { expect as baseExpect } from '@playwright/test'
import { test, scenes, watchProblems, waitForScene, startGame, errorScreen, onScene } from './helpers.js'

// with several heavy 3D games rendering in software at once, one frame can take seconds
const expect = baseExpect.configure({ timeout: 30_000 })

const gameTime = page => onScene(page, scene => scene.gameLoop.time)

/** Lets the game run for a moment without input: random play could end the game before the next step. */
async function letGameRun(page) {
  const start = await gameTime(page)
  await expect.poll(() => gameTime(page), { message: 'the game runs' }).toBeGreaterThan(start + 500)
}

/** Counts distinct colors in the 3D frame; a blank or failed render has one or two. */
const countFrameColors = page => onScene(page, scene => {
  scene.render()
  const gl = scene.renderer.getContext()
  const { drawingBufferWidth: width, drawingBufferHeight: height } = gl
  const pixels = new Uint8Array(width * height * 4)
  gl.readPixels(0, 0, width, height, gl.RGBA, gl.UNSIGNED_BYTE, pixels)
  const colors = new Set()
  for (let i = 0; i < pixels.length; i += 4 * 97) colors.add(pixels[i] << 16 | pixels[i + 1] << 8 | pixels[i + 2])
  return colors.size
})

const modal = page => page.locator('#modal')

/** The game reads held keys once per frame, and software rendering can make a frame slow; hold Escape until the pause shows. */
async function pauseWithEscape(page) {
  // in a real browser Escape also releases a locked mouse, which pauses first-person games; headless Escape does not
  await page.evaluate(() => document.exitPointerLock())
  await page.keyboard.down('Escape')
  await expect(modal(page)).toContainText('Game paused')
  await page.keyboard.up('Escape')
}

// the menu background scene has no game flow of its own
for (const scene of scenes.filter(name => name !== 'lookat-cursor'))
  test(`scene ${scene}: pause, game over, play again and main menu work`, async({ page }) => {
    const problems = watchProblems(page)

    await page.goto(`/#${scene}`)
    await waitForScene(page)
    await startGame(page)
    await letGameRun(page)

    if (await onScene(page, scene => Boolean(scene.renderer.isWebGLRenderer)))
      expect(await countFrameColors(page), 'the 3D scene draws a picture').toBeGreaterThan(3)

    await pauseWithEscape(page)
    const pausedAt = await gameTime(page)
    await page.waitForTimeout(300)
    expect(await gameTime(page), 'game time stands still while paused').toBe(pausedAt)

    await page.locator('#continue').click()
    await expect(modal(page)).not.toContainText('Game paused')
    await expect.poll(() => gameTime(page), { message: 'game time runs again' }).toBeGreaterThan(pausedAt)

    await onScene(page, scene => scene.defeat('Ended by the smoke test.'))
    await expect(modal(page)).toContainText('Ended by the smoke test.')

    await page.locator('#igraj-opet').click()
    // play again either resets the game or reloads the page; both clear the end screen
    await expect(modal(page)).not.toContainText('Ended by the smoke test.')
    await waitForScene(page)
    await startGame(page)
    await letGameRun(page)
    await expect(modal(page)).not.toContainText('Ended by the smoke test.')

    await pauseWithEscape(page)
    await page.locator('#menu').click()
    await expect(page.locator('.js-start').first()).toBeVisible()

    await expect(errorScreen(page)).toHaveCount(0)
    expect(problems).toEqual([])
  })
