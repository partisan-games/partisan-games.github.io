import { test } from 'node:test'
import assert from 'node:assert/strict'
import GameClock from '/core/runtime/GameClock.js'
import ResourceScope from '/core/runtime/ResourceScope.js'
import GameSession from '/core/runtime/GameSession.js'

test('two game clocks keep their own time and actions', () => {
  const a = new GameClock()
  const b = new GameClock()
  const fired = []
  a.after(1, () => fired.push('a'))
  b.after(1, () => fired.push('b'))

  a.advance(1)
  assert.deepEqual(fired, ['a'])
  assert.equal(b.now, 0)
  b.advance(.5)
  assert.deepEqual(fired, ['a'])
})

test('a delayed action runs once when due, and never once cancelled', () => {
  const clock = new GameClock()
  const fired = []
  clock.after(1, () => fired.push('due'))
  const cancelled = clock.after(1, () => fired.push('cancelled'))
  clock.cancel(cancelled)

  clock.advance(.99)
  assert.deepEqual(fired, [])
  clock.advance(.01)
  clock.advance(5)
  assert.deepEqual(fired, ['due'])
})

test('an action can cancel another one due in the same step', () => {
  const clock = new GameClock()
  const fired = []
  let second
  clock.after(1, () => {
    fired.push('first')
    clock.cancel(second)
  })
  second = clock.after(1, () => fired.push('second'))
  clock.advance(1)
  assert.deepEqual(fired, ['first'])
})

test('a scope runs every cleanup once, newest first, and a second dispose does nothing', () => {
  const scope = new ResourceScope()
  const ran = []
  scope.add(() => ran.push(1))
  scope.add(() => ran.push(2))

  scope.dispose()
  scope.dispose()
  assert.deepEqual(ran, [2, 1])
  assert.ok(scope.disposed)
})

test('a failing cleanup does not skip the others, and its error is not swallowed', () => {
  const scope = new ResourceScope()
  const ran = []
  scope.add(() => ran.push('first'))
  scope.add(() => {
    throw new Error('broken')
  })
  scope.add(() => ran.push('last'))

  assert.throws(() => scope.dispose(), /broken/)
  assert.deepEqual(ran, ['last', 'first'])
})

test('several failing cleanups are all reported', () => {
  const scope = new ResourceScope()
  scope.add(() => {
    throw new Error('one')
  })
  scope.add(() => {
    throw new Error('two')
  })
  assert.throws(() => scope.dispose(), error => error instanceof AggregateError && error.errors.length === 2)
})

test('a child scope ends with its parent, and only once when it ended earlier on its own', () => {
  const parent = new ResourceScope()
  const child = parent.child()
  const grandchild = child.child()
  let childCleanups = 0
  let grandchildCleanups = 0
  child.add(() => childCleanups++)
  grandchild.add(() => grandchildCleanups++)

  child.dispose()
  parent.dispose()
  assert.equal(childCleanups, 1)
  assert.equal(grandchildCleanups, 1)
  assert.ok(grandchild.disposed)
})

test('a cleanup added to an ended scope runs right away', () => {
  const scope = new ResourceScope()
  scope.dispose()
  let ran = false
  scope.add(() => {
    ran = true
  })
  assert.ok(ran)
})

test('a scope cancels its delayed actions when it ends first, and forgets the ones that already ran', () => {
  const clock = new GameClock()
  const scope = new ResourceScope({ clock })
  const child = scope.child()
  const fired = []
  scope.after(1, () => fired.push('ran'))
  child.after(2, () => fired.push('cancelled'))

  clock.advance(1)
  child.dispose()
  clock.advance(5)
  assert.deepEqual(fired, ['ran'])
  scope.dispose()
  assert.equal(scope.after(1, () => fired.push('late')), null)
  clock.advance(5)
  assert.deepEqual(fired, ['ran'])
})

test('a session goes from loading to ready, runs, pauses and resumes, and cannot go back once finished', () => {
  const session = new GameSession()
  assert.equal(session.state, 'loading')
  session.pause()
  assert.equal(session.state, 'loading')
  session.ready()
  session.start()
  assert.equal(session.state, 'running')
  session.pause()
  assert.equal(session.state, 'paused')
  session.resume()
  session.finish()
  session.start()
  session.resume()
  assert.equal(session.state, 'finished')
})

test('the gameplay clock moves only while the game runs', () => {
  const session = new GameSession()
  session.start()
  const fired = []
  session.gameplay.after(1, () => fired.push('respawn'))

  session.update(.5)
  session.pause()
  session.update(10)
  assert.equal(session.clock.now, .5)
  session.resume()
  session.update(.5)
  assert.deepEqual(fired, ['respawn'])
})

test('the first result ends gameplay, while a closing animation still plays to its end', () => {
  const session = new GameSession()
  session.start()
  const fired = []
  let gameplayCleanups = 0
  session.gameplay.add(() => gameplayCleanups++)
  session.gameplay.after(1, () => fired.push('spawn'))
  session.presentation.after(1, () => fired.push('explosion done'))

  session.finish()
  assert.equal(gameplayCleanups, 1)
  session.update(1)
  assert.deepEqual(fired, ['explosion done'])
  assert.equal(session.gameplay.after(1, () => fired.push('late spawn')), null)
})

test('a pause holds the closing animation too', () => {
  const session = new GameSession()
  session.start()
  const fired = []
  session.presentation.after(1, () => fired.push('shown'))
  session.pause()
  session.update(5)
  assert.deepEqual(fired, [])
})

test('disposing a session ends every scope once, aborts its signal and stops both clocks', () => {
  const session = new GameSession()
  session.start()
  const ended = []
  session.scope.add(() => ended.push('listener'))
  session.gameplay.add(() => ended.push('gameplay'))
  session.presentation.add(() => ended.push('presentation'))
  session.presentation.after(1, () => ended.push('too late'))

  session.dispose()
  session.dispose()
  session.update(5)
  assert.deepEqual(ended.sort(), ['gameplay', 'listener', 'presentation'])
  assert.equal(session.state, 'disposed')
  assert.ok(session.signal.aborted)
})

test('an async result that arrives after the game is gone is released and stops the caller', async() => {
  const session = new GameSession()
  let finishLoad
  const load = new Promise(resolve => {
    finishLoad = resolve
  })
  const released = []
  const waiting = session.keep(load, model => released.push(model))

  session.dispose()
  finishLoad('model')
  await assert.rejects(waiting, { name: 'AbortError' })
  assert.deepEqual(released, ['model'])
  assert.equal(await new GameSession().keep(Promise.resolve('kept')), 'kept')
})
