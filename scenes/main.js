import SceneManager from './SceneManager.js'

/** ROUTER */

document.addEventListener('click', e => {
  const button = e.target.closest('button')
  const jsStart = e.target.closest('.js-start')

  if (jsStart) {
    new SceneManager().start(jsStart.dataset.path)
    document.getElementById('ui').innerHTML = ''
    window.location.hash = jsStart.dataset.path
  }

  if (button?.id == 'menu')
    window.location.hash = ''
})

addEventListener('hashchange', () => {
  if (!location.hash) location.reload()
})
