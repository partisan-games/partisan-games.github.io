import Stage2D from './Stage2D.js'
import kinds from './stories/index.js'
import { controlsHtml, change, restore, inputValue, formatValue } from './controls.js'

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

/** The story on the stage, once its block is made. */
let shown
/** How many times a story has been asked for, so a slow one that a newer one overtook ends unseen. */
let asked = 0

/** Makes the story in the address anew; another story than the one shown starts from its block's first settings. */
async function show() {
  const turn = ++asked
  const previous = shown
  shown = null
  previous?.stage.end()
  const { kind, story } = find(location.hash.slice(1))
  if (story !== previous?.story) restore()
  drawList(story)
  const Stage = story.stage ?? Stage2D
  document.body.dataset.stage = Stage === Stage2D ? '2d' : '3d'
  const stage = new Stage()
  // a 3D block waits for its models
  await stage.init()
  const block = await story.create(stage)
  if (turn !== asked) return stage.end()
  stage.start()
  shown = { kind, story, stage, block }
  drawPanel()
}

function drawList(current) {
  list.innerHTML = kinds.map(kind => /* html */`
    <h2>${kind.title}</h2>
    ${kind.stories.map(story => `<a href="#${kind.id}/${story.id}" aria-current="${story === current}">${story.name}</a>`).join('')}
  `).join('')
}

/** One button for each of `names`, which set the block to that state. */
const stateButtons = (legend, names) => /* html */`
  <fieldset>
    <legend>${legend}</legend>
    ${names.map(name => `<button data-state="${name}">${name}</button>`).join('')}
  </fieldset>`

/** The block's shots, the higher one above. */
const shotButtons = block => Object.keys(shotNames)
  .filter(name => name in block.shots)
  .map(name => `<button class="storybook-shot" data-shot="${name}">${shotNames[name]}</button>`)
  .join('')

function drawPanel() {
  const { story, block, stage } = shown
  panel.innerHTML = /* html */`
    <h2>${story.name}</h2>
    <p>${story.game}</p>
    ${block.states ? stateButtons('Stanja', block.states) : ''}
    ${block.anim ? stateButtons('Animacije', Object.keys(block.anim.actions)) : ''}
    ${block.shots ? /* html */`
      <fieldset>
        <legend>Pucanje</legend>
        ${shotButtons(block)}
      </fieldset>` : ''}
    ${controlsHtml(story.block)}
    <button data-follow aria-pressed="${Boolean(stage.followed)}">Prati kamerom</button>
    <button data-again>Reset</button>
  `
}

panel.addEventListener('click', event => {
  const button = event.target.closest('button')
  if (!button || !shown) return
  if ('again' in button.dataset) {
    restore()
    return show()
  }
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

// a block reads some settings only as it is made, so a changed one makes the story anew
panel.addEventListener('change', ({ target }) => {
  if (!target.dataset.setting || !shown) return
  change(shown.story.block, target.dataset.setting, inputValue(target))
  show()
})

panel.addEventListener('input', ({ target }) => {
  if (target.type === 'range') target.previousElementSibling.value = formatValue(Number(target.value))
})

// the current state is the block's own news, read each frame without redrawing the buttons under the pointer
const markState = () => {
  for (const button of panel.querySelectorAll('[data-state]'))
    button.setAttribute('aria-pressed', String(button.dataset.state === shown?.block.state))
  requestAnimationFrame(markState)
}

window.addEventListener('hashchange', show)
show()
markState()
