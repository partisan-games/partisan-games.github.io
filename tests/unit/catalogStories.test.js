import { test, before } from 'node:test'
import assert from 'node:assert/strict'
import { createPageElements } from './helpers/dom.js'

let Stage2D, kinds

before(async() => {
  createPageElements()
  ;({ default: Stage2D } = await import('/catalog/Stage2D.js'))
  ;({ default: kinds } = await import('/catalog/stories/index.js'))
})

const stories = () => kinds.flatMap(kind => kind.stories.map(story => ({ kind, story })))

/** The stories on the 2D stage; a 3D one needs a graphics card and loaded models, so the browser check opens it. */
const stories2D = () => stories().filter(({ story }) => !story.stage)

/** A story on a stage that lives its frames one by one, drawing nothing: happy-dom has no canvas. */
function staged(t, story, look = story.looks?.[0]) {
  const stage = new Stage2D({ pxPerMeter: story.pxPerMeter })
  stage.clear = stage.render = () => {}
  t.after(() => stage.end())
  const block = story.create(stage, story.way, look?.value)
  stage.session.start()
  /** Lives `seconds`, or less once `until()` holds, and gives whether it did. */
  const live = (seconds, until = () => false) => {
    for (let i = 0; i < seconds * 30 && !until(); i++) stage.loop(1 / 30, 0)
    return until()
  }
  return { stage, block, live }
}

test('the side-view Chetniks start an attack, resume the selected motion and stay down after falling', async t => {
  const { soldiers } = await import('/catalog/stories/cetnici.js')
  const { groupOf } = await import('/catalog/catalog.js')
  const kind = kinds.find(({ id }) => id === 'vojnici')
  assert.equal(soldiers.length, 3)
  for (const story of soldiers) {
    assert.ok(kind.stories.includes(story))
    assert.deepEqual(groupOf(kind, story), ['Vojnici', 'Četnici'])
    const { block, live } = staged(t, story)
    const [sheet, flash] = block.children
    const shots = t.mock.method(block.sounds[0], 'play', () => {})
    assert.deepEqual(block.states, ['idle', 'move', 'attack', 'dead'])
    const boxes = []
    Object.defineProperty(sheet.image, 'naturalWidth', { value: 1 })
    block.render({
      save() {}, translate() {}, scale() {}, restore() {},
      drawImage(...args) {
        boxes.push(args)
      },
    })
    assert.equal(boxes[0][8] * sheet.art.standingPixels / sheet.art.height, 72)

    block.setState('move')
    block.setState('attack')
    assert.ok(live(1, () => flash.visible))
    assert.equal(shots.mock.callCount(), 1)
    assert.ok(live(2, () => block.state === 'move'))
    const expectedRecordings = story.id === 'cetnik-mitraljezac' ? 3 : 1
    assert.equal(shots.mock.callCount(), expectedRecordings)
    block.setState('attack')
    block.setState('dead')
    live(2)
    assert.deepEqual(sheet.sample(block.state, block.stateTime), { row: 3, frame: 3 })
    assert.equal(shots.mock.callCount(), expectedRecordings)
    block.setState('idle')
    assert.equal(block.state, 'dead')
    assert.equal(staged(t, story).block.state, 'idle')
  }
})

test('the Chetnik machine gunner sustains a burst with repeated flashes and cuts it short when he falls', async t => {
  const { soldiers } = await import('/catalog/stories/cetnici.js')
  const story = soldiers.find(({ id }) => id === 'cetnik-mitraljezac')
  const { block, live } = staged(t, story)
  const [, flash] = block.children
  const flashes = t.mock.method(flash, 'start')
  const shots = t.mock.method(block.sounds[0], 'play', () => {})
  const stop = t.mock.method(block.sounds[0], 'stop')
  block.setState('attack')
  live(1.5)
  assert.equal(block.state, 'attack')
  assert.ok(flashes.mock.callCount() > 10)
  assert.ok(live(1, () => block.state === 'idle'))
  assert.equal(flashes.mock.callCount(), 15)
  assert.equal(shots.mock.callCount(), 3)
  assert.equal(stop.mock.callCount(), 0)

  block.setState('attack')
  assert.ok(live(.5, () => flash.visible))
  block.setState('dead')
  assert.equal(flash.visible, false)
  assert.equal(stop.mock.callCount(), 1)
  live(2)
  assert.equal(flashes.mock.callCount(), 16)
  assert.equal(shots.mock.callCount(), 4)
})

test('every story has its own address and names its game', () => {
  const addresses = stories().map(({ kind, story }) => `${kind.id}/${story.id}`)
  assert.equal(new Set(addresses).size, addresses.length)
  for (const { story } of stories()) assert.ok(story.name && story.game, story.id)
})

test('every story puts its block on the stage in each of its looks, which lives and ends without error', t => {
  for (const { story } of stories2D()) for (const look of story.looks ?? [undefined]) {
    const { stage, block, live } = staged(t, story, look)
    assert.ok(stage.children.includes(block), story.id)
    for (const state of block.states ?? []) {
      block.setState(state)
      live(.5)
    }
  }
})

test('every 3D character story with a description has a body that lives each of its states without a page', async() => {
  const { default: Character } = await import('/core/gameplay/bodies/characters/Character.js')
  const described = stories().filter(({ story }) => story.block.description)
  assert.ok(described.length > 0)
  for (const { story } of described) {
    const { animDict = {}, body: settings } = story.block.description
    const actions = Object.fromEntries(['attack', 'attack2', 'special', 'jump', 'pain'].filter(name => animDict[name]).map(name => [name, .5]))
    const body = new Character({ actions, ...settings })
    for (const state of body.states) {
      body.setState(state)
      for (let i = 0; i < 15; i++) body.update(1 / 30)
      assert.ok(Number.isFinite(body.x + body.y + body.z), story.id)
    }
  }
})

/** Whether a block has let off a round: its count of shots, a pool of bullets or shells, its one flak shell or its one bomb. */
const fired = block => block.shotsFired > 0 || (block.bullets ?? block.granate ?? block.projectiles)?.projectiles.length > 0 ||
  block.shell?.visible || block.bomb?.visible

test('every block fires each shot it lists, where it aims', t => {
  for (const { story } of stories2D()) {
    const { block } = staged(t, story)
    for (const name of Object.keys(block.shots ?? {})) {
      const { block: shooter, live } = staged(t, story)
      const shot = shooter.shots[name]
      shooter.aimAt({ x: shooter.x + shooter.forward * shot.x, y: shooter.y + shot.y, z: (shooter.z ?? 0) + (shot.z ?? 0) })
      if (!shot.automatic) shooter.setState('attack')
      // a first shot waits up to a whole reload, and the barrel turns first
      assert.ok(live(5, () => fired(shooter)), `${story.id} ${name}`)
    }
  }
})

