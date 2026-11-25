import { before, test } from 'node:test'
import assert from 'node:assert/strict'
import { cameraAt, duration, soldierAt, soldiers, tanks } from '/scenes/bitka/Battle.js'
import { promoAt, promoDuration } from '/scenes/bitka/PromoTimeline.js'
import art from '/core/actor/advanceArt.js'
import { createPageElements } from './helpers/dom.js'

let BattleView
before(async() => {
  createPageElements()
  ;({ default: BattleView } = await import('/scenes/bitka/BattleView.js'))
})

test('the extended march ends in a four-second brand hold and fades through black before looping', () => {
  assert.equal(duration, 18)
  assert.equal(promoDuration, 24)
  assert.equal(promoAt(10).showBattle, true, 'the earlier 8.65-second loop no longer restarts')
  assert.equal(promoAt(10).battleTime, 10)
  assert.equal(promoAt(18).logoOpacity, 0)
  assert.ok(Math.abs(promoAt(18.6).logoOpacity - .5) < 1e-10)
  for (const time of [19.2, 20, 23.2]) {
    assert.equal(promoAt(time).logoOpacity, 1)
    assert.equal(promoAt(time).showBattle, false)
    assert.equal(promoAt(time).fade, 0)
  }
  assert.ok(promoAt(23.99).fade > .99)
  assert.equal(promoAt(24).fade, 1)
  assert.deepEqual(promoAt(24), promoAt(0))
  assert.deepEqual(promoAt(43.8), promoAt(19.8))
  assert.equal(promoAt(20).battleTime, duration, 'the battle does not run unseen behind the logo')
})

test('extended camera motion and actors stay finite as the camera passes through the advancing ranks', () => {
  for (let step = 0; step <= duration * 60; step++) {
    const time = step / 60
    const camera = cameraAt(time)
    assert.ok(camera.every(Number.isFinite))
    assert.ok(camera[1] > 0)
    if (step) {
      const previous = cameraAt(time - 1 / 60)
      assert.ok(Math.hypot(...camera.map((value, i) => value - previous[i])) < .1, 'no camera jump at added keys')
    }
    for (const soldier of soldiers) {
      const pose = soldierAt(soldier, time)
      assert.ok(Number.isFinite(pose.x) && Number.isFinite(pose.poseTime))
    }
  }
  assert.ok(cameraAt(18)[2] > cameraAt(8.65)[2] + 9, 'the camera passes successive ranks instead of pulling back across empty grass')
})

test('the actual view fades the battle into the wordmark in landscape and portrait frames', () => {
  for (const [canvasWidth, canvasHeight] of [[960, 540], [360, 800]]) {
    const text = [], transforms = [], battles = []
    const context = {
      canvas: { width: canvasWidth, height: canvasHeight },
      createRadialGradient: () => ({ addColorStop() {} }),
      save() {}, restore() {}, beginPath() {}, rect() {}, clip() {}, fillRect() {},
      moveTo() {}, lineTo() {}, closePath() {}, fill() {},
      setTransform: (...values) => transforms.push(values),
      fillText(value, x, y) {
        text.push({ value, x, y, alpha: this.globalAlpha, font: this.font })
      },
    }
    const view = new BattleView({ getContext: () => context })
    view.meadow = {}
    view.drawBattle = time => battles.push(time)
    view.render(12)
    assert.deepEqual(battles, [12])
    assert.equal(text.length, 0)
    view.render(18.6)
    assert.equal(battles.at(-1), 18)
    assert.deepEqual(text.map(item => item.value), ['Partisan', 'Games'])
    assert.ok(text.every(item => Math.abs(item.alpha - .5) < 1e-10))
    battles.length = text.length = 0
    view.render(20)
    assert.equal(battles.length, 0, 'no hidden terrain or actor rendering during the end card')
    assert.ok(text.every(item => item.alpha === 1 && item.x === 240 && item.y > 0 && item.y < 270))
    const scale = Math.min(canvasWidth / 480, canvasHeight / 270)
    assert.deepEqual(transforms.at(-1), [scale, 0, 0, scale, (canvasWidth - 480 * scale) / 2, (canvasHeight - 270 * scale) / 2])
    const held = [...text]
    text.length = 0
    view.render(20)
    assert.deepEqual(text, held, 'redrawing a paused frame does not advance the promo')
    text.length = 0
    view.render(24)
    assert.equal(text.length, 0, 'the next loop begins with the march, not a stale wordmark')
  }
})

test('three small tank groups keep the middle and closing shots occupied', () => {
  const draws = []
  const context = { canvas: { width: 480, height: 270 }, createRadialGradient: () => ({ addColorStop() {} }),
    beginPath() {}, ellipse() {}, fill() {} }
  const view = new BattleView({ getContext: () => context })
  view.meadow = { draw() {}, drawTufts() {} }
  view.sprites = Object.fromEntries(['rifleman', 'gunner', 'backpack', 'officer', 'tank'].map(kind => [kind, {
    height: kind === 'tank' ? 2.27 : 1.72,
    worldWidth: art[kind].width * (kind === 'tank' ? 2.27 : 1.72) / art[kind].standingPixels,
    sheet: { art: art[kind] },
    draw: (_ctx, pose) => draws.push({ ...pose, kind }), drawShot() {},
  }]))
  assert.equal(soldiers.length, 9)
  assert.equal(tanks.length, 3)
  assert.equal(new Set(soldiers.map(unit => unit.kind)).size, 4)
  for (const tank of tanks) assert.equal(soldiers.filter(unit => unit.group === tank.group).length, 3)
  for (let time = 8; time <= 18; time += .25) {
    draws.length = 0
    view.drawBattle(time, 1)
    const infantry = draws.filter(pose => pose.kind !== 'tank' && pose.x > 12 && pose.x < 468
      && pose.y - 1.72 * pose.scale < 260 && pose.y > 166)
    assert.ok(infantry.length >= 2, `the frame contains accompanying infantry at ${time}s`)
    assert.ok(infantry.filter(pose => pose.x > 120 && pose.x < 360).length >= 1, `the centre is occupied at ${time}s`)
    assert.ok(draws.some(pose => pose.kind === 'tank'), `a tank is in frame at ${time}s`)
    assert.ok(draws.every((pose, i) => !i || pose.scale >= draws[i - 1].scale), 'near soldiers occlude distant ranks')
  }
})
