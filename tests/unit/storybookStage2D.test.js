import { test, before } from 'node:test'
import assert from 'node:assert/strict'
import { createPageElements } from './helpers/dom.js'

let Stage2D, Rifleman, kinds

before(async() => {
  createPageElements()
  ;({ default: Stage2D } = await import('/storybook/Stage2D.js'))
  ;({ default: Rifleman } = await import('/scenes/franjo-kluz/Rifleman.js'))
  ;({ kinds } = await import('/scenes/franjo-kluz/enemies.js'))
})

/** The prototype that holds `addEventListener` for `target`: page objects need not share one. */
const listenerOwner = target => {
  let owner = target
  while (!Object.hasOwn(owner, 'addEventListener')) owner = Object.getPrototypeOf(owner)
  return owner
}

/** Whether `target` is the page itself or an element on it, not an image or a request in flight. */
const onPage = target => target === window || target === document || (target instanceof Element && document.contains(target))

/** How many listeners the page has gained since the count began; removing one never added changes nothing. */
function countListeners(t) {
  const live = new Set()
  const key = (target, [type, listener, options]) => [target, type, listener, Boolean(options?.capture ?? options)]
  const find = entry => [...live].find(other => other.every((part, i) => part === entry[i]))
  for (const owner of new Set([window, document, document.getElementById('platno')].map(listenerOwner))) {
    const { addEventListener, removeEventListener } = owner
    owner.addEventListener = function(...args) {
      if (onPage(this) && !find(key(this, args))) live.add(key(this, args))
      return addEventListener.apply(this, args)
    }
    owner.removeEventListener = function(...args) {
      live.delete(find(key(this, args)))
      return removeEventListener.apply(this, args)
    }
    t.after(() => Object.assign(owner, { addEventListener, removeEventListener }))
  }
  return () => live.size
}

function riflemanStage(t) {
  const stage = new Stage2D()
  const { target } = stage
  stage.clear = stage.render = () => {} // happy-dom draws nothing
  t.after(() => stage.end())
  const soldier = new Rifleman({ ...kinds.soldier, targets: [target], session: stage.session, camera: stage, groundY: stage.groundY, x: 500 })
  soldier.y = stage.groundY - soldier.height / 2
  stage.add(soldier)
  // frames are lived one by one here, not by the browser's animation loop
  stage.session.start()
  const live = seconds => {
    for (let i = 0; i < seconds * 30; i++) stage.loop(1 / 30, 0)
  }
  return { stage, target, soldier, live }
}

test('a stage removes every listener it adds to the page when it ends', t => {
  const live = countListeners(t)
  const { stage } = riflemanStage({ after() {} })
  const listening = live()
  stage.end()
  assert.ok(listening > 0, 'it listens to the page')
  assert.equal(live(), 0)
})

test('the target stands in for the player: a block aimed at it fires, and hits never destroy it', t => {
  const { target, soldier, live } = riflemanStage(t)
  const hit = t.mock.method(target, 'takeHit')
  assert.equal(soldier.aimAt(target), true)
  soldier.setState('fire')
  for (let i = 0; i < 5 * 30; i++) {
    live(1 / 30)
    for (const round of soldier.bullets.projectiles) round.width = round.height = 8 // the images do not load in tests
  }
  assert.ok(hit.mock.callCount() > 1, 'the rounds hit it again and again')
  assert.equal(target.alive, true)
})

test('the target stands still where the stage puts it, off the stage children, as the block moves', t => {
  const { stage, target, soldier } = riflemanStage(t)
  assert.equal(stage.children.includes(target), false, 'the story shows the block alone')
  assert.deepEqual([target.x, target.y], [stage.width / 2, stage.groundY - 300])
  soldier.x += 50
  stage.update(1 / 30, 0)
  assert.deepEqual([target.x, target.y], [stage.width / 2, stage.groundY - 300])
})

test('the view follows a block while asked to, and stands where it is once let go', t => {
  const { stage, soldier } = riflemanStage(t)
  stage.follow(soldier)
  soldier.x = 3000
  stage.update(1 / 30, 0)
  assert.equal(stage.cameraX, 3000 - stage.width / 2)
  stage.follow()
  soldier.x = 5000
  stage.update(1 / 30, 0)
  assert.equal(stage.cameraX, 3000 - stage.width / 2)
})
