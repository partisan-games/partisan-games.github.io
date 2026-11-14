import { expect } from '@playwright/test'
import { test, waitForScene, watchProblems, onScene } from './helpers.js'

for (const aircraft of ['spitfire', 'hurricane', 'breguet', 'yak'])
  test(`Vis: choose ${aircraft}, play, and choose again after restarting`, async({ page }) => {
    const problems = watchProblems(page)
    await page.goto('/#vis')
    await waitForScene(page)
    await expect(page.locator('.vis-aircraft-select input')).toHaveCount(4)
    await page.locator(`[data-aircraft="${aircraft}"]`).click()
    await expect.poll(() => onScene(page, scene => scene.session.state)).toBe('running')
    expect(await onScene(page, scene => scene.player.aircraftId)).toBe(aircraft)
    expect(await onScene(page, scene => [scene.player.sirina, scene.player.visina])).toEqual([150, aircraft === 'breguet' ? 100 : 127.5])
    const imageName = { spitfire: 'spitfire-mkvb', hurricane: 'hurricane-mkiv', breguet: 'breguet-19', yak: 'yak-1b' }[aircraft]
    expect(await onScene(page, scene => scene.player.slika.src)).toContain(imageName)

    await page.keyboard.down('ArrowRight')
    await page.keyboard.down('Space')
    await expect.poll(() => onScene(page, scene => scene.player.bullets.projectiles.some(bullet => bullet.vidljiv))).toBe(true)
    await page.keyboard.up('Space')
    await page.keyboard.up('ArrowRight')
    await onScene(page, scene => scene.defeat('Aircraft selection test'))
    await page.locator('#igraj-opet').click()
    await waitForScene(page)
    const other = aircraft === 'spitfire' ? 'hurricane' : 'spitfire'
    await page.locator(`[data-aircraft="${other}"]`).click()
    await expect.poll(() => onScene(page, scene => scene.session.state)).toBe('running')
    expect(await onScene(page, scene => scene.player.aircraftId)).toBe(other)
    expect(problems).toEqual([])
  })
