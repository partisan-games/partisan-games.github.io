import { test, before } from 'node:test'
import assert from 'node:assert/strict'
import { createPageElements } from './helpers/dom.js'

let kinds, createCatalog, findStory, groupOf
before(async() => {
  createPageElements()
  ;({ default: kinds } = await import('/catalog/stories/index.js'))
  ;({ createCatalog, findStory, groupOf } = await import('/catalog/catalog.js'))
})

test('chetniks have their own army group, not the miscellaneous one', () => {
  const soldiers = kinds.find(({ id }) => id === 'vojnici')
  const chetnik = soldiers.stories.find(({ id }) => id === 'cetnik-u-rovu')
  assert.deepEqual(groupOf(soldiers, chetnik), ['Vojnici', 'Četnici'])
})

test('old model links resolve to separate actors instead of skins', () => {
  for (const [kind, story, selections] of [
    ['brodovi', 'nemacko-patrolno-plovilo', ['german-launch', 'german-skiff', 'german-patrol-vessel', 'rboot', 'mfp', 'vorpostenboot']],
    ['vozila', 'nemacki-tenk', ['tiger-i', 'm15-42', 'stug-iii', 'hotchkiss']],
    ['avioni', 'vis-lovac', ['bf109', 'fw190', 'sivi', 'pustinjski', 'zeleni', 'zuti-nos']],
    ['letelice-3d', 'ratni-avion-3d', ['dvokrilac', 'trokrilac', 'mesersmit', 'bombarder', 'f18']],
    ['vojnici', 'zastavnik', ['partizanski', 'italijanski']],
    ['vojnici', 'posada-topa', ['partizanska', 'italijanska']],
  ]) {
    const resolved = selections.map(look => findStory(kinds, `${kind}/${story}/${look}`).story)
    assert.equal(new Set(resolved).size, selections.length, story)
    for (const actor of resolved) assert.equal(actor.looks, undefined)
    assert.equal(findStory(kinds, `${kind}/${story}`).story, resolved[0])
  }
})

test('every old infantry variant remains reachable with its identity and combat role', async() => {
  const { italianLooks } = await import('/core3d/actor/derived/ww2/italianLooks.js')
  const { variants } = await import('/core3d/actor/derived/ww2/partisanLooks.js')
  for (const [prefix, choices] of [['italijanski-branilac-3d', italianLooks], ['saborci-jablanica', variants]]) {
    const roles = new Map()
    for (const [id, value] of Object.entries(choices)) {
      const resolved = findStory(kinds, `drugi-svetski-rat-3d/${prefix}/${id}`)
      assert.equal(resolved.look?.value, value, id)
      for (const look of resolved.story.looks.filter(look => look.value)) {
        assert.equal(Boolean(look.id.startsWith('italian-')), prefix.startsWith('italijanski'))
        assert.equal(look.value.weapon.rounds, value.weapon.rounds)
      }
      roles.set(id, resolved.story)
    }
    if (prefix.startsWith('italijanski')) {
      assert.equal(roles.get('rifle'), roles.get('rifleCoat'))
      assert.equal(roles.get('mg'), roles.get('mgCoat'))
      assert.notEqual(roles.get('rifle'), roles.get('mg'))
      assert.notEqual(roles.get('mp40'), roles.get('mg'))
    }
  }
})

test('search opens matching paths, restores disclosures and selection opens every ancestor', async() => {
  const root = document.createElement('nav')
  const storage = { value: '{"2D":false,"2D/Brodovi":false}', getItem() {
    return this.value
  }, setItem(key, value) {
    this.value = value
  } }
  const catalog = createCatalog(root, kinds, storage)
  const search = root.querySelector('input')
  search.value = 'mali camac'
  search.dispatchEvent(new Event('input'))
  const matches = [...root.querySelectorAll('a')].filter(link => !link.hidden)
  assert.equal(matches.length, 1)
  let parent = matches[0].parentElement
  while (parent !== root) {
    if (parent.tagName === 'DETAILS') assert.equal(parent.open, true)
    parent = parent.parentElement
  }
  search.value = ''
  search.dispatchEvent(new Event('input'))
  assert.equal(matches[0].closest('details').open, false)
  const { kind, story } = findStory(kinds, 'brodovi/nemacko-patrolno-plovilo/german-skiff')
  catalog.select(kind, story)
  assert.equal(matches[0].getAttribute('aria-current'), 'true')
  assert.equal(matches[0].closest('details').open, true)
  await new Promise(resolve => {
    setTimeout(resolve, 10)
  })
  const restored = document.createElement('nav')
  createCatalog(restored, kinds, storage)
  assert.equal(restored.querySelector('details').open, true)
  assert.equal(matches[0].parentElement.tagName, 'DETAILS')
  for (const link of root.querySelectorAll('a')) {
    let disclosures = 0
    for (let parent = link.parentElement; parent !== root; parent = parent.parentElement)
      if (parent.tagName === 'DETAILS') disclosures++
    assert.equal(disclosures, 2, link.textContent)
  }
  const ostali = [...root.querySelectorAll('h3')].find(heading => heading.textContent === 'Ostali').parentElement
  assert.equal(ostali, ostali.parentElement.lastElementChild)
  const italian = [...root.querySelectorAll('h3')].find(heading => heading.textContent === 'Italijani')
  assert.equal(italian.parentElement.tagName, 'SECTION')
  search.value = 'nema-takvog-aktera'
  search.dispatchEvent(new Event('input'))
  assert.equal(root.querySelector('p').hidden, false)
})
