import { expect } from '@playwright/test'
import { test, waitForScene } from './helpers.js'

test.beforeEach(async({ page }) => {
  // Observe what the real page draws, without replacing its bodies, clocks or controls.
  await page.addInitScript(() => {
    window.artDraws = []
    const original = CanvasRenderingContext2D.prototype.drawImage
    CanvasRenderingContext2D.prototype.drawImage = function(image, ...args) {
      if (this.canvas.id === 'platno' && image.src) {
        window.artDraws.push({ src: image.src, source: args.slice(0, 4), at: performance.now() })
        if (window.artDraws.length > 1000) window.artDraws.splice(0, 500)
      }
      return original.call(this, image, ...args)
    }
  })
})

const drawn = (page, src, x = null, y = null) => page.waitForFunction(({ src, x, y }) =>
  window.artDraws.some(draw => draw.at > performance.now() - 150 && draw.src.endsWith(src)
    && (x === null || draw.source[0] === x) && (y === null || draw.source[1] === y)), { src, x, y }, { timeout: 5000 })

async function state(page, name) {
  await page.evaluate(() => {
    window.artDraws.length = 0
  })
  await page.locator(`[data-state="${name}"]`).click()
}

for (const way of ['1', '-1']) test(`new field gun and wreck: facing ${way}`, async({ page }, info) => {
  const errors = []
  page.on('pageerror', error => errors.push(error.message))
  await page.goto('/storybook.html#artiljerija/ustanak-top')
  await page.locator(`[data-way="${way}"]`).click()
  await drawn(page, '/field-gun-barrel-pixel.png')
  await drawn(page, '/field-gun-carriage-pixel.png')
  await state(page, 'dead')
  await drawn(page, '/wrecks/field-gun.png', 0, 0)
  const carriageStillDrawn = await page.evaluate(() => window.artDraws.some(draw =>
    draw.at > performance.now() - 100 && draw.src.endsWith('/field-gun-carriage-pixel.png')))
  // Allow the previous animation frame to leave the observation window.
  if (carriageStillDrawn) await page.waitForTimeout(160)
  expect(await page.evaluate(() => window.artDraws.some(draw =>
    draw.at > performance.now() - 100 && draw.src.endsWith('/field-gun-carriage-pixel.png')))).toBe(false)
  await page.locator('#platno').screenshot({ path: info.outputPath('gun-wreck.png') })
  expect(errors).toEqual([])
})

for (const [name, file] of [['partizanska', 'partizanska'], ['italijanska', 'italijanska']])
  test(`gun crew terminal fall: ${name}`, async({ page }, info) => {
    await page.goto(`/storybook.html#vojnici/posada-topa/${name}`)
    await state(page, 'load')
    await state(page, 'dead')
    await drawn(page, `/${file}-posada-death-sprites.png`, 800, 0)
    await page.waitForTimeout(200)
    await drawn(page, `/${file}-posada-death-sprites.png`, 800, 0)
    await page.locator('#platno').screenshot({ path: info.outputPath('crew-fallen.png') })
  })

test('partisan walk and both falls use the prepared atlas through actual state controls', async({ page }, info) => {
  await page.goto('/storybook.html#vojnici/partizanski-strelac')
  await state(page, 'walk')
  await drawn(page, '/partizanski-strelac-movement-sprites.png', null, 160)
  await state(page, 'dead')
  await drawn(page, '/partizanski-strelac-movement-sprites.png', 800, 480)
  await page.locator('#platno').screenshot({ path: info.outputPath('standing-fall.png') })
  await page.locator('[data-again]').click()
  await state(page, 'dead')
  await drawn(page, '/partizanski-strelac-movement-sprites.png', 800, 320)
})

test('German rifle reload is wired to its model and existing shot cooldown', async({ page }) => {
  await page.goto('/storybook.html#vojnici/strelac')
  await state(page, 'reload')
  // Reload returns to idle; unlike death, its last frame is transient and may be skipped by a long render step.
  await drawn(page, '/nemacki-strelac-reload-sprites.png')
  await state(page, 'fire')
  await drawn(page, '/nemacki-strelac-reload-sprites.png')
  await state(page, 'dead')
  await drawn(page, '/nemacki-strelac-sprites.png', 384, 256)
})

test('Hummel actual fire control uses the new attack, a shell, then the existing wreck', async({ page }, info) => {
  await page.goto('/storybook.html#vozila/hummel')
  await state(page, 'fire')
  await drawn(page, '/hummel-fire-sprites.png')
  await page.locator('#platno').screenshot({ path: info.outputPath('hummel-fire.png') })
  await drawn(page, '/granata.gif')
  await drawn(page, '/hummel-sprites.png')
  await state(page, 'dead')
  await drawn(page, '/wrecks/hummel.png')
})

test('Ustanak level uses the redrawn gun and falls its crew when that gun is destroyed', async({ page }, info) => {
  await page.goto('/#ustanak')
  await waitForScene(page)
  await page.locator('#dva-igraca').click()
  await page.waitForFunction(() => window.sceneManager.instance.scene.session.state === 'running')
  await drawn(page, '/field-gun-barrel-pixel.png')
  await page.evaluate(() => window.sceneManager.instance.scene.guns[1].takeHit(1000))
  await drawn(page, '/wrecks/field-gun.png')
  await drawn(page, '/italijanska-posada-death-sprites.png', 800, 0)
  expect(await page.evaluate(() => window.sceneManager.instance.scene.crews[1].state)).toBe('dead')
  await page.locator('#platno').screenshot({ path: info.outputPath('ustanak-integrated.png') })
})

test('Kluz level uses the same Hummel attack without enlisting it as an anti-aircraft gun', async({ page }, info) => {
  const errors = []
  page.on('pageerror', error => errors.push(error.message))
  await page.goto('/#franjo-kluz')
  await waitForScene(page)
  await page.locator('#start').click()
  await page.waitForFunction(() => window.sceneManager.instance.scene.session.state === 'running')
  const result = await page.evaluate(() => {
    const { scene } = window.sceneManager.instance
    const { body } = scene.enemies.find(enemy => enemy.body.constructor.name === 'Hummel')
    scene.player.x = body.x
    scene.player.y = Math.max(8, scene.player.y)
    scene.cameraX = scene.projection.point(body).x - scene.canvas.width / 2
    scene.followPlane(0)
    return { automatic: scene.armed.includes(body), fired: body.shoot() }
  })
  expect(result).toEqual({ automatic: false, fired: true })
  await drawn(page, '/hummel-fire-sprites.png')
  await page.locator('#platno').screenshot({ path: info.outputPath('kluz-hummel-integrated.png') })
  expect(errors).toEqual([])
})
