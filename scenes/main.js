import SceneManager from './SceneManager.js'

const handleClick = e => {
  const target = e.target.closest('.js-start')
  if (target?.classList.contains('js-start')) {
    const manager = new SceneManager()
    manager.start(target.value)
  }
}

document.addEventListener('click', handleClick)

window.addEventListener('popstate', () => {
  const confirmation = window.confirm('Pritiskom na back napuštate sajt. Potvrdite komandu.')
  if (!confirmation)
    history.pushState(null, null, location.href)
})
