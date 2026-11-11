import { readFileSync, writeFileSync, mkdirSync } from 'node:fs'
import { expect } from '@playwright/test'
import { test, scenes, waitForScene, startGame } from './helpers.js'

// Recorded from every game before the styles moved to one place; RECORD_STYLES=<folder> writes one file per game instead.
const recorded = JSON.parse(readFileSync('tests/smoke/fixtures/styles.json', 'utf8'))
const recordFolder = process.env.RECORD_STYLES

/** The start screen HTML and the classes of the health bar and camera button, as the player sees them. */
const readStyles = page => page.evaluate(() => {
  const classesOf = selector => document.querySelector(selector)?.className.replace(/\s+/g, ' ').trim() ?? null
  return {
    healthBar: classesOf('progress.top-right'),
    cameraButton: classesOf('button.bottom-right'),
  }
})

for (const scene of scenes)
  test(`scene ${scene} keeps its start screen, health bar and camera button`, async({ page }) => {
    await page.goto(`/#${scene}`)
    await waitForScene(page)
    const startScreen = await page.evaluate(() => {
      const screen = document.getElementById('modal').cloneNode(true)
      screen.querySelectorAll('.report').forEach(report => report.remove()) // its text is still being typed
      return screen.innerHTML.replace(/\s+/g, ' ').trim()
    })
    await startGame(page)
    // players with models appear a moment after the start
    await page.waitForTimeout(1500)
    const actual = { startScreen, ...await readStyles(page) }

    if (recordFolder) {
      mkdirSync(recordFolder, { recursive: true })
      writeFileSync(`${recordFolder}/${scene}.json`, JSON.stringify(actual))
      return
    }
    expect(actual).toEqual(recorded[scene])
  })

for (const scene of ['rpg-fantasy', 'zeppelin'])
  test(`scene ${scene} has a camera button that moves the camera`, async({ page }) => {
    await page.goto(`/#${scene}`)
    await waitForScene(page)
    await startGame(page)
    await page.waitForTimeout(1500)
    const cameraOffset = () => page.evaluate(() => {
      const { player, predmeti } = window.sceneManager.instance.scene
      const { chaseCamera } = player ?? predmeti.find(object => object.chaseCamera)
      return chaseCamera.offset.join()
    })
    const before = await cameraOffset()

    await page.locator('button.bottom-right').dispatchEvent('pointerdown')

    expect(await cameraOffset()).not.toBe(before)
  })
