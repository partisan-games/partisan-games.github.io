import { test, before } from 'node:test'
import assert from 'node:assert/strict'
import { createPageElements } from './helpers/dom.js'

let Stage2D, Rifleman, riflemanKinds, RiflemanSprite, kinds

before(async() => {
  createPageElements()
  ;({ default: Stage2D } = await import('/catalog/Stage2D.js'))
  ;({ default: Rifleman, riflemanKinds } = await import('/core/gameplay/bodies/soldiers/Rifleman.js'))
  RiflemanSprite = (await import('/core/actor/soldiers/RiflemanSprite.js')).default
  ;({ groundUnitLooks: kinds } = await import('/core/actor/groundUnitLooks.js'))
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
  const { dummy: target } = stage
  stage.clear = stage.render = () => {} // happy-dom draws nothing
  t.after(() => stage.end())
  const soldier = new Rifleman({ kind: riflemanKinds.soldier, x: 20, y: 1.28, clock: stage.session.clock, targets: [target] })
  stage.add(soldier, new RiflemanSprite(soldier, { art: kinds.soldier.art, projection: stage.projection, camera: stage }))
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

test('the stand-in takes the place of the player: a block aimed at it fires, and hits never destroy it', t => {
  const { target, soldier, live } = riflemanStage(t)
  target.x = soldier.x + 10
  assert.equal(soldier.aimAt(target), true)
  soldier.setState('attack')
  live(5)
  assert.ok(target.hitsTaken > 1, 'the rounds hit it again and again')
  assert.equal(target.alive, true)
})

test('the stand-in stands still where the stage puts it, off the stage children, as the block moves', t => {
  const { stage, target, soldier } = riflemanStage(t)
  assert.equal(stage.children.includes(target), false, 'the story shows the block alone')
  const place = [target.x, target.y]
  soldier.x += 5
  stage.update(1 / 30, 0)
  assert.deepEqual([target.x, target.y], place)
})

test('the view follows a block while asked to, and stands where it is once let go', t => {
  const { stage, soldier } = riflemanStage(t)
  const { pxPerMeter } = stage.projection
  stage.follow(soldier)
  soldier.x = 100
  stage.update(1 / 30, 0)
  assert.equal(stage.cameraX, 100 * pxPerMeter - stage.width / 2)
  stage.follow()
  soldier.x = 200
  stage.update(1 / 30, 0)
  assert.equal(stage.cameraX, 100 * pxPerMeter - stage.width / 2)
})

test('the zoom buttons draw the blocks larger or smaller around the middle of the ground line, within bounds', t => {
  const stage = new Stage2D()
  stage.clear = () => {} // happy-dom draws nothing
  t.after(() => stage.end())
  const scales = []
  // the page of the tests has no drawing context
  stage.renderer.ctx = { save() {}, restore() {}, translate() {}, scale: (x, y) => scales.push([x, y]) }
  stage.zoomBy(1.25)
  stage.render()
  assert.deepEqual(scales.at(-1), [1.25, 1.25])
  for (let i = 0; i < 40; i++) stage.zoomBy(.8)
  assert.equal(stage.zoom, .25)
  for (let i = 0; i < 40; i++) stage.zoomBy(1.25)
  assert.equal(stage.zoom, 8)
})
