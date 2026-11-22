import { test } from 'node:test'
import assert from 'node:assert/strict'
import ContactEvents from '/core3d/physics/ContactEvents.js'

const point = { x: () => 1, y: () => 2, z: () => 3 }
const dispatcher = distance => ({
  getNumManifolds: () => 1,
  getManifoldByIndexInternal: () => ({
    getBody0: () => ({ id: 10 }), getBody1: () => ({ id: 20 }), getNumContacts: () => 1,
    getContactPoint: () => ({ getDistance: () => distance, getPositionWorldOnA: () => point, getPositionWorldOnB: () => point }),
  }),
})

test('opted-in real contact emits a copied point once and repeated native manifolds do not repeat it', () => {
  const contacts = new ContactEvents(body => body.id), seen = []
  contacts.once({ id: 10 }, (value, other) => {
    assert.equal(other, 20)
    seen.push(value)
  })
  contacts.update(dispatcher(.1))
  assert.deepEqual(seen, [])
  contacts.update(dispatcher(-.01))
  contacts.update(dispatcher(-.01))
  assert.deepEqual(seen, [{ x: 1, y: 2, z: 3 }])
  assert.notEqual(seen[0], point)
})

test('idle, removed and disposed listeners never enumerate contacts or deliver a late hit', () => {
  const contacts = new ContactEvents(body => body.id)
  const unused = { getNumManifolds() {
    throw new Error('idle world scanned contacts')
  } }
  contacts.update(unused)
  contacts.once({ id: 10 }, () => assert.fail('removed contact'))
  contacts.remove({ id: 10 })
  contacts.update(unused)
  contacts.once({ id: 20 }, () => assert.fail('disposed contact'))
  contacts.clear()
  contacts.update(unused)
})
