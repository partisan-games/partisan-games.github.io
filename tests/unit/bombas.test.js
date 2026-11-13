import { test, before } from 'node:test'
import assert from 'node:assert/strict'
import { createPageElements } from './helpers/dom.js'

let Bombas

before(async() => {
  createPageElements()
  Bombas = (await import('/core/actor/derived/Bombas.js')).default
})

test('walking phase follows speed without restarting when speed changes', () => {
  const player = new Bombas()
  try {
    const { sprite } = player
    Object.defineProperties(sprite.slika, {
      naturalWidth: { value: 528 }, naturalHeight: { value: 144 },
    })
    sprite.onload()
    sprite.kretanje = true
    sprite.brzinaHoda = 60
    sprite.update(.1)
    assert.equal(sprite.protekloAnimacije, .0375)
    sprite.brzinaHoda = 120
    sprite.update(.1)
    assert.ok(Math.abs(sprite.protekloAnimacije - .1125) < 1e-10)
    assert.equal(sprite.animacija.sirina, 66)
    assert.equal(sprite.animacija.visina, 72)
    sprite.reset()
    sprite.brzinaHoda = 192
    sprite.update(1)
    const stepsPerSecond = sprite.protekloAnimacije / sprite.vremeAnimacije * 2
    assert.ok(Math.abs(stepsPerSecond - 3) < 1e-10)
  } finally {
    player.end()
  }
})

test('idle switches to walking during input and coasting, returns after stopping and freezes on death', () => {
  const player = new Bombas({ x: 200, y: 200 })
  Object.defineProperties(player.sprite.slika, {
    naturalWidth: { value: 528 }, naturalHeight: { value: 144 },
  })
  player.sprite.onload()
  try {
    const step = dt => {
      player.update(dt)
      player.sprite.update(dt)
    }
    step(.8)
    assert.equal(player.sprite.protekloAnimacije, .8)
    assert.equal(player.sprite.animacija.ime, 'idle')
    assert.equal(player.sprite.polozaj, player.polozaj)
    assert.deepEqual([player.sirina, player.visina], [66, 72])

    document.dispatchEvent(new KeyboardEvent('keydown', { code: 'ArrowRight' }))
    player.handleInput(.03)
    step(.1)
    assert.equal(player.sprite.animacija.ime, 'kretanje')
    assert.equal(player.sprite.animacija.pocetniKadar, 8)
    assert.equal(player.sprite.animacija.brojKadrova, 8)
    assert.equal(player.sprite.animacija.visina, 72)
    const movingPhase = player.sprite.protekloAnimacije
    assert.ok(movingPhase > 0)
    document.dispatchEvent(new KeyboardEvent('keyup', { code: 'ArrowRight' }))

    player.dx = 20
    step(.1)
    assert.equal(player.sprite.animacija.ime, 'kretanje')
    assert.ok(player.sprite.protekloAnimacije > movingPhase)
    player.stani()
    step(.1)
    assert.equal(player.sprite.protekloAnimacije, .1)
    assert.equal(player.sprite.animacija.ime, 'idle')

    player.umri()
    step(.1)
    assert.equal(player.sprite.protekloAnimacije, 0)
    player.sakrij()
    step(.1)
    assert.equal(player.sprite.vidljiv, false)
  } finally {
    document.dispatchEvent(new KeyboardEvent('keyup', { code: 'ArrowRight' }))
    player.end()
  }
})
