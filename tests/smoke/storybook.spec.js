import { test, expect } from '@playwright/test'
import { watchProblems } from './helpers.js'

/** Counts the page's document and window listeners and its elements, which a story could leave behind. */
function countLeftovers() {
  const listeners = new Map()
  for (const [name, target] of [['document', document], ['window', window]]) {
    const add = target.addEventListener.bind(target)
    const remove = target.removeEventListener.bind(target)
    target.addEventListener = (type, listener, options) => {
      listeners.set(`${name} ${type}`, (listeners.get(`${name} ${type}`) ?? new Set()).add(listener))
      return add(type, listener, options)
    }
    target.removeEventListener = (type, listener, options) => {
      listeners.get(`${name} ${type}`)?.delete(listener)
      return remove(type, listener, options)
    }
  }
  window.leftovers = () => ({
    listeners: Object.fromEntries([...listeners].map(([key, set]) => [key, set.size]).filter(([, size]) => size)),
    bodyElements: document.body.querySelectorAll('*').length - document.querySelectorAll('#storybook-list *, #storybook-panel *').length,
    headElements: document.head.children.length,
  })
}

test('every story, 2D and 3D, opens without errors, and going through them all twice leaves nothing behind', async({ page }) => {
  test.setTimeout(5 * 60_000)
  const problems = watchProblems(page)
  await page.addInitScript(countLeftovers)
  await page.goto('/storybook.html')
  const stories = await page.locator('#storybook-list a').evaluateAll(links =>
    links.map(link => ({ address: link.hash.slice(1), name: link.textContent })))
  expect(stories.length).toBeGreaterThan(10)

  let afterFirst
  for (const round of [1, 2]) {
    for (const { address, name } of stories) {
      await page.evaluate(hash => {
        location.hash = hash
      }, address)
      // the panel shows once the block is made, a 3D one after its models load
      await expect(page.locator('#storybook-panel h2')).toHaveText(name, { timeout: 30_000 })
      // a few frames of the story's life
      await page.waitForTimeout(150)
    }
    if (round === 1) afterFirst = await page.evaluate(() => window.leftovers())
  }
  expect(await page.evaluate(() => window.leftovers())).toEqual(afterFirst)
  expect(problems).toEqual([])
})
