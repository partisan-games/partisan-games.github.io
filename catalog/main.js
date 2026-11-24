import { createCatalog, dimensionOf, findStory } from './catalog.js'
import Stage2D from './Stage2D.js'
import { attackControls } from './attackControls.js'
import { createStoryDetails } from './storyDetails.js'
import { blockStats } from './blockStats.js'
import kinds from './stories/index.js'

const list = document.getElementById('catalog-list')
const panel = document.getElementById('catalog-panel')

/** What each shot a block can take is called on its button, in the order the buttons stand, the higher above. */
const shotNames = { up: 'Pucaj gore', straight: 'Pucaj pravo', down: 'Obruši se', drop: 'Baci bombe', behind: 'Pucaj unazad' }

const catalog = createCatalog(list, kinds)
const find = address => findStory(kinds, address)

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
  const { kind, story, look } = find(location.hash.slice(1))
  const address = `${kind.id}/${story.id}${look ? '/' + look.id : ''}`
  if (location.hash.slice(1) !== address) history.replaceState(null, '', '#' + address)
  if (previous?.story === story && previous.look !== look && previous.stage.setLook) {
    previous.stage.setLook(look?.value)
    previous.look = look
    drawPanel()
    return
  }
  shown = null
  previous?.stage.end()
  if (story !== previous?.story) way = story.way ?? 1
  catalog.select(kind, story)
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
  <label class="catalog-health">Zdravlje <progress data-health max="${health.maximum}" value="${health.current}"></progress></label>`

/** One button for each of a character's actions, which it does once. */
const actButtons = names => /* html */`
  <fieldset>
    <legend>Radnje</legend>
    ${names.map(name => `<button data-act="${name}">${name}</button>`).join('')}
  </fieldset>`

/** The looks of a block drawn in several ways, as the markings of a plane, the one shown pressed; each has an address. */
const lookButtons = (kind, story, current) => /* html */`
  <fieldset>
    <legend>${story.lookLabel ?? 'Izgled'}</legend>
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
const shotButtons = shots => Object.keys(shotNames)
  .filter(name => shots.includes(name))
  .map(name => `<button class="catalog-shot" data-shot="${name}">${shotNames[name]}</button>`)
  .join('')

function drawPanel() {
  const { kind, story, look, block, stage } = shown
  const controls = attackControls(block)
  // a hit stands before death, or before Reset in a block that cannot die
  const hit = hitButton(block), dies = block.states?.includes('dead')
  panel.innerHTML = /* html */`
    <div class="catalog-heading">
      <h2>${story.name}</h2>
      <button data-zoom="1.25" aria-label="Približi">+</button><button data-zoom="0.8" aria-label="Udalji">−</button><button data-reset-view aria-label="Vrati početni pogled">1:1</button>
    </div>
    ${story.looks ? lookButtons(kind, story, look) : ''}
    ${'way' in story ? sideButtons() : ''}
    ${block.states ? stateButtons('Stanja', controls.states, (dies ? '' : hit) + resetButton, { dead: hit }) : hit + resetButton}
    ${controls.animations.length ? stateButtons('Animacije', controls.animations) : ''}
    ${controls.acts.length ? actButtons(controls.acts) : ''}
    ${story.commands ? `<fieldset><legend>Proba</legend>${story.commands.map(({ label }, index) =>
    `<button data-command="${index}">${label}</button>`).join('')}</fieldset>` : ''}
    ${controls.shots.length ? /* html */`
      <fieldset>
        <legend>Pucanje</legend>
        ${shotButtons(controls.shots)}
      </fieldset>` : ''}
    <button data-follow aria-pressed="${Boolean(stage.followed)}">Prati kamerom</button>
    ${canBeHit(block) ? healthBar(block) : ''}
    ${blockStats(block)}
  `
  const details = createStoryDetails(story)
  if (details.childElementCount) panel.querySelector('.catalog-heading').after(details)
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
  if ('zoom' in button.dataset) return stage.zoomBy(Number(button.dataset.zoom))
  if ('resetView' in button.dataset) return stage.resetView(block)
  if ('follow' in button.dataset) {
    stage.follow(stage.followed ? null : block)
    button.setAttribute('aria-pressed', String(Boolean(stage.followed)))
    return
  }
  const { state, act } = button.dataset
  // a block set to fire with no aim, as a gun, first aims at its straight shot, as its button would
  if (event.isTrusted && stage instanceof Stage2D) stage.sceneAudio.unlock().catch(() => {})
  if (state === 'attack') {
    const { primary } = attackControls(block)
    if (primary) aim(block, primary)
  }
  if (state) block.setState(state)
  if (act) block.act(act)
  const { shot } = button.dataset
  if (!shot) return
  aim(block, shot)
  // a gun that fires on its own once aimed, as an observer's, is only aimed, so the block's other guns keep quiet
  if (!block.shots[shot].automatic) block.setState('attack')
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
