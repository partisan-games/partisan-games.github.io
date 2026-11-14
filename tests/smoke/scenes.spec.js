import { expect } from '@playwright/test'
import { test, scenes, watchProblems, waitForScene, startGame, play, errorScreen, countFullScreenButtons } from './helpers.js'

for (const scene of scenes)
  test(`scene ${scene} loads and plays without errors`, async({ page }) => {
    const problems = watchProblems(page)

    await page.goto(`/#${scene}`)
    await waitForScene(page)
    await startGame(page)
    await play(page)

    await expect(errorScreen(page)).toHaveCount(0)
    expect(await countFullScreenButtons(page)).toBe(0)
    expect(problems).toEqual([])
  })
