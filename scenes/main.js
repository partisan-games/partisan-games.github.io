import SceneManager from './SceneManager.js'
import Arcade from '/ui/Arcade.js'
import { mainMenuButton } from '/ui/UI.js'
import { admission } from '/core/io/admission.js'

const manager = new SceneManager()
const elementUI = document.getElementById('ui')
const modalElement = document.getElementById('modal')
export const arcade = new Arcade()

// the development pages are linked only on the local server
if (arcade.isLocal) document.querySelector('.dev-links')?.removeAttribute('hidden')

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

// a game with a start screen costs a token from the pocket of this page, paid at its start
admission.charge = () => arcade.coins.spend().finally(arcade.refresh)
admission.refund = receipt => arcade.coins.refund(receipt).finally(arcade.refresh)
admission.remaining = () => arcade.storageAvailable ? arcade.coins.read().remaining : null
// the paid buttons of the open game follow the pocket
arcade.onChange = () => manager.scene?.ui.markPaid()

/** Opens the game in the address; `replay` starts it again with the player's last choice, without its start screen. */
const route = async({ replay = false } = {}) => {
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

  elementUI.innerHTML = modalElement.innerHTML = ''
  try {
    await manager.start(path, true, { replay })
    if (currentNavigation === navigation) document.body.dataset.loadedGame = path
  } catch (error) {
    showLoadError(error)
  }
}

if (location.hash) route()
else if (window.innerWidth >= 800)
  manager.start('lookat-cursor', false).catch(console.error)

document.addEventListener('click', e => {
  const button = e.target.closest('button')
  const card = e.target.closest('.menu-item[data-path]')

  // a card opens its game for free; a game with a start screen asks for a token at its start
  if (card) location.hash = card.dataset.path

  if (button?.id === 'menu')
    location.hash = ''

  // a new scene of the same game, without reloading the page
  if (button?.id === 'igraj-opet' && !button.disabled)
    route({ replay: true })
})

addEventListener('hashchange', route)
