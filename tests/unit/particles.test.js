import { test, before } from 'node:test'
import assert from 'node:assert/strict'
import { createPageElements } from './helpers/dom.js'

let Scena, Particles

before(async() => {
  createPageElements()
  Scena = (await import('/core/Scena.js')).default
  Particles = await import('/core3d/Particles.js')
})

const positions = particles => [...particles.mesh.geometry.attributes.position.array]

for (const name of ['Stars', 'Snow', 'Smoke'])
  test(`${name} in the scene move through the scene update just as when updated directly`, t => {
    // the same random numbers make both sets of particles alike, also their speeds picked on the first update
    t.mock.method(Math, 'random', () => .3)
    const inScene = new Particles[name](), alone = new Particles[name]()
    const scene = new Scena({ canvas: document.createElement('canvas') })
    scene.add(inScene)
    const before = positions(inScene)

    for (let i = 0; i < 30; i++) {
      scene.update(1 / 60, i / 60)
      alone.update(1 / 60, i / 60)
    }

    assert.notDeepEqual(positions(inScene), before)
    assert.deepEqual(positions(inScene), positions(alone))
    scene.end()
  })
