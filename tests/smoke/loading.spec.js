import { expect } from '@playwright/test'
import { test, watchProblems, waitForScene, onScene } from './helpers.js'

for (const { scene, file } of [
  { scene: 'ustanak', file: 'background/planine.png' },
  { scene: 'ustanak', file: 'armies/talijani/vojnici/strelci/zastava.svg' },
  { scene: 'tenkici', file: 'background/razrusen-grad-ww2-pixel.png' },
])
  test(`scene ${scene} draws ${file} before showing the mode choice`, async({ page }) => {
    const problems = watchProblems(page)
    let releaseImage, imageRequested
    const held = new Promise(resolve => {
      releaseImage = resolve
    })
    const requested = new Promise(resolve => {
      imageRequested = resolve
    })
    await page.addInitScript(() => {
      window.sceneDrawnImages = []
      const { drawImage } = CanvasRenderingContext2D.prototype
      CanvasRenderingContext2D.prototype.drawImage = function(...args) {
        if (args[0]?.src) window.sceneDrawnImages.push(args[0].src)
        return drawImage.apply(this, args)
      }
    })
    await page.route(`**/assets/images/${file}`, async route => {
      const response = await route.fetch()
      imageRequested()
      await held
      await route.fulfill({ response })
    })
    try {
      await page.goto(`/#${scene}`, { waitUntil: 'domcontentloaded' })
      await page.locator('.arcade-dialog-insert').click()
      await requested
      await page.waitForTimeout(200)
      await expect(page.locator('#jedan-igrac')).toHaveCount(0)
      releaseImage()
      await waitForScene(page)
      await expect(page.locator('#jedan-igrac')).toBeVisible()
      expect(await page.evaluate(file => window.sceneDrawnImages.some(src => src.endsWith(file)), file),
        'the image has already been drawn behind the menu').toBe(true)
      expect(await onScene(page, scene => scene.session.state)).toBe('ready')
      expect(await onScene(page, scene => scene.gameLoop.isRunning)).toBe(false)
      expect(problems).toEqual([])
    } finally {
      releaseImage()
    }
  })
