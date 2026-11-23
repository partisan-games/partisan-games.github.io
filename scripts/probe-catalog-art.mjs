// Run against the local project server. An optional name or category selects a subset.
// The inspection hook is injected into Playwright's response, never into the application.
import assert from 'node:assert/strict'
import { mkdir, readFile, writeFile } from 'node:fs/promises'
import { chromium } from '@playwright/test'

const base = process.env.CATALOG_URL || 'http://localhost:8080'
const filter = process.argv[2] ?? ''
const output = process.argv[3] || 'test-results/katalog-animacije.json'

async function readCatalog(page) {
  await page.goto(base + '/catalog.html')
  return page.evaluate(async() => {
    const { default: kinds } = await import('/catalog/stories/index.js')
    return kinds.flatMap(kind => kind.stories.flatMap(story => (story.looks ?? [null]).map(look => ({
      path: [kind.id, story.id, look?.id].filter(Boolean).join('/'), name: story.name, game: story.game,
      dimension: story.stage ? '3d' : '2d', sided: 'way' in story,
    }))))
  })
}

if (filter === '--report') {
  const read = async name => JSON.parse(await readFile('test-results/' + name + '.json', 'utf8'))
  const [flat, spatial, characters] = await Promise.all(['sb-2d', 'sb-3d', 'character-actions-audit'].map(read))
  const looks = [...flat, ...spatial]
  const browser = await chromium.launch()
  try {
    const entries = await readCatalog(await browser.newPage())
    assert.deepEqual(looks.map(row => row.path).sort(), entries.map(row => row.path).sort())
    const catalog = new Map(entries.map(entry => [entry.path, entry]))
    for (const row of looks) Object.assign(row, catalog.get(row.path))
  } finally {
    await browser.close()
  }
  for (const character of characters) {
    const story = spatial.find(row => row.path.split('/')[1] === character.id)
    assert.ok(story, character.id)
    story.character = character
  }
  for (const row of looks) assert.ok(row.unavailable || (row.controls.length && !row.errors.length), row.path)
  await writeFile('docs/references/katalog-animacije.json', JSON.stringify(looks) + '\n')
  console.log(looks.length + ' izgleda u izveštaju.')
  process.exit(0)
}
await mkdir('test-results', { recursive: true })
const browser = await chromium.launch()
const reports = []
try {
  const context = await browser.newContext({ viewport: { width: 1000, height: 700 } })
  await context.routeWebSocket('**', () => {})
  await context.route('**/catalog/main.js', async route => {
    const res = await route.fetch()
    await route.fulfill({ response: res, body: await res.text() + '\nwindow.inspectStory = () => shown\n' })
  })
  const index = await context.newPage()
  const entries = await readCatalog(index)
  await index.close()
  const selected = entries.filter(e => (e.path + ' ' + e.dimension).includes(filter))
  if (!selected.length) throw Error('Nijedna priča ne odgovara izboru ' + filter)
  for (const entry of selected) {
    const page = await context.newPage()
    const errors = new Set()
    const report = { ...entry, errors: [], controls: [] }
    reports.push(report)
    page.on('pageerror', e => errors.add(e.message))
    page.on('response', r => {
      if (r.status() >= 400) errors.add(r.status() + ' ' + new URL(r.url()).pathname)
    })
    try {
      await page.goto(base + '/catalog.html#' + entry.path)
      await page.waitForFunction(() => window.inspectStory?.() || document.querySelector('[data-unavailable]'), null, { timeout: 30000 })
      const unavailable = page.locator('[data-unavailable]')
      if (await unavailable.count()) {
        report.unavailable = await unavailable.textContent()
        continue
      }
      report.controls = await page.evaluate(async() => {
        const panel = document.querySelector('#catalog-panel')
        const buttons = [...panel.querySelectorAll('[data-state],[data-shot],[data-act],[data-hit],[data-command]')]
          .map(el => ({ key: Object.keys(el.dataset)[0], value: Object.values(el.dataset)[0], label: el.textContent }))
        const original = window.inspectStory()
        original.stage.gameLoop.stop()
        const delay = () => new Promise(resolve => {
          setTimeout(resolve, 15)
        })
        async function replace(button) {
          const previous = window.inspectStory()
          button.click()
          for (let i = 0; i < 2000; i++) {
            const next = window.inspectStory()
            if (next && next !== previous) {
              next.stage.gameLoop.stop()
              return next
            }
            await delay()
          }
          throw Error('Reset nije ponovo napravio aktera')
        }
        if (original.story.way) {
          const other = await replace(panel.querySelector('[data-way="' + -original.story.way + '"]'))
          if (other.block === original.block) throw Error('Promena strane nije napravila novi prikaz')
        }
        const results = []
        for (const button of buttons) {
          const { block, stage } = await replace(panel.querySelector('[data-again]'))
          const model = stage.children.find(child => child.body === block) ?? block
          const clips = new Set(), frames = new Set(), states = new Set()
          const start = [block.x, block.y, block.z], shots = block.shotsFired, hits = block.hitsTaken
          const canvas = document.createElement('canvas')
          canvas.width = 100
          canvas.height = 70
          const ctx = canvas.getContext('2d', { willReadFrequently: true })
          const pixels = new Set()
          function sample() {
            stage.clear()
            stage.render()
            ctx.drawImage(stage.canvas, 0, 0, canvas.width, canvas.height)
            let hash = 2166136261
            for (const byte of ctx.getImageData(0, 0, canvas.width, canvas.height).data) hash = Math.imul(hash ^ byte, 16777619)
            pixels.add(hash)
          }
          sample()
          panel.querySelector('[data-' + button.key + '="' + button.value + '"]').click()
          for (let i = 0; i < 180; i++) {
            stage.session.update(1 / 30)
            stage.update(1 / 30, (i + 1) / 30)
            states.add(block.state)
            if (typeof model.clip === 'string') clips.add(model.clip)
            for (const [name, action] of Object.entries(model.actions ?? {}))
              if (action?.isRunning?.() && action.getEffectiveWeight() > .05) clips.add(name)

            if (Number.isFinite(model.frameIndex)) frames.add(model.frameIndex)
            if ([1, 6, 18, 40, 90, 179].includes(i)) sample()
          }
          const shifted = start.some((v, i) => Number.isFinite(v) && Math.abs(v - [block.x, block.y, block.z][i]) > .01)
          results.push({ label: button.label, states: [...states].filter(Boolean), clips: [...clips], frames: [...frames],
            distinctImages: pixels.size, moved: shifted, shots: (block.shotsFired - shots) || 0, hits: (block.hitsTaken - hits) || 0 })
        }
        return results
      })
    } catch (error) {
      errors.add(error.message.split('\n')[0])
    } finally {
      report.errors = [...errors]
      console.log(entry.path, report.controls.length, report.errors.join(' | '))
      await page.close()
      await writeFile(output, JSON.stringify(reports, null, 2) + '\n')
    }
  }
} finally {
  await browser.close()
}
