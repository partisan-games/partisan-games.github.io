import { expect } from '@playwright/test'
import { test, watchProblems, waitForScene } from './helpers.js'

// 2D and 3D games with listeners, DOM controls, orbit controls and start screens of their own
const games = ['dark-city', 'bunker', 'fps-base', 'avatar', 'cannon', 'moon-landing', 'vis', 'drvar', 'capoeira-girl']
const switches = 20

/** Counts what a game can leave behind: document and window listeners, WebGL contexts and page elements. */
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

  const contexts = new WeakSet()
  let contextCount = 0
  const { getContext } = HTMLCanvasElement.prototype
  HTMLCanvasElement.prototype.getContext = function(type, ...rest) {
    const context = getContext.call(this, type, ...rest)
    if (String(type).startsWith('webgl') && context && !contexts.has(context)) {
      contexts.add(context)
      contextCount++
    }
    return context
  }

  window.leftovers = () => ({
    listeners: Object.fromEntries([...listeners].map(([key, set]) => [key, set.size]).filter(([, size]) => size)),
    contexts: contextCount,
    bodyElements: document.body.children.length,
    headElements: [...document.head.children].map(element => element.outerHTML.slice(0, 60)).sort(),
  })
}

test(`${switches} game switches leave no listeners, WebGL contexts or elements behind`, async({ page }) => {
  test.setTimeout(10 * 60_000)
  const problems = watchProblems(page)
  await page.addInitScript(countLeftovers)

  let afterSecond
  for (let i = 0; i <= switches; i++) {
    const game = games[i % games.length]
    if (i === 0) await page.goto(`/#${game}`)
    else await page.evaluate(name => {
      location.hash = name
    }, game)
    await waitForScene(page)
    if (i === 2) afterSecond = await page.evaluate(() => window.leftovers())
  }

  // switch 20 opens the same game as switch 2, since 18 is a multiple of the 9 games
  expect(switches % games.length).toBe(2)
  expect(await page.evaluate(() => window.leftovers())).toEqual(afterSecond)
  expect(problems).toEqual([])
})
