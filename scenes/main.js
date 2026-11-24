import SceneManager from './SceneManager.js'
import Arcade from '/ui/Arcade.js'
import { mainMenuButton } from '/ui/UI.js'
import { admission } from '/core/io/admission.js'
import { isDev } from '/config.js'

document.body.classList.toggle('dev-mode', isDev)

const manager = new SceneManager()
const elementUI = document.getElementById('ui')
const modalElement = document.getElementById('modal')
export const arcade = new Arcade()

// the development pages are linked only on the local server
if (arcade.isLocal) document.querySelector('.dev-links')?.removeAttribute('hidden')

let navigation = 0
let openingCabinet = false

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
  if (!location.hash) return // the menu has no game to stop
  if (harmlessRejections.includes(event.reason?.name)) return

  manager.endScene()
  showError('The game has stopped because of an error')
}

addEventListener('error', handleRuntimeError)
addEventListener('unhandledrejection', handleRuntimeError)

/** ROUTER */

// a paid game spends a token from the pocket of this page at its start
admission.charge = () => arcade.coins.spend().finally(arcade.refresh)
admission.refund = receipt => arcade.coins.refund(receipt).finally(arcade.refresh)
admission.remaining = () => arcade.storageAvailable ? arcade.coins.read().remaining : null
// the paid buttons of the open game follow the pocket
arcade.onChange = () => manager.scene?.ui.markPaid()

/** Opens the game in the address. */
const route = async() => {
  const currentNavigation = ++navigation
  const path = location.hash.slice(1).replace(/^jablanica$/, 'cannon')
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
    await manager.start(path)
    if (currentNavigation === navigation) document.body.dataset.loadedGame = path
  } catch (error) {
    showLoadError(error)
  }
}

if (location.hash) route()

document.addEventListener('click', async e => {
  const button = e.target.closest('button')
  const card = e.target.closest('.arcade-cabinet[data-path]')

  // Finish the cabinet animation before routing; the game asks for a token at Start.
  if (card) {
    if (openingCabinet || location.hash) return
    openingCabinet = true
    const currentNavigation = navigation
    try {
      await arcade.insertCoin(card.dataset.path)
      if (currentNavigation === navigation && !location.hash) location.hash = card.dataset.path === 'cannon' ? 'jablanica' : card.dataset.path
    } finally {
      openingCabinet = false
    }
    return
  }

  if (button?.id === 'menu')
    location.hash = ''

  // a new scene of the same game, without reloading the page
  if (button?.id === 'igraj-opet' && !button.disabled)
    route()
})

addEventListener('hashchange', route)
