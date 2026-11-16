import { expect } from '@playwright/test'
import { test, watchProblems, waitForScene, startGame, onScene } from './helpers.js'

// the first turn notice shows the aiming instructions for 5 s, the default wait of expect.poll
const turnNotice = { timeout: 10_000 }

for (const round of [1, 2, 3])
  test(`scene ustanak round ${round} has its own burning scenery after victory`, async({ page }, testInfo) => {
    const problems = watchProblems(page)
    await page.goto('/#ustanak')
    await waitForScene(page)
    await onScene(page, scene => scene.battlefield.loaded())
    await page.getByRole('button', { name: '2 players', exact: true }).click()
    await expect.poll(() => onScene(page, scene => !scene.announcingTurn), turnNotice).toBe(true)
    await onScene(page, (scene, round) => {
      scene.round = round
      scene.setRoundScenery()
    }, round)
    expect(await onScene(page, scene => scene.children.includes(scene.bunker))).toBe(round === 1)
    expect(await onScene(page, scene => scene.top.targets.includes(scene.bunker))).toBe(false)
    await page.screenshot({ path: testInfo.outputPath(`scenery-${round}.png`) })
    const effect = () => onScene(page, (scene, round) => {
      if (round === 1) return JSON.stringify(scene.bunker.flame.sparks)
      if (round === 3) return scene.battlefield.city.efekti.toDataURL()
      return scene.battlefield.villageFire.canvas.toDataURL()
    }, round)
    if (round === 2) {
      await page.keyboard.down('Escape')
      await expect(page.getByText('Game paused', { exact: true })).toBeVisible()
      await page.keyboard.up('Escape')
      const paused = await effect()
      await page.waitForTimeout(250)
      expect(await effect(), 'smoke and fire wait during pause').toBe(paused)
      await page.getByRole('button', { name: /Continue/ }).click()
      await expect.poll(effect).not.toBe(paused)
    }
    await onScene(page, scene => scene.victory('Scenery animation check'))
    const before = await effect()
    await expect.poll(effect, { message: 'the scenery keeps burning after victory' }).not.toBe(before)
    expect(problems).toEqual([])
  })

for (const mode of [
  { button: 'Player vs computer', first: 'Your turn', next: 'Computer\'s turn' },
  { button: '2 players', first: 'Player 1\'s turn', next: 'Player 2\'s turn' },
])
  test(`scene ustanak announces turns in ${mode.button}`, async({ page }) => {
    const problems = watchProblems(page)
    await page.goto('/#ustanak')
    await waitForScene(page)
    await expect(page.getByRole('button', { name: 'Player vs computer', exact: true })).toBeVisible()
    await expect(page.getByRole('button', { name: '2 players', exact: true })).toBeVisible()
    await page.getByRole('button', { name: mode.button, exact: true }).click()
    await expect(page.locator('#platno')).toBeFocused()
    await expect(page.getByRole('heading', { name: mode.first, exact: true })).toBeVisible()
    expect(await onScene(page, scene => scene.canShoot(0))).toBe(false)
    await expect.poll(() => onScene(page, scene => scene.canShoot(0)), turnNotice).toBe(true)
    await page.keyboard.down('Space')
    await expect.poll(() => onScene(page, scene => scene.top.sila)).toBeGreaterThan(300)
    await page.keyboard.up('Space')
    await expect.poll(() => onScene(page, scene => scene.turns.phase)).toBe('flight')
    await onScene(page, scene => {
      // Put this shot beyond the edge to exercise the normal miss and turn handover.
      scene.top.projektili[0].setPosition(-100, scene.top.y)
    })
    await expect(page.getByRole('heading', { name: mode.next, exact: true })).toBeVisible()
    expect(await onScene(page, scene => scene.canShoot(1))).toBe(false)
    expect(problems).toEqual([])
  })

test('scene ustanak plays three distinct battlefields, restores rounds after pause and names the 2P winner', async({ page }, testInfo) => {
  const problems = watchProblems(page)
  await page.goto('/#ustanak')
  await waitForScene(page)
  await page.getByRole('button', { name: '2 players', exact: true }).click()
  const backgrounds = []
  const firingLines = []
  for (let round = 1; round <= 3; round++) {
    await expect.poll(() => onScene(page, scene => !scene.announcingTurn), turnNotice).toBe(true)
    await onScene(page, scene => scene.battlefield.loaded())
    backgrounds.push(await onScene(page, scene => Array.from(scene.canvas.getContext('2d')
      .getImageData(10, scene.canvas.height * .9, 1, 1).data).join(',')))
    firingLines.push(await onScene(page, scene => [scene.top.y, scene.opponent.y, scene.top.projektili[0].groundLevel]))
    await page.screenshot({ path: testInfo.outputPath(`round-${round}.png`) })
    await onScene(page, (scene, round) => {
      if (round === 1) scene.top.alive = false
      else scene.opponent.alive = false
    }, round)
    if (round === 3) break
    await expect(page.getByRole('button', { name: 'Next round', exact: true })).toBeVisible()
    expect(await onScene(page, scene => scene.session.state)).toBe('running')
    await page.keyboard.down('Escape')
    await expect(page.getByText('Game paused', { exact: true })).toBeVisible()
    await page.keyboard.up('Escape')
    await page.getByRole('button', { name: /Continue/ }).click()
    await page.getByRole('button', { name: 'Next round', exact: true }).click()
    await expect(page.locator('#platno')).toBeFocused()
    expect(await onScene(page, scene => scene.turns.active)).toBe(round % 2)
    expect(await onScene(page, scene => [scene.top.energija, scene.opponent.energija])).toEqual([100, 100])
  }
  await expect(page.getByText('Player 1 wins the match! 2 : 1', { exact: true })).toBeVisible()
  expect(new Set(backgrounds).size, 'each round has its own environment').toBe(3)
  expect(firingLines[1]).toEqual(firingLines[0])
  expect(firingLines[2]).toEqual(firingLines[0])
  const fire = await onScene(page, scene => scene.battlefield.city.efekti.toDataURL())
  await expect.poll(() => onScene(page, scene => scene.battlefield.city.efekti.toDataURL()),
    { message: 'city fire and smoke keep animating after the match' }).not.toBe(fire)
  await expect(page.getByRole('button', { name: 'Next round', exact: true })).toHaveCount(0)
  expect(await onScene(page, scene => scene.session.state)).toBe('finished')
  expect(problems).toEqual([])
})

test('scene ustanak computer ranges its opening shot instead of immediately hitting', async({ page }) => {
  const problems = watchProblems(page)
  await page.addInitScript(() => {
    Math.random = () => .5
  })
  await page.goto('/#ustanak')
  await waitForScene(page)
  await startGame(page)
  await expect.poll(() => onScene(page, scene => scene.canShoot(0)), turnNotice).toBe(true)
  expect(await onScene(page, scene => {
    const fired = scene.top.launch()
    scene.top.projektili[0].setPosition(-100, scene.top.y)
    return fired
  })).toBe(true)
  await expect.poll(() => onScene(page, scene => scene.opponent.hasActiveShot), { timeout: 10_000 }).toBe(true)
  await expect.poll(() => onScene(page, scene => scene.turns.active), { timeout: 15_000 }).toBe(0)
  expect(await onScene(page, scene => scene.top.energija)).toBe(100)
  expect(problems).toEqual([])
})
