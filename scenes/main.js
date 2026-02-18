import SceneManager from './SceneManager.js'

const manager = new SceneManager()

/** ROUTER */

if (location.hash) {
  document.getElementById('ui').innerHTML = ''
  manager.start(location.hash.slice(1))
} else if (window.innerWidth >= 800)
  manager.start('lookat-cursor', false)

document.addEventListener('click', e => {
  const button = e.target.closest('button')
  const jsStart = e.target.closest('.js-start')

  if (jsStart) {
    manager.start(jsStart.dataset.path)
    document.getElementById('ui').innerHTML = ''
    window.location.hash = jsStart.dataset.path
  }

  if (button?.id == 'menu')
    window.location.hash = ''
})

addEventListener('hashchange', () => {
  if (!location.hash) location.reload()
})
