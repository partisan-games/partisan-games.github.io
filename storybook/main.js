import Stage2D from './Stage2D.js'
import kinds from './stories/index.js'
import { attackState } from '/core/gameplay/bodies/stateNames.js'

const list = document.getElementById('storybook-list')
const panel = document.getElementById('storybook-panel')

/** What each shot a block can take is called on its button, in the order the buttons stand, the higher above. */
const shotNames = { up: 'Pucaj gore', straight: 'Pucaj pravo', down: 'Obruši se', behind: 'Pucaj unazad' }

const dimensionOf = story => !story.stage || story.stage === Stage2D ? '2d' : '3d'

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

/** Makes the story in the address anew; another story than the one shown starts facing its own way. */
async function show() {
  const turn = ++asked
  const previous = shown
  shown = null
  previous?.stage.end()
  const { kind, story, look } = find(location.hash.slice(1))
  if (story !== previous?.story) way = story.way ?? 1
  drawList(kind, story)
  panel.replaceChildren()
  const Stage = story.stage ?? Stage2D
  document.body.dataset.stage = story.unavailable ? 'unavailable' : dimensionOf(story)
  if (story.unavailable) {
    const title = document.createElement('h2'), message = document.createElement('p')
    title.textContent = story.name
    message.textContent = story.unavailable
    message.dataset.unavailable = ''
    panel.append(title, message)
    return
  }
  const stage = new Stage({ pxPerMeter: story.pxPerMeter })
  // a 3D block waits for its models
  await stage.init()
  const block = await story.create(stage, way, look?.value)
  if (stage instanceof Stage2D) await stage.imagesLoaded()
  if (turn !== asked) return stage.end()
  stage.frame?.(block)
  stage.start()
  shown = { kind, story, look, stage, block }
  drawPanel()
}

function drawList(kind, current) {
  // Keep the disclosure elements when a story changes, so their open state and focus survive.
  if (!list.children.length) list.innerHTML = ['2d', '3d'].map(dimension => {
    const categories = kinds.map(group => {
      const stories = group.stories.filter(story => dimensionOf(story) === dimension)
      return stories.length ? /* html */`
          <h2>${group.title}</h2>
          ${stories.map(story => `<a href="#${group.id}/${story.id}" aria-current="false">${story.name}</a>`).join('')}
        ` : ''
    }).join('')
    return /* html */`
        <details data-dimension="${dimension}">
          <summary>${dimension.toUpperCase()}</summary>
          <div class="storybook-categories">${categories}</div>
        </details>`
  }).join('')
  const address = `#${kind.id}/${current.id}`
  for (const link of list.querySelectorAll('a')) {
    const selected = link.getAttribute('href') === address
    if (selected && link.getAttribute('aria-current') !== 'true') link.closest('details').open = true
    link.setAttribute('aria-current', String(selected))
  }
}

/**
 * One button for each of `names`, which set the block to that state, with the buttons `before` a name in front of it,
 * and any `more` buttons after them.
 */
const stateButtons = (legend, names, more = '', before = {}) => /* html */`
  <fieldset>
    <legend>${legend}</legend>
    ${names.map(name => `${before[name] ?? ''}<button data-state="${name}">${name}</button>`).join('')}
    ${more}
  </fieldset>`

/** Makes the story anew; most often wanted after a block has died. */
const resetButton = '<button data-again>Reset</button>'

/** A tenth of its health off a block that can be hit, to show it damaged after a few. */
const hitShare = .1
const canBeHit = block => Boolean(block.health?.maximum && block.takeHit)
const hitButton = block => canBeHit(block) ? '<button data-hit>Pogođen</button>' : ''
/** A bar of the health a block has left. */
const healthBar = ({ health }) => /* html */`
  <label class="storybook-health">Zdravlje <progress data-health max="${health.maximum}" value="${health.current}"></progress></label>`

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
  // a hit stands before death, or before Reset in a block that cannot die
  const hit = hitButton(block), dies = block.states?.includes('dead')
  panel.innerHTML = /* html */`
    <h2>${story.name}</h2>
    <p>${story.game}</p>
    ${story.looks ? lookButtons(kind, story, look) : ''}
    ${'way' in story ? sideButtons() : ''}
    ${block.states ? stateButtons('Stanja', block.states, (dies ? '' : hit) + resetButton, { dead: hit }) : hit + resetButton}
    ${block.anim ? stateButtons('Animacije', Object.keys(block.anim.actions)) : ''}
    ${block.acts?.length ? actButtons(block.acts) : ''}
    ${story.commands ? `<fieldset><legend>Proba</legend>${story.commands.map(({ label }, index) =>
    `<button data-command="${index}">${label}</button>`).join('')}</fieldset>` : ''}
    ${block.shots ? /* html */`
      <fieldset>
        <legend>Pucanje</legend>
        ${shotButtons(block)}
      </fieldset>` : ''}
    <button data-follow aria-pressed="${Boolean(stage.followed)}">Prati kamerom</button>
    ${canBeHit(block) ? healthBar(block) : ''}
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
    way = shown.story.way ?? 1
    return show()
  }
  const { block, stage } = shown
  if ('command' in button.dataset) return shown.story.commands[Number(button.dataset.command)].run(block, stage)
  if ('hit' in button.dataset) return block.takeHit(block.health.maximum * hitShare)
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
  if (event.isTrusted && stage instanceof Stage2D) stage.sceneAudio.unlock().catch(() => {})
  if (state && state === attackState(block)) {
    const primary = block.shots?.straight ? 'straight' : block.shots?.down ? 'down' : null
    if (primary) aim(block, primary)
  }
  if (state) block.setState(state)
  if (act) block.act(act)
  const { shot } = button.dataset
  if (!shot) return
  aim(block, shot)
  // a gun that fires on its own once aimed, as an observer's, is only aimed, so the block's other guns keep quiet
  if (!block.shots[shot].automatic) block.setState(attackState(block))
})

// the current state and health are the block's own news, read each frame without redrawing the buttons under the pointer
const markBlock = () => {
  for (const button of panel.querySelectorAll('[data-state]'))
    button.setAttribute('aria-pressed', String(button.dataset.state === shown?.block.state))
  const health = panel.querySelector('[data-health]')
  if (health && shown) health.value = shown.block.health.current
  requestAnimationFrame(markBlock)
}

window.addEventListener('hashchange', show)
show()
markBlock()
