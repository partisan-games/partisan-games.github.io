import Stage2D from './Stage2D.js'
import kinds from './stories/index.js'
import { controlsHtml, change, restore, inputValue, formatValue } from './controls.js'

const list = document.getElementById('storybook-list')
const panel = document.getElementById('storybook-panel')

/** What each shot a block can take is called on its button, in the order the buttons stand, the higher above. */
const shotNames = { up: 'Pucaj gore', straight: 'Pucaj pravo' }

/** The story at `kind/story` in the address, or the first one, and its look at `kind/story/look`, or its first. */
const find = address => {
  const [kindId, storyId, lookId] = address.split('/')
  const kind = kinds.find(({ id }) => id === kindId) ?? kinds[0]
  const story = kind.stories.find(({ id }) => id === storyId) ?? kind.stories[0]
  const look = story.looks?.find(({ id }) => id === lookId) ?? story.looks?.[0]
  return { kind, story, look }
}

/** The story on the stage, once its block is made. */
let shown
/** The way a story that can face either side shows its block: 1 right, -1 left; each story starts from its own. */
let way = 1

/** How many times a story has been asked for, so a slow one that a newer one overtook ends unseen. */
let asked = 0

/** Makes the story in the address anew; another story than the one shown starts from its block's first settings. */
async function show() {
  const turn = ++asked
  const previous = shown
  shown = null
  previous?.stage.end()
  const { kind, story, look } = find(location.hash.slice(1))
  if (story !== previous?.story) {
    restore()
    way = story.way ?? 1
  }
  drawList(story)
  const Stage = story.stage ?? Stage2D
  document.body.dataset.stage = Stage === Stage2D ? '2d' : '3d'
  const stage = new Stage({ pxPerMeter: story.pxPerMeter })
  // a 3D block waits for its models
  await stage.init()
  const block = await story.create(stage, way, look?.value)
  if (stage instanceof Stage2D) await stage.imagesLoaded()
  if (turn !== asked) return stage.end()
  stage.start()
  shown = { kind, story, look, stage, block }
  drawPanel()
}

function drawList(current) {
  list.innerHTML = kinds.map(kind => /* html */`
    <h2>${kind.title}</h2>
    ${kind.stories.map(story => `<a href="#${kind.id}/${story.id}" aria-current="${story === current}">${story.name}</a>`).join('')}
  `).join('')
}

/** One button for each of `names`, which set the block to that state, and any `more` buttons after them. */
const stateButtons = (legend, names, more = '') => /* html */`
  <fieldset>
    <legend>${legend}</legend>
    ${names.map(name => `<button data-state="${name}">${name}</button>`).join('')}
    ${more}
  </fieldset>`

/** Makes the story anew with its first settings; most often wanted after a block has died. */
const resetButton = '<button data-again>Reset</button>'

/** One button for each of a character's actions, which it does once. */
const actButtons = names => /* html */`
  <fieldset>
    <legend>Radnje</legend>
    ${names.map(name => `<button data-act="${name}">${name}</button>`).join('')}
  </fieldset>`

/** The looks of a block drawn in several ways, as the markings of a plane, the one shown pressed; each has an address. */
const lookButtons = (kind, story, current) => /* html */`
  <fieldset>
    <legend>Izgled</legend>
    ${story.looks.map(look => `<button data-look="${kind.id}/${story.id}/${look.id}" aria-pressed="${look === current}">${look.name}</button>`).join('')}
  </fieldset>`

/** The two sides a block can face, the one it faces pressed. */
const sideButtons = () => /* html */`
  <fieldset>
    <legend>Strana</legend>
    <button data-way="-1" aria-pressed="${way < 0}">Nalevo</button>
    <button data-way="1" aria-pressed="${way > 0}">Nadesno</button>
  </fieldset>`

/** The block's shots, the higher one above. */
const shotButtons = block => Object.keys(shotNames)
  .filter(name => name in block.shots)
  .map(name => `<button class="storybook-shot" data-shot="${name}">${shotNames[name]}</button>`)
  .join('')

function drawPanel() {
  const { kind, story, look, block, stage } = shown
  panel.innerHTML = /* html */`
    <h2>${story.name}</h2>
    <p>${story.game}</p>
    ${story.looks ? lookButtons(kind, story, look) : ''}
    ${'way' in story ? sideButtons() : ''}
    ${block.states ? stateButtons('Stanja', block.states, resetButton) : resetButton}
    ${block.anim ? stateButtons('Animacije', Object.keys(block.anim.actions)) : ''}
    ${block.acts?.length ? actButtons(block.acts) : ''}
    ${block.shots ? /* html */`
      <fieldset>
        <legend>Pucanje</legend>
        ${shotButtons(block)}
      </fieldset>` : ''}
    <button data-follow aria-pressed="${Boolean(stage.followed)}">Prati kamerom</button>
    ${controlsHtml(story.block, story.settings)}
  `
}

/** Aims `block` at the point of its `shot`, ahead of it the way it faces. */
function aim(block, shot) {
  const { x, y, z = 0 } = block.shots[shot]
  block.aimAt({ x: block.x + block.forward * x, y: block.y + y, z: (block.z ?? 0) + z })
}

panel.addEventListener('click', event => {
  const button = event.target.closest('button')
  if (!button || !shown) return
  if ('again' in button.dataset) {
    restore()
    way = shown.story.way ?? 1
    return show()
  }
  const { block, stage } = shown
  // another look is the story at its own address
  if ('look' in button.dataset) {
    location.hash = button.dataset.look
    return
  }
  // a block made facing the other side is the story anew
  if ('way' in button.dataset) {
    way = Number(button.dataset.way)
    return show()
  }
  if ('follow' in button.dataset) {
    stage.follow(stage.followed ? null : block)
    button.setAttribute('aria-pressed', String(Boolean(stage.followed)))
    return
  }
  const { state, act } = button.dataset
  // a block set to fire with no aim, as a gun, first aims at its straight shot, as its button would
  if (state === 'fire' && block.shots?.straight) aim(block, 'straight')
  if (state) block.setState(state)
  if (act) block.act(act)
  const { shot } = button.dataset
  if (!shot) return
  aim(block, shot)
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
