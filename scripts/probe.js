// Opens a game or a catalogue story in Chromium, plays a few steps and reports what it saw, on its own server that it
// stops when done. Usage: npm run probe -- <address> [steps...] [--size=1200x800] [--no-start]
//   address  a game, as `cannon`, or a story, as `catalog/vozila/partizanski-tenk` (a look may follow: `/italijanska`)
//   Key:ms   holds a key (Playwright's name: ArrowUp, Space, Enter, KeyA...) for that many milliseconds
//   mouse:ms holds the left mouse button in the middle of the page
//   click:selector, wait:ms, eval:expression (prints its result), shot or shot:name (saves test-results/probe/name.png)
import { spawn } from 'node:child_process'
import { createServer } from 'node:net'
import { mkdirSync } from 'node:fs'
import { chromium } from '@playwright/test'
import { missingModelTextures } from '../tests/smoke/known-issues.js'

const args = process.argv.slice(2)
const options = Object.fromEntries(args.filter(arg => arg.startsWith('--')).map(arg => arg.slice(2).split('=')))
const [address, ...steps] = args.filter(arg => !arg.startsWith('--'))
if (!address) {
  console.log('Usage: npm run probe -- <game | catalog/kind/story> [Key:ms | mouse:ms | click:css | wait:ms | eval:js | shot[:name]]...')
  process.exit(1)
}
const [width, height] = (options.size ?? '1200x800').split('x').map(Number)
const shots = 'test-results/probe'

/** A port nothing listens on now, so a server left over from another run is never reused. */
const freePort = () => new Promise(done => {
  const probe = createServer().listen(0, () => {
    const { port } = probe.address()
    probe.close(() => done(port))
  })
})

const port = await freePort()
const server = spawn(process.execPath, ['scripts/serve.js'], { env: { ...process.env, PORT: String(port) }, stdio: ['ignore', 'pipe', 'inherit'] })
await new Promise(ready => {
  server.stdout.once('data', ready)
})
const browser = await chromium.launch()
const problems = []
try {
  const page = await browser.newPage({ viewport: { width, height } })
  page.on('pageerror', error => problems.push(`pageerror: ${error.message}`))
  page.on('console', message => {
    if (message.type() === 'error' && !message.text().startsWith('Failed to load resource')) problems.push(`console: ${message.text()}`)
  })
  page.on('response', response => {
    const { pathname } = new URL(response.url())
    if (response.status() >= 400 && !missingModelTextures.includes(decodeURIComponent(pathname)))
      problems.push(`http ${response.status()}: ${pathname}`)
  })
  const story = address.startsWith('catalog/')
  if (story) {
    await page.goto(`http://localhost:${port}/catalog.html#${address.slice('catalog/'.length)}`)
    await page.waitForSelector('#catalog-panel h2', { timeout: 60_000 })
    await page.waitForTimeout(800)
  } else {
    await page.addInitScript(() => import('/scenes/SceneManager.js').then(module => {
      window.sceneManager = module.default
    }))
    await page.goto(`http://localhost:${port}/#${address}`)
    await page.waitForFunction(() => window.sceneManager?.instance?.scene, null, { timeout: 90_000 })
    await page.waitForTimeout(1500)
    if (!('no-start' in options) && await page.locator('#start').count()) {
      await page.locator('#start').click().catch(() => {})
      await page.waitForTimeout(500)
    }
  }
  mkdirSync(shots, { recursive: true })
  let shot = 0
  for (const step of steps) {
    const colon = step.indexOf(':')
    const [name, value] = colon < 0 ? [step, ''] : [step.slice(0, colon), step.slice(colon + 1)]
    if (name === 'shot') {
      const path = `${shots}/${value || `${address.replaceAll('/', '-')}-${shot++}`}.png`
      await page.screenshot({ path })
      console.log(`shot ${path}`)
    } else if (name === 'eval') console.log(JSON.stringify(await page.evaluate(value)))
    else if (name === 'wait') await page.waitForTimeout(Number(value))
    else if (name === 'click') await page.click(value)
    else if (name === 'mouse') {
      await page.mouse.move(width / 2, height / 2)
      await page.mouse.down()
      await page.waitForTimeout(Number(value))
      await page.mouse.up()
    } else {
      await page.keyboard.down(name)
      await page.waitForTimeout(Number(value) || 100)
      await page.keyboard.up(name)
    }
  }
} finally {
  await browser.close()
  server.kill()
}
console.log(problems.length ? problems.join('\n') : 'no problems')
process.exitCode = problems.length ? 1 : 0
