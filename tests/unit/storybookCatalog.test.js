import { test, before } from 'node:test'
import assert from 'node:assert/strict'
import { createPageElements } from './helpers/dom.js'

let Stage2D, kinds

before(async() => {
  createPageElements()
  ;({ default: Stage2D } = await import('/storybook/Stage2D.js'))
  ;({ default: kinds } = await import('/storybook/stories/index.js'))
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
    const body = new Character({ ...story.block.description.body, actions: { attack: .5 } })
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
      shooter.setState('fire')
      // a first shot waits up to a whole reload, and the barrel turns first
      assert.ok(live(5, () => fired(shooter)), `${story.id} ${name}`)
    }
  }
})

test('every setting a story names is a number or yes/no its block exports', async() => {
  for (const { story } of stories().filter(({ story }) => story.settings))
    for (const path of story.settings) {
      const value = path.split('.').reduce((object, key) => object?.[key], story.block)
      assert.ok(['number', 'boolean'].includes(typeof value), `${story.id}: ${path}`)
    }

})
