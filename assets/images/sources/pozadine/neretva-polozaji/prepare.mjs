// Usage: node assets/images/sources/pozadine/neretva-polozaji/prepare.mjs [local server URL]
import assert from 'node:assert/strict'
import { createHash } from 'node:crypto'
import { readFile, writeFile } from 'node:fs/promises'
import { chromium } from '@playwright/test'

const local = process.argv[2] || 'http://localhost:8080'
const source = name => new URL(name, import.meta.url)
const { backgrounds } = JSON.parse(await readFile(source('generation.json'), 'utf8'))
for (const art of backgrounds) {
  const bytes = await readFile(source(art.image))
  assert.equal(createHash('sha256').update(bytes).digest('hex'), art.sha256)
  assert.deepEqual([bytes.readUInt32BE(16), bytes.readUInt32BE(20)], art.dimensions)
}

const browser = await chromium.launch()
try {
  for (const [width, height] of [[1280, 720], [1024, 768]]) {
    const page = await browser.newPage({ viewport: { width, height } })
    // Writing a captured frame must not reload a live-server page during the second position.
    await page.routeWebSocket('**', () => {})
    const errors = []
    page.on('pageerror', error => errors.push(error.message))
    page.on('response', response => { if (response.status() >= 400) errors.push(response.url()) })
    await page.goto(local + '/#neretva')
    await page.locator('#start').click()
    await page.evaluate(async() => {
      const { default: Manager } = await import('/scenes/SceneManager.js')
      window.battle = Manager.instance.scene
    })
    for (const { faction } of backgrounds) {
      const capture = await page.evaluate(faction => {
        const scene = window.battle
        // Advance the real scene and fire through its normal input handler until the formation is visible.
        for (let step = 0; step < 2400; step++) {
          if (scene.sveSvabe[0].view.faction === faction
            && scene.sveSvabe.filter(({ body }) => body.standing && body.stateTime > .3).length >= 2) break
          for (const { body, cover } of scene.sveSvabe)
            if (body.state === 'attack') scene.handleClick({ target: scene.canvas, pageX: cover.x, pageY: cover.y })
          scene.update(.05, step * .05)
        }
        if (scene.sveSvabe[0].view.faction !== faction || scene.energija <= 0) throw Error('Formation did not reach ' + faction)
        scene.clear()
        scene.render()
        return scene.canvas.toDataURL('image/webp', .94).split(',')[1]
      }, faction)
      await writeFile(source(faction + '-' + width + 'x' + height + '.webp'), Buffer.from(capture, 'base64'))
    }
    const result = await page.evaluate(() => {
      const scene = window.battle
      for (let i = 0; i < 2400 && !scene.ui.outro; i++) {
        for (const { body, cover } of scene.sveSvabe)
          if (body.standing) scene.handleClick({ target: scene.canvas, pageX: cover.x, pageY: cover.y })
        scene.update(.05, i * .05)
      }
      return { health: scene.energija, hits: scene.pogoci, remaining: scene.preostaloVreme, finished: Boolean(scene.ui.outro) }
    })
    assert.ok(result.finished && result.health > 0 && result.hits > 0 && result.remaining <= 0, JSON.stringify(result))
    assert.deepEqual(errors, [])
    console.log(width, height, result)
    await page.close()
  }
} finally {
  await browser.close()
}
