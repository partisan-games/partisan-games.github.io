import SceneManager from './SceneManager.js'

const manager = new SceneManager()
const elementUI = document.getElementById('ui')
const modalElement = document.getElementById('modal')

const showLoadError = error => {
  console.error(error)
  modalElement.innerHTML = /* html */`
    <div class="central-screen flex-column simple-container">
      <h3 class="red">The game could not be loaded</h3>
      <button class="default-button" id="menu"><span class="icon">☰</span> Main menu</button>
    </div>
  `
}

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

  if (button?.id == 'menu')
    location.hash = ''
})

addEventListener('hashchange', route)
