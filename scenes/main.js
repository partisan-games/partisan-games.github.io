import SceneManager from './SceneManager.js'
import Arcade from '/ui/Arcade.js'

const manager = new SceneManager()
const elementUI = document.getElementById('ui')
const modalElement = document.getElementById('modal')
const arcade = new Arcade()
let paidEntry = null
let navigation = 0

const showError = title => {
  modalElement.innerHTML = /* html */`
    <div class="central-screen flex-column simple-container">
      <h3 class="red">${title}</h3>
      <button class="default-button" id="menu"><span class="icon">☰</span> Main menu</button>
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
  if (paidEntry?.path !== path) {
    arcade.prompt(path)
    return
  }

  const { receipt } = paidEntry
  paidEntry = null
  arcade.close()
  elementUI.innerHTML = modalElement.innerHTML = ''
  try {
    await manager.start(path)
    if (currentNavigation !== navigation) {
      manager.endScene()
      await arcade.coins.refund(receipt)
    } else document.body.dataset.loadedGame = path
  } catch (error) {
    await arcade.coins.refund(receipt)
    showLoadError(error)
  } finally {
    arcade.setBusy(false)
    arcade.refresh()
  }
}

arcade.onInsert = async path => {
  if (arcade.busy || !arcade.games.has(path)) return
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
  if (location.hash.slice(1) === path) route()
  else location.hash = path
}
arcade.onCancel = () => { location.hash = '' }

if (location.hash) route()
else if (window.innerWidth >= 800)
  manager.start('lookat-cursor', false).catch(console.error)

document.addEventListener('click', e => {
  const button = e.target.closest('button')
  const coinSlot = e.target.closest('[data-arcade-game]')

  if (coinSlot) arcade.onInsert(coinSlot.dataset.arcadeGame)

  if (button?.id === 'menu')
    location.hash = ''

  // a new scene of the same game, without reloading the page
  if (button?.id === 'igraj-opet')
    arcade.onInsert(location.hash.slice(1))
})

addEventListener('hashchange', route)
