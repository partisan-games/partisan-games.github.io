import { test } from 'node:test'
import assert from 'node:assert/strict'

test('the crosshair is centred on the screen, where the shots go, however long the player has been moving', async t => {
  const { default: FPSRenderer } = await import('/core3d/actor/FPSRenderer.js')
  const renderer = new FPSRenderer({ weaponSrc: null })
  t.after(() => renderer.remove())
  const drawn = []
  Object.defineProperty(renderer, 'ctx', { value: { clearRect() {}, drawImage: (img, x, y) => drawn.push([x, y]) } })
  renderer.targetImg = { complete: true, naturalWidth: 32, width: 32, height: 32 }

  renderer.render(0)
  renderer.render(1.3)

  const centre = [(window.innerWidth - 32) / 2, (window.innerHeight - 32) / 2]
  assert.deepEqual(drawn, [centre, centre])
})

test('a hit marks the way it came from at the edge of the screen, and the mark fades', async t => {
  const { default: FirstPersonView } = await import('/core3d/actor/characters/FirstPersonView.js')
  const { default: Character } = await import('/core/gameplay/bodies/characters/Character.js')
  const { PerspectiveCamera } = await import('three')
  const player = new Character({ x: 0, z: 0, yaw: 0 })
  const view = new FirstPersonView(player, { camera: new PerspectiveCamera(), weaponSrc: null })
  t.after(() => view.end())
  const arcs = []
  t.mock.method(view.renderer, 'render', () => {})
  t.mock.method(view.renderer, 'drawPain', () => {})
  t.mock.method(view.renderer, 'drawHitFrom', (angle, strength) => arcs.push({ angle, strength }))
  const shooter = (x, z) => {
    const body = new Character({ x, z })
    player.takeHit(1, body)
    view.update(.1)
    return arcs.at(-1).angle
  }
  assert.ok(Math.abs(shooter(10, 0) + Math.PI / 2) < 1e-9, 'one ahead marks the top')
  assert.ok(Math.abs(Math.abs(shooter(0, -10)) - Math.PI) < 1e-9, 'one on the left marks the left, as its right is +z')
  assert.ok(Math.abs(shooter(-10, 0) - Math.PI / 2) < 1e-9, 'one behind marks the bottom')
  arcs.length = 0
  view.update(1)
  assert.equal(arcs.length, 3, 'each shooter keeps his mark for a while')
  assert.ok(arcs.every(({ strength }) => strength < 1))
  arcs.length = 0
  view.update(1)
  assert.equal(arcs.length, 0, 'then they fade away')
})

test('a blow tells its target who struck it', async() => {
  const { default: Character } = await import('/core/gameplay/bodies/characters/Character.js')
  const target = new Character({ x: 1, health: 1000 })
  const striker = new Character({ targets: [target], reach: 3, actions: { attack: .1 } })
  striker.attack()
  for (let i = 0; i < 10; i++) striker.update(1 / 30)
  assert.equal(target.hitBy, striker)
})
