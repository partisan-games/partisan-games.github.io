import { test, before } from 'node:test'
import assert from 'node:assert/strict'
import { createPageElements } from './helpers/dom.js'

let Grenadier

before(async() => {
  createPageElements()
  Grenadier = (await import('/core/actor/derived/Grenadier.js')).default
})

test('walking phase follows speed without restarting when speed changes', () => {
  const player = new Grenadier()
  try {
    const { sprite } = player
    Object.defineProperties(sprite.image, {
      naturalWidth: { value: 528 }, naturalHeight: { value: 144 },
    })
    sprite.onload()
    sprite.movement = true
    sprite.walkSpeed = 60
    sprite.update(.1)
    assert.equal(sprite.animationElapsed, .0375)
    sprite.walkSpeed = 120
    sprite.update(.1)
    assert.ok(Math.abs(sprite.animationElapsed - .1125) < 1e-10)
    assert.equal(sprite.animation.width, 66)
    assert.equal(sprite.animation.height, 72)
    sprite.reset()
    sprite.walkSpeed = 192
    sprite.update(1)
    const stepsPerSecond = sprite.animationElapsed / sprite.animationTime * 2
    assert.ok(Math.abs(stepsPerSecond - 3) < 1e-10)
  } finally {
    player.end()
  }
})

test('walking briefly decelerates on input release, then returns to idle and freezes on death', () => {
  const player = new Grenadier({ x: 200, y: 200 })
  Object.defineProperties(player.sprite.image, {
    naturalWidth: { value: 528 }, naturalHeight: { value: 144 },
  })
  player.sprite.onload()
  try {
    const step = dt => {
      player.update(dt)
      player.sprite.update(dt)
    }
    step(.8)
    assert.equal(player.sprite.animationElapsed, .8)
    assert.equal(player.sprite.animation.name, 'idle')
    assert.equal(player.sprite.position, player.position)
    assert.deepEqual([player.width, player.height], [66, 72])

    document.dispatchEvent(new KeyboardEvent('keydown', { code: 'ArrowRight' }))
    player.handleInput(.03)
    step(.1)
    assert.equal(player.sprite.animation.name, 'kretanje')
    assert.equal(player.sprite.animation.startFrame, 8)
    assert.equal(player.sprite.animation.frameCount, 8)
    assert.equal(player.sprite.animation.height, 72)
    const movingPhase = player.sprite.animationElapsed
    assert.ok(movingPhase > 0)
    document.dispatchEvent(new KeyboardEvent('keyup', { code: 'ArrowRight' }))

    player.dx = 20
    step(.05)
    assert.ok(player.speed > 1)
    assert.equal(player.sprite.animation.name, 'kretanje')
    const decelerationAdvance = player.sprite.animationElapsed - movingPhase
    assert.ok(decelerationAdvance > 0)
    assert.ok(decelerationAdvance < .05 * player.speed / 160)
    step(.11)
    assert.equal(player.sprite.animation.name, 'idle')
    assert.equal(player.sprite.animationElapsed, .11)
    player.stop()
    step(.1)
    assert.ok(Math.abs(player.sprite.animationElapsed - .21) < 1e-10)
    assert.equal(player.sprite.animation.name, 'idle')

    player.die()
    step(.1)
    assert.equal(player.sprite.animationElapsed, 0)
    player.hide()
    step(.1)
    assert.equal(player.sprite.visible, false)
  } finally {
    document.dispatchEvent(new KeyboardEvent('keyup', { code: 'ArrowRight' }))
    player.end()
  }
})
