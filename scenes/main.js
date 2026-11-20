import SceneManager from './SceneManager.js'
import Arcade from '/ui/Arcade.js'
import { mainMenuButton } from '/ui/UI.js'

const manager = new SceneManager()
const elementUI = document.getElementById('ui')
const modalElement = document.getElementById('modal')
export const arcade = new Arcade()

// the development pages are linked only on the local server
if (arcade.isLocal) document.querySelector('.dev-links')?.removeAttribute('hidden')

let paidEntry = null
let navigation = 0

const showError = title => {
  modalElement.innerHTML = /* html */`
    <div class="central-screen flex-column simple-container">
      <h3 class="red">${title}</h3>
      ${mainMenuButton('default-button')}
    </div>
  `
}

const showLoadError = error => {
  console.error(error)
  showError('The game could not be loaded')
}

// a sound the browser refuses to play (autoplay policy) or interrupts does not break the game
const harmlessRejections = ['NotAllowedError', 'AbortError']

// the browser has already logged the error itself
const handleRuntimeError = event => {
  if (!location.hash) return // the menu background scene fails silently
  if (harmlessRejections.includes(event.reason?.name)) return

  manager.endScene()
  showError('The game has stopped because of an error')
}

addEventListener('error', handleRuntimeError)
addEventListener('unhandledrejection', handleRuntimeError)

/** ROUTER */

const route = async() => {
  const currentNavigation = ++navigation
  const path = location.hash.slice(1)
  if (!path) return location.reload()

  delete document.body.dataset.loadedGame
  arcade.refresh()
  manager.scene?.pause()
  if (document.pointerLockElement) document.exitPointerLock()
  if (!arcade.games.has(path)) {
    showError('The game could not be loaded')
    return
  }
  const free = arcade.isFree(path)
  if (!free && paidEntry?.path !== path) {
    arcade.prompt(path)
    return
  }

  // a free game has no coin to give back if it does not start
  const receipt = free ? null : paidEntry.receipt
  const refund = () => receipt && arcade.coins.refund(receipt)
  paidEntry = null
  arcade.close()
  elementUI.innerHTML = modalElement.innerHTML = ''
  try {
    await manager.start(path)
    if (currentNavigation !== navigation) {
      manager.endScene()
      await refund()
    } else document.body.dataset.loadedGame = path
  } catch (error) {
    await refund()
    showLoadError(error)
  } finally {
    arcade.setBusy(false)
    arcade.refresh()
  }
}

arcade.onInsert = async path => {
  if (arcade.busy || !arcade.games.has(path)) return
  if (arcade.isFree(path)) return play(path)
  const insertionNavigation = navigation
  arcade.setBusy(true, path)
  let receipt
  try {
    receipt = await arcade.coins.spend()
    arcade.refresh()
    if (!receipt) {
      arcade.prompt(path, 'empty')
      arcade.setBusy(false)
      return
    }
  } catch {
    arcade.setBusy(false)
    arcade.prompt(path, 'storage')
    return
  }
  await arcade.insertCoin(path)
  if (insertionNavigation !== navigation) {
    await arcade.coins.refund(receipt)
    arcade.setBusy(false)
    arcade.refresh()
    return
  }
  paidEntry = { path, receipt }
  play(path)
}

/** Opens `path`, or starts it anew when it is open already. */
function play(path) {
  if (location.hash.slice(1) === path) route()
  else location.hash = path
}
arcade.onCancel = () => {
  location.hash = ''
}

if (location.hash) route()
else if (window.innerWidth >= 800)
  manager.start('lookat-cursor', false).catch(console.error)

document.addEventListener('click', e => {
  const button = e.target.closest('button')
  const coinSlot = e.target.closest('[data-arcade-game]')
  const freeCard = e.target.closest('.menu-item[data-free]')

  if (coinSlot) arcade.onInsert(coinSlot.dataset.arcadeGame)
  if (freeCard) play(freeCard.dataset.path)

  if (button?.id === 'menu')
    location.hash = ''

  // a new scene of the same game, without reloading the page
  if (button?.id === 'igraj-opet')
    arcade.onInsert(location.hash.slice(1))
})

addEventListener('hashchange', route)
