import { test } from 'node:test'
import assert from 'node:assert/strict'
import NativeAllocations from '/core3d/physics/NativeAllocations.js'

/** A stand-in for a native Ammo object, which Ammo.destroy frees through its __destroy__. */
const native = (props = {}) => ({ ...props, __destroy__() {} })

test('owned native objects are freed newest first, each once, also a shape shared by two bodies', () => {
  const natives = new NativeAllocations()
  const freed = []
  const shape = natives.own(native({ name: 'shape' }))
  const body = natives.own(native({ name: 'body' }))
  natives.own(shape) // a second body on the same shape
  const other = natives.own(native({ name: 'other body' }))
  assert.equal(natives.size, 3)

  natives.dispose(object => freed.push(object.name))
  assert.deepEqual(freed, ['other body', 'body', 'shape'])
  assert.equal(body.name, 'body', 'own returns the object it takes')
  assert.equal(other.name, 'other body')
})

test('after leaving and entering a game again and again, nothing owned is left', () => {
  const natives = new NativeAllocations()
  let alive = 0
  for (let game = 0; game < 5; game++) {
    for (let i = 0; i < 10; i++) {
      alive++
      natives.own(native())
    }
    natives.dispose(() => alive--)
    natives.dispose(() => alive--) // a second end of the same game frees nothing
    assert.equal(natives.size, 0)
    assert.equal(alive, 0)
  }
})

test('an object Ammo cannot destroy is refused when it is owned, not when the game ends', () => {
  class btVehicleTuning {}
  assert.throws(() => new NativeAllocations().own(new btVehicleTuning()), /btVehicleTuning cannot be destroyed/)
})
