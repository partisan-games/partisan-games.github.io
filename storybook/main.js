import Stage2D from './Stage2D.js'
import kinds from './stories/index.js'

const list = document.getElementById('storybook-list')
const panel = document.getElementById('storybook-panel')

/** What each shot a block can take is called on its button, in the order the buttons stand, the higher above. */
const shotNames = { up: 'Pucaj gore', straight: 'Pucaj pravo' }

/** The story at `kind/story` in the address, or the first one. */
const find = address => {
  const [kindId, storyId] = address.split('/')
  const kind = kinds.find(({ id }) => id === kindId) ?? kinds[0]
  const story = kind.stories.find(({ id }) => id === storyId) ?? kind.stories[0]
  return { kind, story }
}

let shown

function show() {
  shown?.stage.end()
  const { kind, story } = find(location.hash.slice(1))
  const stage = new Stage2D()
  const block = story.create(stage)
  stage.start()
  shown = { kind, story, stage, block }
  drawList()
  drawPanel()
}

function drawList() {
  list.innerHTML = kinds.map(kind => /* html */`
    <h2>${kind.title}</h2>
    ${kind.stories.map(story => `<a href="#${kind.id}/${story.id}" aria-current="${story === shown.story}">${story.name}</a>`).join('')}
  `).join('')
}

/** The block's shots, the higher one above. */
const shotButtons = block => Object.keys(shotNames)
  .filter(name => name in block.shots)
  .map(name => `<button class="storybook-shot" data-shot="${name}">${shotNames[name]}</button>`)
  .join('')

function drawPanel() {
  const { story, block } = shown
  panel.innerHTML = /* html */`
    <h2>${story.name}</h2>
    <p>${story.game}</p>
    ${block.states ? /* html */`
      <fieldset>
        <legend>Stanja</legend>
        ${block.states.map(name => `<button data-state="${name}">${name}</button>`).join('')}
      </fieldset>` : ''}
    ${block.shots ? /* html */`
      <fieldset>
        <legend>Pucanje</legend>
        ${shotButtons(block)}
      </fieldset>` : ''}
    <button data-follow aria-pressed="false">Prati kamerom</button>
    <button data-again>Reset</button>
  `
}

panel.addEventListener('click', event => {
  const button = event.target.closest('button')
  if (!button) return
  if ('again' in button.dataset) return show()
  const { block, stage } = shown
  if ('follow' in button.dataset) {
    stage.follow(stage.followed ? null : block)
    button.setAttribute('aria-pressed', String(Boolean(stage.followed)))
    return
  }
  const { state } = button.dataset
  if (state) block.setState(state)
  const { shot } = button.dataset
  if (!shot) return
  // each shot is the block aimed at its own point ahead, the way it faces, then firing
  const { x, y } = block.shots[shot]
  block.aimAt({ x: block.x + block.forward * x, y: block.y + y })
  block.setState('fire')
})

// the current state is the block's own news, read each frame without redrawing the buttons under the pointer
const markState = () => {
  for (const button of panel.querySelectorAll('[data-state]'))
    button.setAttribute('aria-pressed', String(button.dataset.state === shown.block.state))
  requestAnimationFrame(markState)
}

window.addEventListener('hashchange', show)
show()
markState()
