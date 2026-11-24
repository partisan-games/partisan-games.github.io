import { test } from 'node:test'
import assert from 'node:assert/strict'

test('presentation scene modules import without starting model fetches', async t => {
  const { createPageElements } = await import('./helpers/dom.js')
  createPageElements()
  let requests = 0
  t.mock.method(globalThis, 'fetch', () => {
    requests++
    return Promise.reject(new Error('Scene import must not start a model request'))
  })
  for (const name of ['drvar', 'locomotive'])
    await import(`/scenes/${name}/Main.js`)
  assert.equal(requests, 0)
})
