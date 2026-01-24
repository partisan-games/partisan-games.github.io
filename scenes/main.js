import SceneManager from './SceneManager.js'

document.addEventListener('click', e => {
  const target = e.target.closest('.js-start')
  if (!target) return

  new SceneManager().start(target.dataset.name)
  document.getElementById('ui').innerHTML = ''
})

window.addEventListener('popstate', () => {
  const confirmation = window.confirm('Pritiskom na back napuštate sajt. Potvrdite komandu.')
  if (!confirmation)
    history.pushState(null, null, location.href)
})
