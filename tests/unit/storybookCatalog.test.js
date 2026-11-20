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
function staged(t, story) {
  const stage = new Stage2D()
  stage.clear = stage.render = () => {}
  t.after(() => stage.end())
  const block = story.create(stage)
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

test('every story puts its block on the stage, which lives and ends without error', t => {
  for (const { story } of stories2D()) {
    const { stage, block, live } = staged(t, story)
    assert.ok(stage.children.includes(block), story.id)
    for (const state of block.states ?? []) {
      block.setState(state)
      live(.5)
    }
  }
})

/** Whether a block has let off a round: from a pool of bullets or shells, or its one flak shell. */
const fired = block => (block.bullets ?? block.granate ?? block.projectiles)?.projectiles.length > 0 || block.shell?.visible

test('every block fires each shot it lists, where it aims', t => {
  for (const { story } of stories2D()) {
    const { block } = staged(t, story)
    for (const name of Object.keys(block.shots ?? {})) {
      const { block: shooter, live } = staged(t, story)
      const shot = shooter.shots[name]
      shooter.aimAt({ x: shooter.x + shooter.forward * shot.x, y: shooter.y + shot.y })
      shooter.setState('fire')
      // a first shot waits up to a whole reload, and the barrel turns first
      assert.ok(live(5, () => fired(shooter)), `${story.id} ${name}`)
    }
  }
})
