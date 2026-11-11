import { installFakeFrames } from './frames.js'

const modal = () => document.getElementById('modal').innerHTML.replace(/\s+/g, ' ').trim()

const key = (type, code) => document.dispatchEvent(new KeyboardEvent(type, { code }))

const clickButton = id => document.querySelector(`#modal #${id}`).click()

/**
 * Walks one scene of the given UI style through every central screen, the way a player does,
 * and returns the HTML of #modal at each point.
 */
export async function captureScreens(uiStyle) {
  const { default: Scena } = await import('/core/Scena.js')
  const frames = installFakeFrames()
  const html = {}
  const createScene = () => new Scena({ canvas: document.createElement('canvas'), uiStyle, intro: 'Reach the forest' })
  let scene = createScene()

  scene.ui.renderStartScreen()
  html.start = modal()

  clickButton('start')
  frames.step()
  html.afterStart = modal()

  key('keydown', 'Escape')
  frames.step()
  key('keyup', 'Escape')
  html.pause = modal()

  clickButton('continue')
  frames.step()
  html.afterContinue = modal()

  scene.pause()
  frames.step()
  html.pauseOnLeavingTab = modal()
  clickButton('continue')
  frames.step()

  scene.defeat('Caught by the patrol')
  frames.step()
  html.defeat = modal()

  scene.pause()
  key('keydown', 'Escape')
  frames.step()
  key('keyup', 'Escape')
  html.pauseAfterEnd = modal()

  // play again starts a new scene of the same game (scenes/main.js)
  scene.end()
  scene = createScene()
  scene.victory('All gathered')
  frames.step()
  html.victory = modal()

  scene.end()
  scene = createScene()
  scene.victory('Bridge destroyed', 'Mission complete')
  frames.step()
  html.victoryWithTitle = modal()

  scene.end()
  return html
}
