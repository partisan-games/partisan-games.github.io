import { readdirSync, existsSync } from 'node:fs'
import { test as base } from '@playwright/test'
import { missingModelTextures } from './known-issues.js'

export const scenes = readdirSync('scenes').filter(name => existsSync(`scenes/${name}/Main.js`))

/** Every page exposes the game's SceneManager as `window.sceneManager`, so tests can wait for and drive the current scene. */
export const test = base.extend({
  page: async({ page }, use) => {
    await page.addInitScript(() => import('/scenes/SceneManager.js').then(module => {
      window.sceneManager = module.default
    }))
    await use(page)
  },
})

/** Collects every sign of a broken page: uncaught errors, console errors and failed requests. */
export function watchProblems(page) {
  const problems = []
  page.on('pageerror', error => {
    const origin = error.stack?.split('\n').find(line => line.includes('localhost'))?.trim() ?? ''
    problems.push(`pageerror: ${error.message} ${origin}`)
  })
  page.on('console', message => {
    // failed requests are reported by the response handler, with their address
    if (message.type() === 'error' && !message.text().startsWith('Failed to load resource'))
      problems.push(`console: ${message.text()}`)
    else if (/too many active webgl contexts/i.test(message.text())) problems.push(`webgl: ${message.text()}`)
  })
  page.on('response', response => {
    const { pathname } = new URL(response.url())
    if (response.status() >= 400 && !missingModelTextures.includes(decodeURIComponent(pathname)))
      problems.push(`http ${response.status()}: ${response.url()}`)
  })
  page.on('requestfailed', request => {
    const reason = request.failure()?.errorText ?? ''
    if (!reason.includes('ERR_ABORTED')) problems.push(`request failed: ${request.url()} ${reason}`)
  })
  return problems
}

/** Runs a function on the current scene in the page; the function must not use variables from the test. */
export const onScene = (page, fn, arg) => page.evaluate(([source, value]) =>
  new Function('scene', 'value', `return (${source})(scene, value)`)(window.sceneManager.instance.scene, value), [fn.toString(), arg])

/** Waits until the game in the address has loaded: it exists and the loading spinner is gone. */
export async function waitForScene(page) {
  await page.waitForFunction(() =>
    document.querySelector('.arcade-dialog[open] .arcade-dialog-insert:not([hidden])') ||
    document.body.dataset.loadedGame === location.hash.slice(1), null, { timeout: 60_000 })
  const coinDoor = page.locator('.arcade-dialog[open] .arcade-dialog-insert')
  if (await coinDoor.isVisible()) await coinDoor.click()
  await page.waitForFunction(() => document.body.dataset.loadedGame === location.hash.slice(1), null, { timeout: 60_000 })
  await page.waitForFunction(() => {
    const spinner = document.querySelector('img[src*="loader.gif"]')
    if (spinner && spinner.style.display !== 'none') return false
    // right after a page load the spinner does not exist yet, so also wait for the game itself
    return Boolean(window.sceneManager?.instance?.scene)
  }, null, { timeout: 60_000 })
  await page.waitForTimeout(500)
}

/** Gets past any start screen: a plain start button, a mode choice or an aircraft choice. */
export async function startGame(page) {
  const hasStartScreen = await page.evaluate(() => window.sceneManager.instance.scene.hasStartScreen)
  if (hasStartScreen) await page.locator('#start, #jedan-igrac, .game-screen-select input').first().click()
}

const keys = ['ArrowUp', 'ArrowLeft', 'ArrowRight', 'ArrowDown', 'Space', 'Enter', 'KeyW', 'KeyA', 'KeyD', 'KeyS']

/** Plays for a few seconds by holding keys in turn and clicking the middle of the screen. */
export async function play(page, seconds = 5) {
  const end = Date.now() + seconds * 1000
  for (let i = 0; Date.now() < end; i++) {
    const key = keys[i % keys.length]
    await page.keyboard.down(key)
    await page.waitForTimeout(250)
    await page.keyboard.up(key)
    if (i % 4 === 0) await page.mouse.click(640, 400)
  }
}

export const errorScreen = page =>
  page.locator('#modal h3.red', { hasText: /could not be loaded|stopped because of an error/ })
export const countFullScreenButtons = page => page.locator('full-screen-btn').count()
