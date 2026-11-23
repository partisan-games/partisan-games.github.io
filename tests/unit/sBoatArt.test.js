import { before, test } from 'node:test'
import assert from 'node:assert/strict'
import { createPageElements } from './helpers/dom.js'
import { loadAtlas } from './helpers/atlas.js'
import GameClock from '/core/runtime/GameClock.js'

let SBoat, SBoatSprite, topProjection, art, Shore, ShoreView, shoreArt
before(async() => {
  createPageElements()
  ;({ default: SBoat } = await import('/core/gameplay/bodies/boats/SBoat.js'))
  ;({ default: SBoatSprite } = await import('/core/actor/boats/SBoatSprite.js'))
  ;({ topProjection } = await import('/core/actor/projection.js'))
  ;({ default: art } = await import('/core/actor/boats/sBoatArt.js'))
  ;({ default: Shore } = await import('/core/gameplay/bodies/artillery/ShoreMachineGun.js'))
  ;({ default: ShoreView } = await import('/core/actor/artillery/ShoreMachineGunSprite.js'))
  ;({ default: shoreArt } = await import('/core/actor/artillery/shoreNestArt.js'))
})

test('S-30 and shore MG art share their actual projectile mounting centers and barrel tips', () => {
  const projection = topProjection({ pxPerMeter: 25 })
  for (const [Body, View, descriptor, guns] of [[SBoat, SBoatSprite, art, 2], [Shore, ShoreView, shoreArt, 1]])
    for (const yaw of [0, .8, Math.PI]) {
      const body = new Body({ x: 12, z: 8, yaw, clock: new GameClock() })
      const view = new View(body, { projection })
      loadAtlas(view, 1024, 184)
      loadAtlas(view.gun, descriptor.gun.width, descriptor.gun.height)
      body.gunYaw = .7
      let matrix = [1, 0, 0, 1, 0, 0]
      const stack = [], points = []
      const ctx = {
        save() {
          stack.push([...matrix])
        }, restore() {
          matrix = stack.pop()
        },
        translate(x, y) {
          matrix[4] += matrix[0] * x + matrix[2] * y; matrix[5] += matrix[1] * x + matrix[3] * y
        },
        rotate(angle) {
          const [a, b, c, d] = matrix, cos = Math.cos(angle), sin = Math.sin(angle)
          matrix.splice(0, 4, a * cos + c * sin, b * cos + d * sin, c * cos - a * sin, d * cos - b * sin)
        },
        scale(x, y) {
          matrix[0] *= x; matrix[1] *= x; matrix[2] *= y; matrix[3] *= y
        },
        drawImage(image, sx, sy, sw, sh, dx, dy, width, height) {
          if (image !== view.gun.image) return
          const x = dx + (descriptor.gun.muzzle[0] - sx) / sw * width
          const y = dy + (descriptor.gun.muzzle[1] - sy) / sh * height
          points.push({ x: matrix[0] * x + matrix[2] * y + matrix[4], y: matrix[1] * x + matrix[3] * y + matrix[5] })
        },
      }
      view.render(ctx)
      assert.equal(points.length, guns)
      for (let index = 0; index < guns; index++) {
        body.gunIndex = index
        const muzzle = projection.point(body.muzzle)
        assert.ok(Math.hypot(points[index].x - muzzle.x, points[index].y - muzzle.y) < 1e-8)
      }
    }
})

test('S-30 renders two textured guns and keeps its damaged hull while sinking', () => {
  const body = new SBoat({ clock: new GameClock() })
  const view = new SBoatSprite(body, { projection: topProjection({ pxPerMeter: 25 }) })
  loadAtlas(view, 1024, 184)
  loadAtlas(view.gun, 64, 64)
  loadAtlas(view.damageArt, 1024, 184)
  Object.defineProperty(view.damageArt.image, 'complete', { value: true })
  const draws = []
  const ctx = { save() {}, restore() {}, translate() {}, rotate() {}, scale() {}, drawImage: (...args) => draws.push(args) }
  view.render(ctx)
  assert.equal(draws.length, 3)
  assert.equal(draws[1][0], view.gun.image)
  assert.equal(draws[2][0], view.gun.image)
  body.setState('dead')
  draws.length = 0
  view.render(ctx)
  assert.ok(draws[0][0] === view.damageArt.image, 'a sinking hull retains visible damage')
  body.update(20)
  draws.length = 0
  view.render(ctx)
  assert.equal(draws.length, 0)
})

test('a destroyed shore nest retains torn bags and both fallen crew poses', () => {
  const body = new Shore({ clock: new GameClock() })
  const view = new ShoreView(body, { projection: topProjection({ pxPerMeter: 25 }) })
  loadAtlas(view, 240, 96)
  loadAtlas(view.crew, 256, 80)
  loadAtlas(view.gun, 192, 96)
  loadAtlas(view.damageArt, 240, 96)
  Object.defineProperty(view.damageArt.image, 'complete', { value: true })
  const draws = []
  const ctx = { save() {}, restore() {}, translate() {}, rotate() {}, scale() {}, drawImage: (...args) => draws.push(args) }
  view.render(ctx)
  assert.ok(draws[0][0] === view.image)
  assert.deepEqual(draws.filter(d => d[0] === view.crew.image).map(d => d[1]), [0, 0])
  body.setState('dead')
  body.stateTime = 2
  draws.length = 0
  view.render(ctx)
  assert.ok(draws[0][0] === view.damageArt.image)
  assert.deepEqual(draws.filter(d => d[0] === view.crew.image).map(d => d[1]), [128, 128])
})
