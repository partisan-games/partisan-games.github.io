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

/** A story on a stage that lives its frames one by one, drawing nothing: happy-dom has no canvas. */
function staged(t, story) {
  const stage = new Stage2D()
  stage.clear = stage.render = () => {}
  t.after(() => stage.end())
  const block = story.create(stage)
  stage.session.start()
  const live = seconds => {
    for (let i = 0; i < seconds * 30; i++) stage.loop(1 / 30, 0)
  }
  return { stage, block, live }
}

test('every story has its own address and names its game', () => {
  const addresses = stories().map(({ kind, story }) => `${kind.id}/${story.id}`)
  assert.equal(new Set(addresses).size, addresses.length)
  for (const { story } of stories()) assert.ok(story.name && story.game, story.id)
})

test('every story puts its block on the stage, which lives and ends without error', t => {
  for (const { story } of stories()) {
    const { stage, block, live } = staged(t, story)
    assert.ok(stage.children.includes(block), story.id)
    for (const state of block.states ?? []) {
      block.setState(state)
      live(.5)
    }
  }
})

test('every block fires each shot it lists, where it aims', t => {
  for (const { story } of stories()) {
    const { block } = staged(t, story)
    for (const name of Object.keys(block.shots ?? {})) {
      const { block: shooter, live } = staged(t, story)
      const shot = shooter.shots[name]
      shooter.aimAt({ x: shooter.x + shooter.forward * shot.x, y: shooter.y + shot.y })
      shooter.setState('fire')
      live(3)
      const rounds = shooter.bullets ?? shooter.granate
      assert.ok(rounds.projectiles.length > 0, `${story.id} ${name}`)
    }
  }
})
