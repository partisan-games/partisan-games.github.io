import { test } from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { createPageElements } from './helpers/dom.js'

test('a leaf gallery shows its originals, filters folders and copies project-relative paths without opening the image', async t => {
  createPageElements()
  const html = readFileSync(new URL('../../art/2d/ameri/diverzanti/index.html', import.meta.url), 'utf8')
  document.body.innerHTML = html.split('<body>')[1].split('</body>')[0]
  const pictures = [...document.querySelectorAll('.gallery img')]
  assert.equal(pictures.length, 5)
  for (const picture of pictures) {
    assert.ok(picture.getAttribute('src').includes('assets/images/armies/ameri/diverzanti/'))
    assert.equal(picture.getAttribute('loading'), 'lazy')
    assert.ok(Number(picture.getAttribute('width')) > 0)
  }
  const selected = document.querySelector('.tree [aria-current="page"]')
  assert.equal(document.querySelector('[data-path="2d/game-ready"]'), null)
  assert.equal(selected.textContent, 'diverzanti')
  await import('/art/navigation.js')
  const search = document.getElementById('folder-search')
  const filter = value => {
    search.value = value
    search.dispatchEvent(new Event('input'))
  }
  filter('ameri diverzanti')
  assert.equal(document.querySelector('[data-path="2d/ameri"]').hidden, false)
  assert.equal(document.querySelector('[data-path="2d/ameri/diverzanti"]').hidden, false)
  assert.equal(document.querySelector('[data-path="2d/nemci"]').hidden, true)
  filter('nepostojeci-folder-xyz')
  assert.equal(document.getElementById('no-folders').hidden, false)
  filter('')
  assert.equal(document.querySelector('[data-path="2d/nemci"]').hidden, false)
  assert.equal(document.querySelector('[data-path="2d/ameri"] details').open, true)
  assert.equal(document.getElementById('no-folders').hidden, true)
  const names = []
  t.mock.method(navigator.clipboard, 'writeText', async name => { names.push(name) })
  const button = document.querySelector('[data-copy-path]')
  assert.equal(button.closest('a'), null, 'copying a name cannot follow the image link')
  button.click()
  await new Promise(resolve => setImmediate(resolve))
  assert.deepEqual(names, ['assets/images/armies/ameri/diverzanti/diverzant-01.png'])
  const status = button.parentElement.querySelector('[data-copy-status]')
  assert.equal(status.textContent, '· Kopirano')
  assert.equal(button.disabled, false)
  t.mock.method(navigator.clipboard, 'writeText', async() => { throw new Error('Denied') })
  let selectedFilename
  // Happy DOM does not implement the browser's legacy clipboard method.
  document.execCommand = () => false
  t.after(() => {
    t.mock.restoreAll()
    delete document.execCommand
  })
  t.mock.method(document, 'execCommand', () => {
    selectedFilename = document.querySelector('.clipboard-field').value
    return true
  })
  button.click()
  await new Promise(resolve => setImmediate(resolve))
  assert.equal(selectedFilename, 'assets/images/armies/ameri/diverzanti/diverzant-01.png')
  assert.equal(document.querySelector('.clipboard-field'), null)
  t.mock.method(document, 'execCommand', () => false)
  button.click()
  await new Promise(resolve => setImmediate(resolve))
  assert.equal(status.textContent, '· Kopiranje nije uspelo')
  assert.equal(button.disabled, false)
})
