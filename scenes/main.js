import SceneManager from './SceneManager.js'

const manager = new SceneManager()
const elementUI = document.getElementById('ui')
const modalElement = document.getElementById('modal')

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

const route = () => {
  const path = location.hash.slice(1)
  if (!path) return location.reload()

  elementUI.innerHTML = modalElement.innerHTML = ''
  manager.start(path).catch(showLoadError)
}

if (location.hash) route()
else if (window.innerWidth >= 800)
  manager.start('lookat-cursor', false).catch(console.error)

document.addEventListener('click', e => {
  const button = e.target.closest('button')
  const jsStart = e.target.closest('.js-start')

  if (jsStart)
    location.hash = jsStart.dataset.path

  if (button?.id === 'menu')
    location.hash = ''
})

addEventListener('hashchange', route)
