import { expect } from '@playwright/test'
import { test, watchProblems, waitForScene } from './helpers.js'

// 2D and 3D games with listeners, DOM controls, orbit controls and start screens of their own
const games = ['dark-city', 'bunker', 'fps-base', 'avatar', 'cannon', 'moon-landing', 'vis', 'drvar', 'capoeira-girl']
const switches = 20

/** Counts what a game can leave behind: document and window listeners, WebGL contexts and the objects in them, and page elements. */
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

  // textures, buffers and shader programs that a game created on the graphics card and never deleted
  const gpuObjects = { Texture: 0, Buffer: 0, Program: 0 }
  for (const Context of [WebGLRenderingContext, WebGL2RenderingContext])
    for (const kind of Object.keys(gpuObjects)) {
      const create = Context.prototype[`create${kind}`]
      const remove = Context.prototype[`delete${kind}`]
      Context.prototype[`create${kind}`] = function(...args) {
        gpuObjects[kind]++
        return create.apply(this, args)
      }
      Context.prototype[`delete${kind}`] = function(object) {
        if (object) gpuObjects[kind]--
        return remove.call(this, object)
      }
    }

  window.gpuObjects = () => ({ ...gpuObjects })
  window.leftovers = () => ({
    listeners: Object.fromEntries([...listeners].map(([key, set]) => [key, set.size]).filter(([, size]) => size)),
    contexts: contextCount,
    bodyElements: document.body.children.length,
    headElements: [...document.head.children].map(element => element.outerHTML.slice(0, 60)).sort(),
  })
}

test(`${switches} game switches leave no listeners, WebGL contexts, graphics card objects or elements behind`, async({ page }) => {
  test.setTimeout(10 * 60_000)
  const problems = watchProblems(page)
  await page.addInitScript(countLeftovers)

  let afterSecond, gpuInSecondRound
  for (let i = 0; i <= switches; i++) {
    // Twenty switches span three daily allowances, using the real coin door.
    await page.clock.setFixedTime(new Date(2026, 10, 14 + Math.floor(i / 10), 12))
    const game = games[i % games.length]
    if (i === 0) await page.goto(`/#${game}`)
    else await page.evaluate(name => {
      location.hash = name
    }, game)
    await waitForScene(page)
    // in a 2D game right after a 3D one, the 3D game's objects on the graphics card must be gone;
    // the shared renderer keeps the shaders it compiled in the first round
    if (i === 10) gpuInSecondRound = await page.evaluate(() => window.gpuObjects())
    if (i === 19) expect(await page.evaluate(() => window.gpuObjects())).toEqual(gpuInSecondRound)
    if (i === 2) afterSecond = await page.evaluate(() => window.leftovers())
  }

  // switch 20 opens the same game as switch 2, and 19 the same 2D game as 10, since the list has 9 games
  expect(switches % games.length).toBe(2)
  expect([games[10 % games.length], games[19 % games.length]]).toEqual(['bunker', 'bunker'])
  expect(await page.evaluate(() => window.leftovers())).toEqual(afterSecond)
  expect(problems).toEqual([])
})
