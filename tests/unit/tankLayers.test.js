import { test } from 'node:test'
import assert from 'node:assert/strict'
import CombatLayers from '/scenes/to-trieste/CombatLayers.js'
import Renderer2D from '/core/Renderer2D.js'

const sprite = (name, z = 0) => ({
  name, polozaj: { z }, predmeti: [], prikazan: true, slika: { name }, ishodiste: 'CENTAR',
})

test('the renderer draws a burning tank and barrel before its flame, with scenery behind combat', () => {
  const draws = []
  const sceneRenderer = Renderer2D.instance
  Renderer2D.instance = null
  const ctx = { save() {}, restore() {}, translate() {}, rotate() {}, scale() {},
    drawImage(image) { draws.push(image.name) } }
  const renderer = new Renderer2D({ canvas: { getContext: () => ctx } })
  try {
    const building = sprite('building')
    const tank = sprite('body')
    tank.cev = sprite('barrel')
    tank.predmeti.push(tank.cev)
    tank.zapaljen = true
    tank.plamen = { render: () => draws.push('fire') }
    tank.granate = { projectiles: [] }
    const layers = new CombatLayers([tank])
    // Shots created after initialization must receive the same ordering.
    const shot = sprite('shot'), explosion = sprite('explosion')
    shot.predmeti.push(explosion)
    tank.granate.projectiles.push(shot)
    tank.predmeti.push(shot)
    layers.update()
    renderer.crtaPredmete([tank, building])
    assert.ok(draws.indexOf('building') < draws.indexOf('body'))
    assert.ok(draws.indexOf('body') < draws.indexOf('barrel'))
    assert.ok(draws.indexOf('barrel') < draws.indexOf('shot'))
    assert.ok(draws.indexOf('shot') < draws.indexOf('explosion'))
    assert.ok(draws.indexOf('barrel') < draws.indexOf('fire'))
    assert.equal(draws.filter(name => name === 'fire').length, 1)
    draws.length = 0
    tank.prikazan = false
    tank.flameLayer.render()
    assert.deepEqual(draws, [], 'hidden units have no visible flame')
    const legacy = sprite('legacy')
    legacy.zapaljen = true
    legacy.plamen = { render: () => draws.push('legacy-fire') }
    renderer.crtaPredmet(legacy)
    assert.ok(draws.includes('legacy-fire'), 'other scenes keep inline flames')
  } finally {
    Renderer2D.instance = sceneRenderer
  }
})
