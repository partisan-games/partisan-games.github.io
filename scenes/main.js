import SceneManager from './SceneManager.js'
import { arcade } from '/ui/homeArcade.js'
import { mainMenuButton } from '/ui/UI.js'
import { admission } from '/core/io/admission.js'
import audioEngine from '/core/io/audio/AudioEngine.js'

const manager = new SceneManager()
const elementUI = document.getElementById('ui')
const modalElement = document.getElementById('modal')
// the menu sits where a game draws its HUD; it is kept, to come back to without reloading the page
const homepage = elementUI.querySelector('.homepage')

let navigation = 0
let openingCabinet = false

/** The games whose address is not the name of their folder. */
const addresses = { cannon: 'jablanica' }
const gameAt = address => Object.keys(addresses).find(path => addresses[path] === address) ?? address

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

/** Back to the menu: the game ends, its HUD and windows go, and the cabinets and the pocket show again. */
const showMenu = () => {
  manager.leave()
  if (document.pointerLockElement) document.exitPointerLock()
  delete document.body.dataset.loadedGame
  modalElement.innerHTML = ''
  elementUI.replaceChildren(homepage)
  // a game opened by its link hid the menu from the start
  document.documentElement.classList.remove('game-link')
  arcade.refresh()
  scrollTo(0, 0)
}

/** Opens the game in the address. */
const route = async() => {
  const currentNavigation = ++navigation
  const path = gameAt(location.hash.slice(1))
  if (!path) return showMenu()

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
    // The first report is shown after the cabinet animation and scene loading.
    if (e.isTrusted) audioEngine.unlock().then(() => manager.scene?.syncSounds()).catch(() => {})
    openingCabinet = true
    const currentNavigation = navigation
    try {
      await arcade.insertCoin(card.dataset.path)
      if (currentNavigation === navigation && !location.hash) location.hash = addresses[card.dataset.path] ?? card.dataset.path
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
