import { expect } from '@playwright/test'
import { test, waitForScene } from './helpers.js'

for (const facing of [-1, 1]) test(`Bunker keeps visible ground blood after death facing ${facing}`, async({ page }, testInfo) => {
  await page.goto('/#bunker')
  await waitForScene(page)
  await page.evaluate(async direction => {
    const { scene } = window.sceneManager.instance
    Object.assign(scene.player, scene.projection.toWorld({ x: 320, y: 240 }))
    scene.player.facing = direction
    await scene.play()
    scene.player.takeHit(1)
  }, facing)
  await page.waitForFunction(() => window.sceneManager.instance.scene.playerView.clipTime === .6)

  const measure = () => page.evaluate(() => {
    const { scene } = window.sceneManager.instance
    const { stain } = scene.playerView.blood
    const { width, height } = scene.canvas
    const ctx = scene.canvas.getContext('2d')
    scene.clear()
    scene.render()
    const withBlood = ctx.getImageData(0, 0, width, height).data.slice()
    stain.hide()
    scene.clear()
    scene.render()
    const withoutBlood = ctx.getImageData(0, 0, width, height).data
    stain.show()
    scene.clear()
    scene.render()
    let visiblePixels = 0
    for (let i = 0; i < withBlood.length; i += 4) {
      const contrast = Math.abs(withBlood[i] - withoutBlood[i]) + Math.abs(withBlood[i + 1] - withoutBlood[i + 1])
        + Math.abs(withBlood[i + 2] - withoutBlood[i + 2])
      if (contrast > 20) visiblePixels++
    }
    return { visiblePixels, state: scene.session.state,
      pool: { x: stain.x, y: stain.y, width: stain.width, height: stain.height, scaleX: stain.scaleX, scaleY: stain.scaleY } }
  })

  const settled = await measure()
  expect(settled.state).toBe('finished')
  // The old pool left only about 30 pixels: a thin edge rather than a readable stain.
  expect(settled.visiblePixels).toBeGreaterThan(100)
  await page.evaluate(() => {
    const { scene } = window.sceneManager.instance
    scene.loop(30, scene.gameLoop.time / 1000)
  })
  const later = await measure()
  expect(later.state).toBe('finished')
  expect(later.pool).toEqual(settled.pool)
  // The animated concrete background can change the contrast of a few edge pixels.
  expect(later.visiblePixels).toBeGreaterThan(100)
  await page.screenshot({ path: testInfo.outputPath(`blood-facing-${facing}.png`), clip: { x: 230, y: 190, width: 180, height: 130 } })
})
