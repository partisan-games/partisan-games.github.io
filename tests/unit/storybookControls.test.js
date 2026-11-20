import { test, before, afterEach } from 'node:test'
import assert from 'node:assert/strict'
import { createPageElements } from './helpers/dom.js'

let controls, fighterModule, riflemanModule, Stage2D, kinds

before(async() => {
  createPageElements()
  controls = await import('/storybook/controls.js')
  fighterModule = await import('/core/actor/aircraft/Fighter.js')
  riflemanModule = await import('/core/actor/soldiers/Rifleman.js')
  ;({ default: Stage2D } = await import('/storybook/Stage2D.js'))
  ;({ default: kinds } = await import('/storybook/stories/index.js'))
})

afterEach(() => controls.restore())

test('controls come from the settings objects a block exports, not from its class', () => {
  assert.deepEqual(controls.settingsOf(fighterModule).map(([name]) => name), ['fighter', 'wreckFall'])
  const html = controls.controlsHtml(fighterModule)
  assert.match(html, /data-setting="fighter.speed" min="0" max="1800"/, 'a slider to four times the first value')
})

test('a single constant, a list or an object with words gets no controls; a nested object and a yes/no do', () => {
  const module = { speed: 5, names: [1, 2], art: { image: 'a.png' }, gun: { aim: { lead: true, turn: 0 } } }
  assert.deepEqual(controls.settingsOf(module).map(([name]) => name), ['gun'])
  const html = controls.controlsHtml(module)
  assert.match(html, /type="checkbox" data-setting="gun.aim.lead" checked/)
  assert.match(html, /data-setting="gun.aim.turn" min="0" max="1"/, 'a first 0 runs to 1')
  controls.change(module, 'gun.aim.turn', .5)
  controls.restore()
  assert.equal(module.gun.aim.turn, 0)
})

test('a module without settings objects has no controls', async() => {
  assert.equal(controls.controlsHtml(await import('/scenes/ustanak/Zastavnik.js')), '')
})

test('a changed setting holds in the block made next, and restoring gives the first value back', t => {
  const story = kinds.flatMap(kind => kind.stories).find(({ id }) => id === 'strelac')
  const stage = new Stage2D()
  stage.clear = stage.render = () => {} // happy-dom has no canvas
  t.after(() => stage.end())
  controls.settingsOf(story.block)
  controls.change(story.block, 'rifle.reload', 5)
  assert.equal(story.create(stage).cooldown.seconds, 5)
  controls.restore()
  assert.equal(riflemanModule.rifle.reload, 2)
  assert.equal(story.create(stage).cooldown.seconds, 2)
})
